import {
  MarkdownView,
  Plugin,
  Editor,
  Menu,
  MenuItem,
  TFile,
  normalizePath,
  Notice,
  addIcon,
  MarkdownFileInfo,
  SuggestModal,
} from "obsidian";
import { resolve, basename, dirname } from "path-browserify";

import { isAssetTypeAnImage, arrayToObject, getFileHash } from "./utils";
import { downloadAllImageFiles } from "./download";
import { UploaderManager } from "./uploader/index";
import { PicGoDeleter } from "./deleter";
import Helper from "./helper";
import { t } from "./lang/helpers";
import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting";

import type { Image, LinkReplacementProfile } from "./types";

class ProfileSuggestModal extends SuggestModal<LinkReplacementProfile> {
  plugin: imageAutoUploadPlugin;

  constructor(plugin: imageAutoUploadPlugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  getSuggestions(query: string): LinkReplacementProfile[] {
    try {
      const profiles: LinkReplacementProfile[] = JSON.parse(this.plugin.settings.linkReplacementConfig || "[]");
      return profiles.filter(profile =>
        profile.name.toLowerCase().includes(query.toLowerCase())
      );
    } catch (e) {
      console.error("Failed to parse link replacement config", e);
      return [];
    }
  }

  renderSuggestion(profile: LinkReplacementProfile, el: HTMLElement) {
    el.createEl("div", { text: profile.name });
  }

  onChooseSuggestion(profile: LinkReplacementProfile, evt: MouseEvent | KeyboardEvent) {
    this.plugin.applyLinkReplacement(profile);
  }
}

export default class imageAutoUploadPlugin extends Plugin {
  settings: PluginSettings;
  helper: Helper;
  editor: Editor;
  picGoDeleter: PicGoDeleter;

  async loadSettings() {
    const data = await this.loadData();
    
    // Migration: Convert old array format to JSON string if needed
    if (data && Array.isArray(data.linkReplacementProfiles)) {
      data.linkReplacementConfig = JSON.stringify(data.linkReplacementProfiles, null, 2);
      delete data.linkReplacementProfiles;
    }

    this.settings = Object.assign(DEFAULT_SETTINGS, data);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {}

  async onload() {
    await this.loadSettings();

    this.helper = new Helper(this.app);
    this.picGoDeleter = new PicGoDeleter(this);

    addIcon(
      "upload",
      `<svg t="1636630783429" class="icon" viewBox="0 0 100 100" version="1.1" p-id="4649" xmlns="http://www.w3.org/2000/svg">
      <path d="M 71.638 35.336 L 79.408 35.336 C 83.7 35.336 87.178 38.662 87.178 42.765 L 87.178 84.864 C 87.178 88.969 83.7 92.295 79.408 92.295 L 17.249 92.295 C 12.957 92.295 9.479 88.969 9.479 84.864 L 9.479 42.765 C 9.479 38.662 12.957 35.336 17.249 35.336 L 25.019 35.336 L 25.019 42.765 L 17.249 42.765 L 17.249 84.864 L 79.408 84.864 L 79.408 42.765 L 71.638 42.765 L 71.638 35.336 Z M 49.014 10.179 L 67.326 27.688 L 61.835 32.942 L 52.849 24.352 L 52.849 59.731 L 45.078 59.731 L 45.078 24.455 L 36.194 32.947 L 30.702 27.692 L 49.012 10.181 Z" p-id="4650" fill="#8a8a8a"></path>
    </svg>`
    );

    this.addSettingTab(new SettingTab(this.app, this));

    this.addCommand({
      id: "Upload all images",
      name: "Upload all images",
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (leaf) {
          if (!checking) {
            this.uploadAllFile();
          }
          return true;
        }
        return false;
      },
    });
    this.addCommand({
      id: "Download all images",
      name: "Download all images",
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (leaf) {
          if (!checking) {
            downloadAllImageFiles(this);
          }
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: "Delete all images",
      name: t("Delete all images in current file"),
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (leaf) {
          if (!checking) {
            this.deleteAllImages();
          }
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: "apply-link-replacement",
      name: t("Apply Link Replacement"),
      checkCallback: (checking: boolean) => {
        const leaf = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (leaf) {
          if (!checking) {
            try {
              const profiles = JSON.parse(this.settings.linkReplacementConfig || "[]");
              if (profiles.length === 0) {
                new Notice(t("No profiles found") + ", " + t("Please create a profile first"));
                return;
              }
              new ProfileSuggestModal(this).open();
            } catch (e) {
              new Notice("Invalid JSON configuration");
            }
          }
          return true;
        }
        return false;
      },
    });

    this.setupPasteHandler();
    this.registerFileMenu();
    this.registerSelection();
  }

  /**
   * 获取当前使用的上传器
   */
  getUploader() {
    const uploader = new UploaderManager(this.settings.uploader, this);

    return uploader;
  }

  /**
   * 上传图片
   */
  upload(images: Image[] | string[]) {
    let uploader = this.getUploader();
    return uploader.upload(images);
  }

  /**
   * 单张图片上传（用于进度显示）
   */
  async uploadSingle(image: Image): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // 检查缓存
      let hash = "";
      if (this.settings.enableCache && image.file) {
        const buffer = await this.app.vault.readBinary(image.file);
        hash = getFileHash(Buffer.from(buffer));
        if (this.settings.imageCache && this.settings.imageCache[hash]) {
          return { success: true, url: this.settings.imageCache[hash] };
        }
      }

      let uploader = this.getUploader();
      const res = await uploader.upload([image] as Image[]);
      if (res.success && res.result.length > 0) {
        // 更新缓存
        if (this.settings.enableCache && hash) {
          this.settings.imageCache[hash] = res.result[0];
          await this.saveSettings();
        }
        return { success: true, url: res.result[0] };
      }
      return { success: false, error: res.msg || "Upload failed" };
    } catch (e: any) {
      return { success: false, error: e.message || "Upload failed" };
    }
  }

  /**
   * 带进度显示的批量上传
   */
  async uploadWithProgress(
    imageList: Image[],
    onProgress: (current: number, total: number, imageName: string) => void
  ): Promise<{ success: boolean; results: { image: Image; url?: string; error?: string }[] }> {
    const results: { image: Image; url?: string; error?: string }[] = [];
    const total = imageList.length;

    for (let i = 0; i < imageList.length; i++) {
      const image = imageList[i];
      onProgress(i + 1, total, image.name || image.path);

      const res = await this.uploadSingle(image);
      results.push({
        image,
        url: res.url,
        error: res.error,
      });
    }

    const successCount = results.filter(r => r.url).length;
    return {
      success: successCount > 0,
      results,
    };
  }

  /**
   * 通过剪贴板上传图片
   */
  uploadByClipboard(fileList?: FileList) {
    let uploader = this.getUploader();
    return uploader.uploadByClipboard(fileList);
  }

  registerSelection() {
    this.registerEvent(
      this.app.workspace.on(
        "editor-menu",
        (menu: Menu, editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
          if (this.app.workspace.getLeavesOfType("markdown").length === 0) {
            return;
          }
          const selection = editor.getSelection();
          if (selection) {
            const markdownRegex = /!\[.*\]\((.*)\)/g;
            const markdownMatch = markdownRegex.exec(selection);
            if (markdownMatch && markdownMatch.length > 1) {
              const markdownUrl = markdownMatch[1];
              if (
                this.settings.uploadedImages.find(
                  (item: { imgUrl: string }) => item.imgUrl === markdownUrl
                )
              ) {
                this.addRemoveMenu(menu, markdownUrl, editor);
              }
            }
          }
        }
      )
    );
  }

  addRemoveMenu = (menu: Menu, imgPath: string, editor: Editor) => {
    menu.addItem((item: MenuItem) =>
      item
        .setIcon("trash-2")
        .setTitle(t("Delete image using PicList"))
        .onClick(async () => {
          try {
            const selectedItem = this.settings.uploadedImages.find(
              (item: { imgUrl: string }) => item.imgUrl === imgPath
            );
            if (selectedItem) {
              const res = await this.picGoDeleter.deleteImage([selectedItem]);
              if (res.success) {
                new Notice(t("Delete successfully"));
                const selection = editor.getSelection();
                if (selection) {
                  editor.replaceSelection("");
                }
                this.settings.uploadedImages =
                  this.settings.uploadedImages.filter(
                    (item: { imgUrl: string }) => item.imgUrl !== imgPath
                  );
                this.saveSettings();
              } else {
                new Notice(t("Delete failed"));
              }
            }
          } catch {
            new Notice(t("Error, could not delete"));
          }
        })
    );
  };

  registerFileMenu() {
    this.registerEvent(
      this.app.workspace.on(
        "file-menu",
        (menu: Menu, file: TFile, source: string, leaf) => {
          if (source === "canvas-menu") return false;
          if (!isAssetTypeAnImage(file.path)) return false;

          menu.addItem((item: MenuItem) => {
            item
              .setTitle(t("upload"))
              .setIcon("upload")
              .onClick(() => {
                if (!(file instanceof TFile)) {
                  return false;
                }
                this.fileMenuUpload(file);
              });
          });
        }
      )
    );
  }

  fileMenuUpload(file: TFile) {
    let imageList: Image[] = [];
    const fileArray = this.helper.getAllFiles();

    for (const match of fileArray) {
      const imageName = match.name;
      const encodedUri = match.path;

      const fileName = basename(decodeURI(encodedUri));

      if (file && file.name === fileName) {
        if (isAssetTypeAnImage(file.path)) {
          imageList.push({
            path: file.path,
            name: imageName,
            source: match.source,
            file: file,
          });
        }
      }
    }

    if (imageList.length === 0) {
      new Notice(t("Can not find image file"));
      return;
    }

    this.upload(imageList).then(res => {
      if (!res.success) {
        new Notice("Upload error");
        return;
      }

      let uploadUrlList = res.result;
      this.replaceImage(imageList, uploadUrlList);
    });
  }

  filterFile(fileArray: Image[]) {
    const imageList: Image[] = [];

    for (const match of fileArray) {
      // PR #164: 增加空值检查，防止 undefined.startsWith 错误
      if (!match || !match.path) {
        continue;
      }

      if (match.path.startsWith("http")) {
        if (this.settings.workOnNetWork) {
          if (
            !this.helper.hasBlackDomain(
              match.path,
              this.settings.newWorkBlackDomains
            )
          ) {
            imageList.push({
              path: match.path,
              name: match.name,
              source: match.source,
            });
          }
        }
      } else {
        imageList.push({
          path: match.path,
          name: match.name,
          source: match.source,
        });
      }
    }

    return imageList;
  }

  /**
   * 替换上传的图片
   */
  replaceImage(imageList: Image[], uploadUrlList: string[]) {
    let content = this.helper.getValue();

    imageList.map(item => {
      const uploadImage = uploadUrlList.shift();

      let name = this.handleName(item.name);
      let replacement: string;

      if (this.settings.imageFormat === "figure") {
        // HTML figure 格式，保留图注（caption）
        const caption = this.getFigcaptionText(item.name, item.source);
        const altText = this.extractAltText(item.name, item.source);
        
        // 构建 figure 样式
        const figureAlign = this.settings.figureAlign || "center";
        const figureStyle = `text-align:${figureAlign};`;
        
        // 构建 figcaption 样式
        const captionStyles: string[] = [];
        if (this.settings.figureCaptionMarginTop) {
          captionStyles.push(`margin-top:${this.settings.figureCaptionMarginTop}`);
        }
        if (this.settings.figureCaptionFontSize) {
          captionStyles.push(`font-size:${this.settings.figureCaptionFontSize}`);
        }
        if (this.settings.figureCaptionColor) {
          captionStyles.push(`color:${this.settings.figureCaptionColor}`);
        }
        const captionStyle = captionStyles.length > 0 ? ` style="${captionStyles.join(';')};"` : "";
        
        // 根据是否有 caption 决定是否显示 figcaption
        if (caption) {
          replacement = `<figure style="${figureStyle}">\n  <img src="${uploadImage}" alt="${altText}">\n  <figcaption${captionStyle}>${caption}</figcaption>\n</figure>`;
        } else {
          replacement = `<figure style="${figureStyle}">\n  <img src="${uploadImage}" alt="${altText}">\n</figure>`;
        }
      } else {
        // 标准 Markdown 格式
        replacement = `![${name}](${uploadImage})`;
      }

      content = content.replaceAll(item.source, replacement);
    });

    this.helper.setValue(content);

    if (this.settings.deleteSource) {
      imageList.map(image => {
        if (image.file && !image.path.startsWith("http")) {
          this.app.fileManager.trashFile(image.file);
        }
      });
    }
  }

  /**
   * 从 wiki 链接或 markdown 链接中提取图注（caption）
   * 例如：![[image.png|拷贝漫画]] -> 拷贝漫画
   * 返回 null 表示没有明确的 caption
   */
  extractCaption(name: string, source: string): string | null {
    // Wiki 格式：![[filename|caption]]
    const wikiMatch = source.match(/!\[\[.*?\|(.*?)\]\]/);
    if (wikiMatch && wikiMatch[1]) {
      return wikiMatch[1].trim();
    }
    // Markdown 格式：![alt](url "title") -> title 作为 caption
    const mdTitleMatch = source.match(/!\[.*?\]\(.*?\s+"(.*?)"\)/);
    if (mdTitleMatch && mdTitleMatch[1]) {
      return mdTitleMatch[1].trim();
    }
    // 没有明确的 caption
    return null;
  }

  /**
   * 获取用于 figcaption 的文本
   */
  getFigcaptionText(name: string, source: string): string {
    const caption = this.extractCaption(name, source);
    if (caption) {
      return caption;
    }
    // 如果 figureCaptionMode 是 always，使用文件名作为默认值
    if (this.settings.figureCaptionMode === "always") {
      return name ? name.replace(/\.[^.]+$/, "") : "";
    }
    return "";
  }

  /**
   * 从源链接中提取 alt 文本
   */
  extractAltText(name: string, source: string): string {
    // Wiki 格式：![[filename|caption]] -> 使用文件名作为 alt
    const wikiMatch = source.match(/!\[\[(.*?)(?:\|.*?)?\]\]/);
    if (wikiMatch && wikiMatch[1]) {
      return wikiMatch[1].replace(/\.[^.]+$/, "").trim();
    }
    // Markdown 格式：![alt](url)
    const mdMatch = source.match(/!\[(.*?)\]/);
    if (mdMatch && mdMatch[1]) {
      return mdMatch[1].trim();
    }
    return name ? name.replace(/\.[^.]+$/, "") : "";
  }

  /**
   * 删除当前文件中的所有图床图片
   */
  async deleteAllImages() {
    const editor = this.helper.getEditor();
    if (!editor) return;

    const fileArray = this.helper.getAllFiles();
    const uploadedImages = this.settings.uploadedImages || [];

    // 找到当前文章中所有已上传的图片
    const imagesInArticle = fileArray.filter(file =>
      file.path.startsWith("http") &&
      uploadedImages.some((u: { imgUrl: string }) => u.imgUrl === file.path)
    );

    if (imagesInArticle.length === 0) {
      new Notice(t("No uploaded images found"));
      return;
    }

    // 获取这些图片的完整配置信息
    const imagesToDeleteMap = new Map();
    imagesInArticle.forEach(file => {
      const imageConfig = uploadedImages.find((u: { imgUrl: string }) => u.imgUrl === file.path);
      if (imageConfig) {
        imagesToDeleteMap.set(file.path, imageConfig);
      }
    });
    const imagesToDelete = Array.from(imagesToDeleteMap.values());

    // 调用删除接口
    try {
      const res = await this.picGoDeleter.deleteImage(imagesToDelete);
      if (res.success) {
        new Notice(t("Delete successfully"));

        // 从设置中移除
        this.settings.uploadedImages = this.settings.uploadedImages.filter(
          (u: { imgUrl: string }) => !imagesToDeleteMap.has(u.imgUrl)
        );
        await this.saveSettings();

        // 从文档中移除链接
        let content = editor.getValue();
        imagesInArticle.forEach(image => {
          // 只替换匹配到的那一个引用
          content = content.replace(image.source, "");
        });
        this.helper.setValue(content);
      } else {
        new Notice(t("Delete failed"));
      }
    } catch (e) {
      console.error(e);
      new Notice(t("Error, could not delete"));
    }
  }

  /**
   * 上传所有图片
   */
  uploadAllFile() {
    const activeFile = this.app.workspace.getActiveFile();
    const fileMap = arrayToObject(this.app.vault.getFiles(), "name");
    const filePathMap = arrayToObject(this.app.vault.getFiles(), "path");
    let imageList: (Image & { file: TFile | null })[] = [];
    const fileArray = this.filterFile(this.helper.getAllFiles());

    for (const match of fileArray) {
      const imageName = match.name;
      const uri = decodeURI(match.path);

      if (uri.startsWith("http")) {
        imageList.push({
          path: match.path,
          name: imageName,
          source: match.source,
          file: null,
        });
      } else {
        const fileName = basename(uri);
        let file: TFile | undefined | null;
        // 优先匹配绝对路径
        if (filePathMap[uri]) {
          file = filePathMap[uri];
        }

        // 相对路径
        if ((!file && uri.startsWith("./")) || uri.startsWith("../")) {
          const filePath = normalizePath(
            resolve(dirname(activeFile.path), uri)
          );

          file = filePathMap[filePath];
        }

        // 尽可能短路径
        if (!file) {
          file = fileMap[fileName];
        }

        if (file) {
          if (isAssetTypeAnImage(file.path)) {
            imageList.push({
              path: normalizePath(file.path),
              name: imageName,
              source: match.source,
              file: file,
            });
          }
        }
      }
    }

    if (imageList.length === 0) {
      new Notice(t("Can not find image file"));
      return;
    } else {
      new Notice(t("Upload start").replace("{count}", String(imageList.length)));
    }

    // 创建进度通知
    let progressNotice: Notice | null = null;
    
    this.uploadWithProgress(imageList, (current, total, imageName) => {
      // 更新进度通知
      const progressText = t("Upload progress")
        .replace("{current}", String(current))
        .replace("{total}", String(total))
        .replace("{name}", imageName.length > 20 ? imageName.substring(0, 20) + "..." : imageName);
      
      if (progressNotice) {
        progressNotice.setMessage(progressText);
      } else {
        progressNotice = new Notice(progressText, 0); // 0 表示不自动关闭
      }
    }).then(({ success, results }) => {
      // 关闭进度通知
      if (progressNotice) {
        progressNotice.hide();
      }

      const successResults = results.filter(r => r.url);
      const failedResults = results.filter(r => !r.url);

      if (successResults.length === 0) {
        new Notice(t("Upload failed all"));
        return;
      }

      // 显示上传结果
      if (failedResults.length > 0) {
        new Notice(
          t("Upload partial success")
            .replace("{success}", String(successResults.length))
            .replace("{failed}", String(failedResults.length))
        );
      } else {
        new Notice(
          t("Upload success all").replace("{count}", String(successResults.length))
        );
      }

      const currentFile = this.app.workspace.getActiveFile();
      if (activeFile.path !== currentFile.path) {
        new Notice(t("File has been changedd, upload failure"));
        return;
      }

      // 替换成功上传的图片
      const successImages = successResults.map(r => r.image);
      const successUrls = successResults.map(r => r.url!);
      this.replaceImage(successImages, successUrls);
    });
  }

  setupPasteHandler() {
    this.registerEvent(
      this.app.workspace.on(
        "editor-paste",
        (evt: ClipboardEvent, editor: Editor, markdownView: MarkdownView) => {
          const allowUpload = this.helper.getFrontmatterValue(
            "image-auto-upload",
            this.settings.uploadByClipSwitch
          );

          let files = evt.clipboardData.files;
          if (!allowUpload) {
            return;
          }

          // 剪贴板内容有md格式的图片时
          if (this.settings.workOnNetWork) {
            const clipboardValue = evt.clipboardData.getData("text/plain");
            const imageList = this.helper
              .getImageLink(clipboardValue)
              .filter(image => image.path.startsWith("http"))
              .filter(
                image =>
                  !this.helper.hasBlackDomain(
                    image.path,
                    this.settings.newWorkBlackDomains
                  )
              );

            if (imageList.length !== 0) {
              this.upload(imageList).then(res => {
                let uploadUrlList = res.result;
                this.replaceImage(imageList, uploadUrlList);
              });
            }
          }

          // 剪贴板中是图片时进行上传
          if (this.canUpload(evt.clipboardData)) {
            this.uploadFileAndEmbedImgurImage(
              editor,
              async (editor: Editor, pasteId: string) => {
                let res: any;
                res = await this.uploadByClipboard(evt.clipboardData.files);

                if (res.code !== 0) {
                  this.handleFailedUpload(editor, pasteId, res.msg);
                  return;
                }
                const url = res.data;

                return url;
              },
              evt.clipboardData
            ).catch();
            evt.preventDefault();
          }
        }
      )
    );
    this.registerEvent(
      this.app.workspace.on(
        "editor-drop",
        async (evt: DragEvent, editor: Editor, markdownView: MarkdownView) => {
          // when ctrl key is pressed, do not upload image, because it is used to set local file
          if (evt.ctrlKey) {
            return;
          }
          const allowUpload = this.helper.getFrontmatterValue(
            "image-auto-upload",
            this.settings.uploadByClipSwitch
          );

          if (!allowUpload) {
            return;
          }

          let files = evt.dataTransfer.files;
          if (files.length !== 0 && files[0].type.startsWith("image")) {
            let sendFiles: Array<string> = [];
            let files = evt.dataTransfer.files;
            Array.from(files).forEach((item, index) => {
              if (item.path) {
                sendFiles.push(item.path);
              } else {
                const { webUtils } = require("electron");
                const path = webUtils.getPathForFile(item);
                sendFiles.push(path);
              }
            });
            evt.preventDefault();

            const data = await this.upload(sendFiles);

            if (data.success) {
              data.result.map((value: string) => {
                let pasteId = (Math.random() + 1).toString(36).substr(2, 5);
                this.insertTemporaryText(editor, pasteId);
                this.embedMarkDownImage(editor, pasteId, value, files[0].name);
              });
            } else {
              new Notice("Upload error");
            }
          }
        }
      )
    );
  }

  canUpload(clipboardData: DataTransfer) {
    this.settings.applyImage;
    const files = clipboardData.files;
    const text = clipboardData.getData("text");

    const hasImageFile =
      files.length !== 0 && files[0].type.startsWith("image");
    if (hasImageFile) {
      if (!!text) {
        return this.settings.applyImage;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  async uploadFileAndEmbedImgurImage(
    editor: Editor,
    callback: Function,
    clipboardData: DataTransfer
  ) {
    let pasteId = (Math.random() + 1).toString(36).substr(2, 5);
    this.insertTemporaryText(editor, pasteId);
    const name = clipboardData.files[0].name;

    try {
      const url = await callback(editor, pasteId);
      this.embedMarkDownImage(editor, pasteId, url, name);
    } catch (e) {
      this.handleFailedUpload(editor, pasteId, e);
    }
  }

  insertTemporaryText(editor: Editor, pasteId: string) {
    let progressText = imageAutoUploadPlugin.progressTextFor(pasteId);
    editor.replaceSelection(progressText + "\n");
  }

  private static progressTextFor(id: string) {
    return `![Uploading file...${id}]()`;
  }

  embedMarkDownImage(
    editor: Editor,
    pasteId: string,
    imageUrl: any,
    name: string = ""
  ) {
    let progressText = imageAutoUploadPlugin.progressTextFor(pasteId);
    name = this.handleName(name);

    let markDownImage = `![${name}](${imageUrl})`;

    imageAutoUploadPlugin.replaceFirstOccurrence(
      editor,
      progressText,
      markDownImage
    );
  }

  handleFailedUpload(editor: Editor, pasteId: string, reason: any) {
    new Notice(reason);
    console.error("Failed request: ", reason);
    let progressText = imageAutoUploadPlugin.progressTextFor(pasteId);
    imageAutoUploadPlugin.replaceFirstOccurrence(
      editor,
      progressText,
      "⚠️upload failed, check dev console"
    );
  }

  handleName(name: string) {
    const imageSizeSuffix = this.settings.imageSizeSuffix || "";

    if (this.settings.imageDesc === "origin") {
      return `${name}${imageSizeSuffix}`;
    } else if (this.settings.imageDesc === "none") {
      return "";
    } else if (this.settings.imageDesc === "removeDefault") {
      if (name === "image.png") {
        return "";
      } else {
        return `${name}${imageSizeSuffix}`;
      }
    } else {
      return `${name}${imageSizeSuffix}`;
    }
  }

  static replaceFirstOccurrence(
    editor: Editor,
    target: string,
    replacement: string
  ) {
    let lines = editor.getValue().split("\n");
    for (let i = 0; i < lines.length; i++) {
      let ch = lines[i].indexOf(target);
      if (ch != -1) {
        let from = { line: i, ch: ch };
        let to = { line: i, ch: ch + target.length };
        editor.replaceRange(replacement, from, to);
        break;
      }
    }
  }

  applyLinkReplacement(profile: LinkReplacementProfile) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const editor = view.editor;
    let content = editor.getValue();
    let hasChanges = false;

    profile.rules.forEach(rule => {
      if (!rule.enabled) return;

      try {
        const regex = new RegExp(rule.pattern, rule.flags || "g");
        if (regex.test(content)) {
          content = content.replace(regex, rule.replacement);
          hasChanges = true;
        }
      } catch (e) {
        console.error("Invalid regex:", rule.pattern, e);
        new Notice(`Invalid regex in rule: ${rule.pattern}`);
      }
    });

    if (hasChanges) {
      editor.setValue(content);
      new Notice(t("Replacement applied"));
    } else {
      new Notice(t("No matches found"));
    }
  }
}

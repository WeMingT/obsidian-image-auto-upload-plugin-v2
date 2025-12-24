# Obsidian Image Auto Upload Plugin

这是一个支持 PicGo、PicList、PicGo-Core 上传图片到图床的工具
**更新插件后记得重启一下 Obsidian**

**未在 Mac 进行过测试**

# 开始

1. 安装 PicGo 工具，并进行配置，配置参考[官网](https://github.com/Molunerfinn/PicGo)
2. 开启 PicGo 的 Server 服务，并记住端口号
3. 安装插件
4. 打开插件配置项，设置为`http://127.0.0.1:{{PicGo设置的端口号}}/upload`（例如：`http://127.0.0.1:36677/upload`）
5. 接下来试试看能否上传成功

## 设置图床和配置名

如果你使用的是 PicList(version >= 2.5.3)，你可以通过 url 参数设置图床和配置名。
例如：`http://127.0.0.1:36677/upload?picbed=smms&configName=piclist`
这将会上传图片到 `smms` 图床，并且使用配置名为`piclist`的图床设置。
使用这个功能，你可以在不同的 Obsidian vault 中上传到不同的图床。

# 特性

## 剪切板上传

支持黏贴剪切板的图片的时候直接上传，目前支持复制系统内图像直接上传。

支持 ".png", ".jpg", ".jpeg", ".bmp", ".gif", ".svg", ".tiff", ".webp", ".avif"

该功能在 PicGo 2.3.0-beta7 版本中无法使用，请更换其他版本

支持通过设置 `frontmatter` 来控制单个文件的上传，默认值为 `true`，控制关闭请将该值设置为 `false`，**实时预览模式下需修改值为复选框**

```yaml
---
image-auto-upload: true
---
```

## 批量上传一个文件中的所有图像文件

输入 `ctrl+P` 呼出面板，输入 `upload all images`，点击回车，就会自动开始上传。

路径解析优先级，会依次按照优先级查找：

1. 绝对路径，指基于库的绝对路径
2. 相对路径，以./或../开头
3. 尽可能简短的形式

## 批量删除当前文件中的所有图床图片 (New!)

输入 `ctrl+P` 呼出面板，输入 `Delete all images in current file` (删除当前文件中的所有图床图片)，点击回车。这将从远程服务器（PicGo/PicList）删除当前文件中所有通过此插件上传的图片，并从文档中移除这些图片的链接。

**注意**：此功能需要正确配置删除接口（通常由 PicList 支持）。

## 批量下载网络图片到本地

输入 `ctrl+P` 呼出面板，输入 `download all images`，点击回车，就会自动开始下载。只在 win 进行过测试

## 支持右键菜单上传图片

~~只支持使用标准 md 语法下的基于当前笔记的相对路径。~~

目前已支持标准 md 以及 wiki 格式。支持相对路径以及绝对路径，需要进行正确设置，不然会引发奇怪的问题

## 支持拖拽上传

仅在使用 picGo 或 picList 客户端时生效

## 支持 Picgo-Core

目前已经全功能支持

~~目前只支持粘贴时上传图片~~

## 支持 server 远程模式

你可以将 [PicList](https://github.com/Kuingsmile/PicList/releases) 或 [PicList-Core](https://github.com/Kuingsmile/PicList-Core) 部署在服务器上并启用 server 模式来实现图片上传

[PicList](https://github.com/Kuingsmile/PicList/releases) 2.6.3 及以上 或 [PicList-Core](https://github.com/Kuingsmile/PicList-Core)1.3.0 以上版本支持

在该模式下不支持上传网络图片选项
如果粘贴时上传图片失败，你也可以尝试启用该模式

### 安装

[官方文档：全局安装](https://picgo.github.io/PicGo-Core-Doc/zh/guide/getting-started.html#%E5%85%A8%E5%B1%80%E5%AE%89%E8%A3%85)

### PicGo-Core 配置

[官方文档：配置](https://picgo.github.io/PicGo-Core-Doc/zh/guide/config.html#%E9%BB%98%E8%AE%A4%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)

### 插件配置

`Default uploader` 选择 `PicGo-Core`
设置路径，默认为空，使用环境变量
也可以设置自定义路径

## 图片上传缓存 (New!)

你可以在设置中开启 "开启图片上传缓存" (Enable image cache) 选项。开启后，插件在上传图片前会计算图片的 Hash 值。如果相同的图片之前已经上传过，插件将直接使用缓存的 URL，而不会再次上传。这对于多次转换文章时避免重复上传非常有用。

## 链接替换 (New!)

此功能允许你根据自定义规则替换笔记中的链接。当你需要将原始文章链接替换为自己的博客链接或转换后的图片链接时非常有用。

### 功能特性
- **JSON 配置**：使用 JSON 格式配置规则，方便分享和备份。
- **配置管理**：支持创建多个配置（Profile），例如“博客用替换规则”、“CSDN用替换规则”。
- **正则支持**：支持使用正则表达式匹配复杂的链接模式。
- **批量替换**：一键应用配置中的所有规则。

### 使用方法
1. 进入 **插件设置** -> **链接替换**。
2. 编辑 JSON 配置。示例：
```json
[
  {
    "id": "blog-rules",
    "name": "博客规则",
    "enabled": true,
    "rules": [
      {
        "id": "rule-1",
        "pattern": "\\[.*?\\]\\(https://original-site.com/.*?\\)",
        "replacement": "![[new-image.png]]",
        "flags": "g",
        "enabled": true
      }
    ]
  }
]
```
3. 打开笔记，按 `Ctrl/Cmd + P`，运行 **Image Auto Upload Plugin: Apply Link Replacement** 命令。
4. 选择你要应用的配置。

## 常见问题

### MacOs 下无法长传

参考 [#160](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/160), [#20](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/20)

# TODO

- [x] 支持批量上传
- [x] 支持 yaml 设置是否开启已达到单个文档的控制
- [x] 支持 picgo-core
- [x] 支持复制系统图片文件
- [x] 网络图片支持
- [ ] 支持手机端
- [ ] 支持更多适配器

# 赞赏

如果本项目对你有帮助，请我喝瓶快乐水吧，有助于项目更好维护。  
爱发电：[https://afdian.com/a/renmu123](https://afdian.com/a/renmu123)  
你也可以给我的 B 站帐号 [充电](https://space.bilibili.com/10995238)

# 开发

## 安装

`pnpm install`

## 运行

`pnpm run dev`

## 编译

`pnpm run build`

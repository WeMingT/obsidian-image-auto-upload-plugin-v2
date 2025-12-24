[中文文档](readme-zh.md)

# Obsidian Image Auto Upload Plugin

This is a tool that supports uploading images to image beds using PicGo, PicList, and PicGo-Core.
**Remember to restart Obsidian after updating the plugin.**

**Not tested on Mac**

# Start

1. Install the PicGo tool and configure it, refer to the [official website](https://github.com/Molunerfinn/PicGo)
2. Enable PicGo's Server service and remember the port number
3. Install the plugin
4. Open the plugin settings and set it to `http://127.0.0.1:{{port set in PicGo}}/upload` (e.g., `http://127.0.0.1:36677/upload`)
5. Try to see if the upload is successful

## Set picbed and configName

If you are using PicList (version >= 2.5.3), you can set the picbed and configName through URL parameters.
Example: `http://127.0.0.1:36677/upload?picbed=smms&configName=piclist`
This will upload the image to the `smms` picbed and use the piclist configName.
Using this feature, you can upload images to different picbeds in different Obsidian vaults.

# Features

## Upload when paste image

When you paste an image to Obsidian, this plugin will automatically upload your image.

You can set `image-auto-upload: false` in `frontmatter` to control one file.

Supports ".png", ".jpg", ".jpeg", ".bmp", ".gif", ".svg", ".tiff", ".webp", ".avif", ".heic"

Due to the [bug](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/2) in PicGo 2.3.0-beta7, you cannot use this feature. Please install another version of PicGo.

```yaml
---
image-auto-upload: true
---
```

## Upload all local images file by command

press `ctrl+P` and input `upload all images`，enter, then will auto upload all local images.

**New: Upload progress display** - Shows real-time upload progress with current file name and count (e.g., "Uploading (1/10): image.png").

## Delete all uploaded images in current file (New!)

press `ctrl+P` and input `Delete all images in current file`, enter. This will delete all images in the current file that have been uploaded via this plugin from the remote server (PicGo/PicList), and remove their links from the document.

**Note**: This feature requires the delete API to be configured correctly (usually supported by PicList).

## HTML Figure Format Output (New!)

You can choose to output uploaded images as HTML `<figure>` format instead of standard Markdown format. This is useful for Hugo blogs or other static site generators that support figure captions.

### Example

Input: `![[image.webp|My Caption]]`

Output (with figure format enabled):
```html
<figure style="text-align:center;">
  <img src="https://your-image-url.webp" alt="image">
  <figcaption style="margin-top:0.5rem;">My Caption</figcaption>
</figure>
```

### Figure Format Settings

- **Figure alignment**: Center, Left, or Right
- **Caption display mode**: Only when caption provided, or always (use filename as fallback)
- **Caption margin-top**: e.g., `0.5rem`, `8px`
- **Caption font-size**: e.g., `0.9rem`, `14px`
- **Caption color**: e.g., `#666666`, `gray`

## Image Upload Cache (New!)

You can enable the "Enable image cache" option in the settings. When enabled, the plugin will calculate the hash of the image before uploading. If the same image has been uploaded before, it will use the cached URL directly instead of uploading it again. This is useful for avoiding duplicate uploads when converting articles multiple times.

## Link Replacement (New!)

This feature allows you to replace links in your notes based on custom rules. This is useful when you want to replace original article links with your own blog links or image links after conversion.

### Features
- **JSON Configuration**: Configure rules using JSON for easy sharing and backup.
- **Profile Management**: Create different profiles for different purposes (e.g., "Blog Rules", "CSDN Rules").
- **Regex Support**: Use regular expressions to match complex link patterns.
- **Batch Replacement**: Apply all rules in a profile with a single command.

### Usage
1. Go to **Plugin Settings** -> **Link Replacement**.
2. Edit the JSON configuration. Example:
```json
[
  {
    "id": "blog-rules",
    "name": "Blog Rules",
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
3. Open a note, press `Ctrl/Cmd + P`, and run **Image Auto Upload Plugin: Apply Link Replacement**.
4. Select the profile you want to apply.

## download all internet to local

press `ctrl+P` and input `download all images`，enter, then will auto download all internet images to loacl, only test in win10

## Upload image by contextMenu

Now you can upload image by contextMenu in edit mode.

## Support drag-and-drop

Only work for picgo or picList app.

## server mode

You can deploy [PicList](https://github.com/Kuingsmile/PicList/releases) or [PicList-Core](https://github.com/Kuingsmile/PicList-Core) in your server and upload to it.

Support [PicList](https://github.com/Kuingsmile/PicList/releases) 2.6.3 later or [PicList-Core](https://github.com/Kuingsmile/PicList-Core)1.3.0 later

You can not upload network in this mode.
If you upload fail when you paste img, you can alse try to enable the mode.

## Support picgo-core

You can install picgo-core with npm. Reference to [doc](https://picgo.github.io/PicGo-Core-Doc/)

# TODO

- [x] upload all local images file by command
- [x] support yaml to config if upload image
- [x] support picgo-core
- [x] support upload image from system copy selected image
- [x] support network image

# Thanks

[obsidian-imgur-plugin](https://github.com/gavvvr/obsidian-imgur-plugin)

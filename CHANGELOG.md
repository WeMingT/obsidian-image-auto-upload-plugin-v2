# 4.1.2 (2025.12.24)

## 新功能

1. **批量删除当前文件图片** - 新增 "Delete all images in current file" 命令。支持一键删除当前文档中所有已上传到图床的图片（需配合 PicList 使用），并自动清理文档中的图片链接。

# 4.1.1 (2025.12.24)

## 新功能

1. **图片上传缓存** - 新增 "开启图片上传缓存" 选项。开启后，插件会缓存已上传图片的 Hash 值和 URL。当再次上传相同图片时，将直接使用缓存的 URL，避免重复上传占用图床空间。

# 5.1.0 (2025.12.21)

## 新功能

1. **HTML Figure 格式输出** - 新增图片输出格式选项，支持将上传后的图片转换为 HTML `<figure>` 格式，带图注支持（适用于 Hugo/博客）
   - 支持自定义对齐方式（居中/左/右）
   - 支持自定义图注样式（margin-top, font-size, color）
   - 支持图注显示模式（仅当有图注时/始终显示）
   - 示例：`![[image.webp|拷贝漫画]]` → `<figure><img src="..."><figcaption>拷贝漫画</figcaption></figure>`

2. **上传进度显示** - 执行 "Upload all images" 时显示实时上传进度
   - 显示当前上传文件名和进度 (1/10)
   - 上传完成后显示成功/失败统计

3. **HEIC 图片格式支持** - 新增对 `.heic` 图片格式的支持

## Bug 修复

1. 修复 PicList 多图上传后无法获取 URL 的问题 (#181)
2. 修复 `Cannot read properties of undefined (reading 'startsWith')` 错误 (#164)
3. 修复正则的第三种情况 `![image](https://xxxx)` 未捕获的问题 (#161)

# 5.0.0

1. trash respect ob setting
2. fix remote mod for cors
3. fix change uploader should restart plugin
4. **remove fix-path support**
5. use timestamp name for remote mode
6. **mobile support**

# 4.1.0(2024.11.28)

1. 修复 ob1.7.5 版本后拖拽时无法上传的 bug [#160](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/160)

# 4.0.1(2024.11.20)

1. 修复无法下载图片的 bug [#83](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/83)
2. 重构下载模块代码以便之后对 mobile 的支持

# 4.0.0(2024.11.18)

诈个尸

多年前的不成熟之作，感谢各位的使用，已经脱离 ob 的开发太久了，我和代码已经两不相熟，希望这个版本不会带来太多 bug。

1. 移除 node-fetch-native 依赖
2. 增加`![](<image>)`类型的解析 [#156](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/156)
3. 增加 md 的 alt 支持 [#143](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/143)
4. 按 ctrl 键进行拖拽上传时，不再调用上传 [#147](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/147)
5. Change plugin name to "Image auto upload"

顺便求个赞助，如果本项目对你有帮助，请我喝瓶快乐水吧，有助于项目更好维护。  
爱发电：[https://afdian.com/a/renmu123](https://afdian.com/a/renmu123)  
你也可以给我的 B 站帐号 [充电](https://space.bilibili.com/10995238)

# 1.2.0

修复在所见所得版本中（0.13.14）无法使用的 bug 。

# 1.3.1

修复 `image-auto-upload` 字段失效的 bug。

# 1.3.2

修复拖拽上传时错误上传所有文件。

# 2.0.0

部分功能支持 PicGo-Core。

# 2.0.2

修复有时上传失败的 bug

# 2.0.3

放出原始的 picgo-core 错误信息

# 2.0.4

fix #31

# 2.1.0

更新批量上传图片接口的支持格式以及提示

fix #32, #29, #24

# 2.2.0

右键上传功能优化

# 2.3.0

picgo-core 全功能支持
优化替换图片时的光标位置
移除 node-fetch 依赖

# 2.4.0

网络图片支持

# 2.4.1

优化了 picgo-core 的错误判断&网络图片上传的筛选条件

# 2.4.2

fix [issue42](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/42)

# 2.5.0

设置页面支持 i18n

# 2.6.0

修复 MacOs 及 Linux 无法使用环境变量的[问题](https://github.com/renmu123/obsidian-image-auto-upload-plugin/pull/44)

# 2.6.1

修复所有环境执行 fixPath 的[错误](https://github.com/renmu123/obsidian-image-auto-upload-plugin/pull/45)

# 2.6.2

修复 [黏贴非图片文件时也会自动上传的 bug](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/19)。

# 2.7.0

增加配置项处理类似 Excel 等复制时会同时讲数据写入 image 和 text 的情况 [#49](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/49)

# 2.8.0

1. 修复 wiki 链接中包含缩放参数时的解析失败 [#67](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/67)
2. 批量上传图片时支持网络图片 [#65](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/65)

# 2.9.0

1. 增加域名黑名单 [#70](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/70)
2. 剪切板自动上传的图片增加文件名 [#56](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/56)

# 3.0.0

1. 修改了 `upload all image` 和右键上传的实现方式，目前支持所有类型

# 3.0.1

1. 修复在未设置黑名单的情况下，所有网络图片均无法上传的问题

# 3.1.0

1. 修复剪贴板内容为图片链接时黑名单失效的问题 [#73](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/73)
2. 支持上传后删除源文件

# 3.1.1

1. 新增对 `.webp`, `.avif` 的支持

# 3.2.0

1. 优化上传所有图片指令针对绝对路径解析 [#82](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/82)

# 3.2.1

1. 优化上传所有图片指令的路径解析

# 3.3.0

1. 新增了添加图片预览大小后缀的支持
2. 针对 PicList 的快速删除功能

# 3.3.1

1. 修改下载文件后的命名问题
2. 修复使用 PicList 批量上传无法删除图片的 bug [#94](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/94)
3. 修复应用网络图片选项失效的问题 [#93](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/93)

# 3.3.2

1. 更新匹配正则

# 3.4.0

1. 下载功能优化，不再根据 url 的后缀进行判断，现在根据页面返回的 arraybuffer 的头来进行判断，兼容更多图片下载。 [#96](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/96)
2. 更新依赖版本

# 3.4.1

1. 过滤空黑名单规则 [#98](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/98)

# 3.4.2

1. 下载时重命名相同名称文件防止覆盖
2. 修复在根目录下的文件使用下载指令失败

# 3.5.0

<!-- 1. 下载支持异步 -->
<!-- 2. 应用网络图片增加描述 -->

1. 配置为 picgo-core 时不显示 piclist 的专有配置项
2. 增加配置项用于处理图片描述[#91](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/91)
3. 在 canvas 图片右键菜单中不显示 upload 菜单
4. 尝试性修复[#103](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/103)，我也不知道行不行

# 3.6.0

1. 命令行上传好像还是不行，改回了原来的实现[#103]，期待有缘人解决
2. 修复 wiki 链接的上传[#102](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/102)

# 3.6.1

1. 批量上传与下载后验证前后文件路径是否相同，防止覆盖 [[#108]](https://github.com/renmu123/obsidian-image-auto-upload-plugin/issues/108)

# 3.7.0

1. support server mode

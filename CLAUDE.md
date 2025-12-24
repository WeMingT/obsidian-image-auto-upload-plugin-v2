# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is an Obsidian plugin that automatically uploads images to image hosting services (PicGo, PicList, PicGo-Core). It supports uploading from clipboard paste, drag-and-drop, bulk uploads, and downloading remote images to local storage.

## Development Commands

### Build and Development
- `pnpm run dev` - Watch mode for development with automatic rebuilds
- `pnpm run build` - Production build (runs typecheck first, then rollup)
- `pnpm run typecheck` - Type check without emitting files

### Testing
- `pnpm test` - Run vitest test suite
- Tests are located in `test/` directory
- Test mocks for Obsidian API are in `src/mocks/obsidian.ts`
- Vitest config uses alias `virtual:obsidian` for mocking

### Package Management
This project uses pnpm (v9.12.3+) as specified in packageManager field.

## Architecture

### Core Plugin Structure
- **main.ts** - Plugin entry point (`imageAutoUploadPlugin` class)
  - Extends Obsidian's `Plugin` class
  - Registers commands: "Upload all images", "Download all images"
  - Sets up paste handler, file menu, and selection handlers
  - Manages plugin lifecycle (onload/onunload)

- **helper.ts** - Document manipulation utilities (`Helper` class)
  - Image link parsing (markdown and wiki-style links)
  - Editor operations (getValue, setValue with scroll preservation)
  - Frontmatter reading (e.g., `image-auto-upload: false`)
  - Regex patterns: `REGEX_FILE` for markdown links, `REGEX_WIKI_FILE` for wiki links

- **setting.ts** - Settings UI and configuration
  - `PluginSettings` interface defines all config options
  - `DEFAULT_SETTINGS` provides defaults
  - `SettingTab` renders settings UI

### Uploader System
The uploader system uses a factory pattern with two implementations:

- **uploader/index.ts** - `UploaderManager` class
  - Factory that instantiates the correct uploader based on settings
  - Provides unified interface: `upload()` and `uploadByClipboard()`
  - Handles mobile app validation (requires remote server mode)

- **uploader/picgo.ts** - `PicGoUploader` class
  - Supports PicGo and PicList desktop apps via HTTP API
  - Two modes:
    - **Local mode**: Sends file paths to PicGo server
    - **Remote server mode**: Sends file data as multipart/form-data
  - Uses `payloadGenerator.ts` for multipart form construction

- **uploader/picgoCore.ts** - `PicGoCoreUploader` class
  - Integrates with PicGo-Core npm package
  - Direct programmatic upload without external server

### Image Processing
- **types.ts** - Core `Image` interface:
  ```typescript
  { path: string, name: string, source: string, file?: TFile | null }
  ```
- **download.ts** - `downloadAllImageFiles()` function
  - Fetches remote images and saves to vault
  - Updates markdown to reference local files
  - Handles URL decoding and path sanitization

- **deleter.ts** - `PicGoDeleter` class
  - Sends delete requests to PicGo server
  - Manages local file cleanup

### Internationalization
- **lang/helpers.ts** - `t()` translation function
- **lang/locale/** - 25+ language files (en.ts, zh-cn.ts, etc.)
- Pattern: `t("key")` returns translated string based on Obsidian locale

### Utilities
- **utils.ts** - Common utilities:
  - `isAssetTypeAnImage()` - Image extension validation
  - `getUrlAsset()` - Extract filename from URL
  - `getFileHash()` - Generate hash for cache keys
  - `arrayToObject()`, `bufferToArrayBuffer()` - Data transformations

- **payloadGenerator.ts** - Multipart form-data builder
  - Constructs boundary-delimited HTTP request bodies
  - Used for remote server mode file uploads

## Important Implementation Details

### Image Upload Flow
1. User pastes/drops image or triggers "Upload all images" command
2. `Helper.getAllFiles()` parses document for image links
3. `UploaderManager` instantiates appropriate uploader
4. Uploader sends files to PicGo server or PicGo-Core
5. Response URLs replace local paths in document
6. Optional: Cache mapping saved (hash → URL)

### Settings Architecture
Settings support multiple output formats:
- **Markdown format**: Standard `![alt](url)`
- **Figure format**: HTML `<figure>` with configurable alignment, caption styling
- Figure format is useful for Hugo blogs and static site generators

### Path Handling
- Uses `path-browserify` for cross-platform path operations
- `normalizePath()` from Obsidian API ensures consistent paths
- Relative paths calculated from active file's parent directory

### Frontmatter Control
Users can disable auto-upload per-file:
```yaml
---
image-auto-upload: false
---
```
Check with `Helper.getFrontmatterValue("image-auto-upload", true)`

### Mobile Support
- Mobile app requires `remoteServerMode: true` (cannot send file paths)
- Platform detection via `Platform.isMobileApp`
- Remote mode sends file contents as multipart form data

### Build Configuration
- **rollup.config.js**: Bundles to CommonJS format with inline sourcemaps
- External deps: `obsidian`, `electron` (provided by Obsidian runtime)
- Entry point: `src/main.ts` → output: `main.js`
- Uses plugins: typescript, node-resolve, commonjs, json

## Testing Strategy
- Tests use mocked Obsidian API (`src/mocks/obsidian.ts`)
- Import mocks via `virtual:obsidian` alias in vitest config
- Test files: `test/helper.test.ts`, `test/utils.test.ts`
- Focus on testing regex patterns, path handling, and data transformations

## Version Management
- **manifest.json** - Obsidian plugin manifest (version, minAppVersion)
- **versions.json** - Compatibility mapping (plugin version → min Obsidian version)
- **CHANGELOG.md** - Release notes

After updating version:
1. Update `manifest.json` version
2. Update `package.json` version
3. Add entry to `versions.json`
4. Document changes in `CHANGELOG.md`

## Known Issues
- PicGo 2.3.0-beta7 has a bug preventing paste uploads - use different version
- Not tested on Mac (noted in README)

## Plugin Distribution
This plugin follows Obsidian's plugin structure:
- `main.js` - Compiled bundle (gitignored, built from src/main.ts)
- `manifest.json` - Plugin metadata
- `styles.css` - Optional styles (if present)

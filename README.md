# Swift Format for VS Code

[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/heikopanjas.vscode-swift-format?label=marketplace)](https://marketplace.visualstudio.com/items?itemName=heikopanjas.vscode-swift-format)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/heikopanjas.vscode-swift-format)](https://marketplace.visualstudio.com/items?itemName=heikopanjas.vscode-swift-format)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/heikopanjas/vscode-swift-format/blob/main/LICENSE)

> Requires macOS with Xcode. The extension shells out to `xcrun swift-format`.

Format Swift source files using Apple's [swift-format](https://github.com/swiftlang/swift-format) tool, bundled with Xcode.

## Features

- **Format on demand** — use `Shift+Option+F` (macOS) or the Command Palette
- **Format on save** — opt in via a one-line setting
- **Range formatting** — format a selection instead of the entire file
- **Undo-friendly** — formatting changes are applied as editor edits, so `Cmd+Z` reverts in one step

## Requirements

- **macOS** with **Xcode** installed (the extension uses `xcrun swift-format`)
- Verify swift-format is available by running:

  ```sh
  xcrun swift-format format --version
  ```

## Install

- **Marketplace:** search for "Swift Format" in the Extensions view, or run
  `code --install-extension heikopanjas.vscode-swift-format`
- **VSIX:** download the `.vsix` from
  [Releases](https://github.com/heikopanjas/vscode-swift-format/releases)
  and run `code --install-extension <file>.vsix`

## Usage

Once installed, the extension activates automatically when you open a `.swift` file.

### Format on Save

Not enabled by default. To enable, add to your `settings.json`:

```json
"[swift]": {
  "editor.formatOnSave": true
}
```

### Format Manually

- **Keyboard shortcut:** `Shift+Option+F` (macOS) / `Shift+Alt+F` (Windows/Linux)
- **Command Palette:** `Cmd+Shift+P` → **Swift Format: Format Document with swift-format**
- **Right-click** → **Format Document**

### Format a Selection

Select a range of code, then right-click → **Format Selection**.

## Configuration

The extension does not claim itself as the default Swift formatter automatically — if you have another Swift formatter installed, VS Code will prompt you to choose one the first time you format. To set it explicitly, add to your `settings.json`:

```json
"[swift]": {
  "editor.defaultFormatter": "heikopanjas.vscode-swift-format",
  "editor.formatOnSave": true
}
```

### swift-format Configuration

swift-format reads its configuration from a `.swift-format` JSON file in your project directory. See the [swift-format documentation](https://github.com/swiftlang/swift-format/blob/main/Documentation/Configuration.md) for available options.

## Diagnostics

The extension logs to the **Swift Format** output channel. Open it via **View → Output** and select **Swift Format** from the dropdown.

## Feedback

Bug reports and feature requests: [GitHub Issues](https://github.com/heikopanjas/vscode-swift-format/issues)

## License

MIT

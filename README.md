# Mauersegler for VS Code

[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/heikopanjas.vscode-mauersegler?label=marketplace)](https://marketplace.visualstudio.com/items?itemName=heikopanjas.vscode-mauersegler)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/heikopanjas.vscode-mauersegler)](https://marketplace.visualstudio.com/items?itemName=heikopanjas.vscode-mauersegler)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/heikopanjas/mauersegler/blob/main/LICENSE)

Format Swift source files using Apple's [swift-format](https://github.com/swiftlang/swift-format) tool. Works on macOS, Windows, and Linux.

## Features

- **Format on demand** — use `Shift+Option+F` (macOS) or the Command Palette
- **Format on save** — opt in via a one-line setting
- **Range formatting** — format a selection instead of the entire file
- **Undo-friendly** — formatting changes are applied as editor edits, so `Cmd+Z` reverts in one step
- **Configuration required** — refuses to format until the project has a `.swift-format` file, so nobody gets swift-format built-in defaults by accident

## Requirements

swift-format must be installed and reachable one of three ways, checked in this order:

1. **`swiftFormat.path`** pointing directly at the executable.
2. **`swiftFormat.useXcrun`**, which runs swift-format through Xcode's toolchain via `xcrun` — requires Xcode or the Xcode Command Line Tools. Its default, `"auto"`, means "use xcrun on macOS, PATH everywhere else"; set it to `"on"` or `"off"` to force one or the other.
3. Otherwise, **`swift-format` on your `PATH`**, on any platform.

See the [swift-format repository](https://github.com/swiftlang/swift-format) for install instructions for your platform.

## Install

Search for "Mauersegler" in the Extensions view, or run:

```sh
code --install-extension heikopanjas.vscode-mauersegler
```

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
- **Command Palette:** `Cmd+Shift+P` → **Mauersegler: Format Document with swift-format**
- **Right-click** → **Format Document**

### Format a Selection

Select a range of code, then right-click → **Format Selection**.

## Configuration

### Default Formatter

The extension does not claim itself as the default Swift formatter automatically — if you have another Swift formatter installed, VS Code will prompt you to choose one the first time you format. To set it explicitly, add to your `settings.json`:

```json
"[swift]": {
  "editor.defaultFormatter": "heikopanjas.vscode-mauersegler",
  "editor.formatOnSave": true
}
```

### Extension Settings

| Setting | Default | Description |
| --- | --- | --- |
| `swiftFormat.requireConfigurationFile` | `true` | Only format when a `.swift-format` file is found. Set to `false` to format with swift-format built-in defaults instead. |
| `swiftFormat.configurationSearchScope` | `"workspaceFolder"` | How far up to search. `"filesystem"` keeps walking past the workspace root, matching swift-format's own lookup. |
| `swiftFormat.offerToCreateConfigurationFile` | `true` | Offer a **Create .swift-format** action on the warning. The file is only written if you choose it. |
| `swiftFormat.path` | `""` | The full path to the swift-format **executable itself**, e.g. `/usr/local/bin/swift-format` — not its containing directory. When set, this exact executable is used and `swiftFormat.useXcrun` is ignored. |
| `swiftFormat.useXcrun` | `"auto"` | `"auto"` uses `xcrun` on macOS and PATH elsewhere; `"on"`/`"off"` force one or the other. Ignored when `swiftFormat.path` is set. |
| `swiftFormat.additionalArguments` | `""` | Extra arguments appended to the `swift-format format` invocation, as a single text field the extension tokenizes itself — quote an argument containing spaces, e.g. `--configuration "/path/with spaces/.swift-format"`. Appended last, so a repeated `--configuration` here overrides the one this extension found; a repeated `--offsets` does not override, since swift-format treats it as an additional range to format. |

### swift-format Configuration

swift-format reads its configuration from a `.swift-format` JSON file. This extension looks for one starting at the directory of the file being formatted and walking upward — the nearest configuration wins, so each package in a multi-package repository can have its own. By default the search stops at the workspace folder root; set `swiftFormat.configurationSearchScope` to `"filesystem"` to keep searching above it, for example to share one configuration across several checkouts or to fall back to a configuration in your home directory. For a file opened outside any workspace folder, only that file's own directory is checked unless the scope is `"filesystem"`.

Once found, the configuration path is passed to swift-format explicitly. If no configuration is found and `swiftFormat.requireConfigurationFile` is `false`, the extension formats anyway without passing a path — swift-format may still discover a configuration of its own outside the search scope described above, since its own lookup is unbounded.

See the [swift-format documentation](https://github.com/swiftlang/swift-format/blob/main/Documentation/Configuration.md) for available options, or use the **Create .swift-format** action on the warning to generate one from swift-format's defaults.

## Diagnostics

The extension logs to the **Mauersegler** output channel. Open it via **View → Output** and select **Mauersegler** from the dropdown. When formatting is skipped because no configuration was found, the reason is always logged there, even if the warning notification was suppressed for the session.

## Feedback

Bug reports and feature requests: [GitHub Issues](https://github.com/heikopanjas/mauersegler/issues)

## License

MIT

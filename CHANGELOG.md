# Changelog

All notable changes to the Swift Format extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-04

Initial public release.

### Added

- Format `.swift` documents with Apple swift-format, via `xcrun`.
- Format the current selection, using swift-format `--offsets` so the
  surrounding file stays intact and partial blocks format correctly.
- `Swift Format: Format Document with swift-format` command.
- A `Swift Format` output channel with the exact command line and any
  swift-format diagnostics.
- Project `.swift-format` configuration files are honoured. The file is
  located by walking up from the directory of the document to the
  workspace folder root, and passed to swift-format explicitly, so the
  nearest configuration wins in a multi-package repository.
- Formatting is skipped when no `.swift-format` file is found, so
  swift-format built-in defaults never reformat a project silently.
  Set `swiftFormat.requireConfigurationFile` to `false` to opt out.
- `swiftFormat.configurationSearchScope` lifts the workspace bound,
  so a configuration above the workspace folder can be used.
- The warning offers to create a `.swift-format` file seeded from
  swift-format own defaults. Nothing is written unless you choose
  that action. Disable the offer with
  `swiftFormat.offerToCreateConfigurationFile`.
- Works on macOS, Windows, and Linux. The swift-format binary is
  resolved in order: `swiftFormat.path` if set, otherwise `xcrun`
  when `swiftFormat.useXcrun` resolves to on (its default, `"auto"`,
  means on for macOS and off elsewhere; `"on"`/`"off"` force it),
  otherwise `swift-format` on `PATH`.
- `swiftFormat.additionalArguments` appends extra flags to the
  format invocation, as a single text field the extension tokenizes
  itself.

### Notes

- The extension does not enable format-on-save or claim itself as the
  default Swift formatter. Opt in from your own settings; see the README.

[0.1.0]: https://github.com/heikopanjas/vscode-swift-format/releases/tag/v0.1.0

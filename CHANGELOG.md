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
- Project `.swift-format` configuration files are honoured, resolved from
  the directory of the file being formatted.

### Notes

- Requires macOS with Xcode installed. The extension shells out to
  `xcrun swift-format` and does not bundle a formatter.
- The extension does not enable format-on-save or claim itself as the
  default Swift formatter. Opt in from your own settings; see the README.

[0.1.0]: https://github.com/heikopanjas/vscode-swift-format/releases/tag/v0.1.0

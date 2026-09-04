import * as vscode from "vscode";
import { FormatOffsets, runSwiftFormat } from "./runner";

export class SwiftFormatProvider
  implements
    vscode.DocumentFormattingEditProvider,
    vscode.DocumentRangeFormattingEditProvider
{
  constructor(private readonly output: vscode.OutputChannel) {}

  async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    _options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): Promise<vscode.TextEdit[]> {
    return this.formatDocument(document, token);
  }

  async provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range,
    _options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): Promise<vscode.TextEdit[]> {
    return this.formatDocument(document, token, range);
  }

  private async formatDocument(
    document: vscode.TextDocument,
    token: vscode.CancellationToken,
    range?: vscode.Range
  ): Promise<vscode.TextEdit[]> {
    const source = document.getText();

    const offsets: FormatOffsets | undefined = range
      ? {
          start: Buffer.byteLength(
            source.slice(0, document.offsetAt(range.start)),
            "utf8"
          ),
          end: Buffer.byteLength(
            source.slice(0, document.offsetAt(range.end)),
            "utf8"
          ),
        }
      : undefined;

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const cwd = workspaceFolder?.uri.fsPath;

    try {
      const formatted = await runSwiftFormat(
        source,
        document.fileName,
        cwd,
        token,
        this.output,
        offsets
      );

      if (formatted === source) {
        return [];
      }

      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(source.length)
      );

      return [vscode.TextEdit.replace(fullRange, formatted)];
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.output.appendLine(`Error: ${message}`);
      vscode.window.showErrorMessage(`swift-format: ${message}`);
      return [];
    }
  }
}

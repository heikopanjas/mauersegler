import * as vscode from "vscode";
import { SwiftFormatProvider } from "./formatter";

const SWIFT_LANGUAGE_ID = "swift";

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel("Swift Format");

  const formatter = new SwiftFormatProvider(outputChannel);

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      { language: SWIFT_LANGUAGE_ID, scheme: "file" },
      formatter
    ),
    vscode.languages.registerDocumentRangeFormattingEditProvider(
      { language: SWIFT_LANGUAGE_ID, scheme: "file" },
      formatter
    ),
    vscode.commands.registerCommand("swift-format.formatDocument", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== SWIFT_LANGUAGE_ID) {
        vscode.window.showWarningMessage(
          "swift-format: No active Swift file to format."
        );
        return;
      }
      await vscode.commands.executeCommand("editor.action.formatDocument");
    }),
    outputChannel
  );

  outputChannel.appendLine("Swift Format extension activated.");
}

export function deactivate(): void {
  // nothing to clean up
}

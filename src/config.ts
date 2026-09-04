import { promises as fs } from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { resolveSwiftFormatCommand } from "./binary";
import { dumpDefaultConfiguration } from "./runner";

export const CONFIGURATION_FILE_NAME = ".swift-format";

export type ConfigurationSearchScope = "workspaceFolder" | "filesystem";

export type GateResult =
  | { readonly allowed: true; readonly configurationPath?: string }
  | { readonly allowed: false };

/**
 * Search for a `.swift-format` file starting at the directory of
 * `documentUri` and walking upward. Under "workspaceFolder" scope the
 * walk stops at the workspace folder root (or checks only the document's
 * own directory when there is no workspace folder). Under "filesystem"
 * scope the walk continues to the filesystem root, matching swift-format's
 * own unbounded discovery.
 */
export async function findConfigurationFile(
  documentUri: vscode.Uri,
  scope: ConfigurationSearchScope
): Promise<string | undefined> {
  const workspaceRoot = vscode.workspace.getWorkspaceFolder(documentUri)?.uri
    .fsPath;
  let dir = path.dirname(documentUri.fsPath);

  for (;;) {
    const candidate = path.join(dir, CONFIGURATION_FILE_NAME);
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) {
        return candidate;
      }
    } catch {
      // absent or unreadable at this level; keep walking
    }

    if (scope === "workspaceFolder") {
      if (workspaceRoot === undefined || dir === workspaceRoot) {
        return undefined;
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
}

const CREATE_ACTION = "Create .swift-format";
const OPEN_SETTING_ACTION = "Open Setting";
const SHOW_LOG_ACTION = "Show Log";

const NO_WORKSPACE_FOLDER_KEY = "no-workspace-folder";

const FALLBACK_CONFIGURATION = `{
  "version": 1,
  "lineLength": 100,
  "indentation": { "spaces": 4 }
}
`;

/**
 * Gates formatting on the presence of a `.swift-format` file, per the
 * swiftFormat.requireConfigurationFile / configurationSearchScope /
 * offerToCreateConfigurationFile settings. Owns the search, the log
 * lines, and the once-per-workspace-folder-per-session warning.
 */
export class ConfigurationGate {
  private readonly notified = new Set<string>();

  constructor(private readonly output: vscode.OutputChannel) {}

  async resolve(
    document: vscode.TextDocument,
    options?: { readonly force?: boolean }
  ): Promise<GateResult> {
    const folder = vscode.workspace.getWorkspaceFolder(document.uri);
    const settings = vscode.workspace.getConfiguration(
      "swiftFormat",
      document.uri
    );
    const scope = settings.get<ConfigurationSearchScope>(
      "configurationSearchScope",
      "workspaceFolder"
    );
    const required = settings.get<boolean>("requireConfigurationFile", true);

    const configurationPath = await findConfigurationFile(
      document.uri,
      scope
    );

    if (configurationPath) {
      this.output.appendLine(`Using configuration: ${configurationPath}`);
      return { allowed: true, configurationPath };
    }

    if (!required) {
      this.output.appendLine(
        `No ${CONFIGURATION_FILE_NAME} found for ${document.fileName} within ${scope}. ` +
          "Formatting anyway; swift-format may still discover a configuration outside the search scope."
      );
      return { allowed: true };
    }

    const boundary =
      scope === "workspaceFolder"
        ? folder?.uri.fsPath ?? path.dirname(document.uri.fsPath)
        : "the filesystem root";

    this.output.appendLine(
      `No ${CONFIGURATION_FILE_NAME} found for ${document.fileName} (searched up to ${boundary}). ` +
        "Skipping format. Set swiftFormat.requireConfigurationFile to false to format anyway, " +
        "or swiftFormat.configurationSearchScope to filesystem to search higher."
    );

    this.notify(document, folder, options?.force ?? false);

    return { allowed: false };
  }

  /**
   * Records the warning as shown and kicks off the toast without
   * awaiting it, so a blocked format returns immediately rather than
   * waiting on the user to dismiss a notification.
   */
  private notify(
    document: vscode.TextDocument,
    folder: vscode.WorkspaceFolder | undefined,
    force: boolean
  ): void {
    const key = folder?.uri.toString() ?? NO_WORKSPACE_FOLDER_KEY;
    if (!force && this.notified.has(key)) {
      return;
    }
    this.notified.add(key);

    void this.showNotification(document, folder);
  }

  private async showNotification(
    document: vscode.TextDocument,
    folder: vscode.WorkspaceFolder | undefined
  ): Promise<void> {
    const settings = vscode.workspace.getConfiguration(
      "swiftFormat",
      document.uri
    );
    const offerCreate =
      folder !== undefined &&
      settings.get<boolean>("offerToCreateConfigurationFile", true);

    const actions = [
      ...(offerCreate ? [CREATE_ACTION] : []),
      OPEN_SETTING_ACTION,
      SHOW_LOG_ACTION,
    ];

    const location = folder ? ` in "${folder.name}"` : "";
    const message =
      `swift-format: no ${CONFIGURATION_FILE_NAME} configuration found${location}. ` +
      "Skipping formatting so swift-format built-in defaults do not reformat your code.";

    const choice = await vscode.window.showWarningMessage(
      message,
      ...actions
    );

    switch (choice) {
      case CREATE_ACTION:
        if (folder) {
          await this.createConfigurationFile(folder);
        }
        break;
      case OPEN_SETTING_ACTION:
        await vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "swiftFormat.requireConfigurationFile"
        );
        break;
      case SHOW_LOG_ACTION:
        this.output.show(true);
        break;
      default:
        break;
    }
  }

  private async createConfigurationFile(
    folder: vscode.WorkspaceFolder
  ): Promise<void> {
    const target = path.join(folder.uri.fsPath, CONFIGURATION_FILE_NAME);

    let content: string;
    try {
      const command = resolveSwiftFormatCommand(folder.uri);
      content = await dumpDefaultConfiguration(command);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.output.appendLine(`Error: ${message}`);
      content = FALLBACK_CONFIGURATION;
    }

    try {
      await fs.writeFile(target, content, { flag: "wx" });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
        const message = err instanceof Error ? err.message : String(err);
        this.output.appendLine(`Error: ${message}`);
        vscode.window.showErrorMessage(`swift-format: ${message}`);
        return;
      }
    }

    const doc = await vscode.workspace.openTextDocument(target);
    await vscode.window.showTextDocument(doc);
  }
}

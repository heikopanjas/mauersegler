import * as vscode from "vscode";

export interface SwiftFormatCommand {
  readonly command: string;
  readonly baseArgs: readonly string[];
  readonly additionalArgs: readonly string[];
  readonly notFoundMessage: string;
}

/**
 * Decides which swift-format binary to run and how, from the
 * swiftFormat.path / swiftFormat.useXcrun / swiftFormat.additionalArguments
 * settings. Resolution order: an explicit path wins outright; otherwise
 * xcrun is used when useXcrun is "on", or "auto" on macOS; otherwise the
 * bare command name is left for the OS to resolve via PATH.
 */
export function resolveSwiftFormatCommand(
  resourceUri: vscode.Uri
): SwiftFormatCommand {
  const settings = vscode.workspace.getConfiguration(
    "swiftFormat",
    resourceUri
  );
  const explicitPath = settings.get<string>("path", "").trim();
  const additionalArgs = tokenizeArguments(
    settings.get<string>("additionalArguments", "")
  );

  if (explicitPath) {
    return {
      command: explicitPath,
      baseArgs: [],
      additionalArgs,
      notFoundMessage:
        `Could not run "${explicitPath}". swiftFormat.path must be the full path to the ` +
        `swift-format executable itself (e.g. "/usr/local/bin/swift-format"), not its ` +
        "containing directory.",
    };
  }

  if (resolveUseXcrun(settings)) {
    return {
      command: "xcrun",
      baseArgs: ["swift-format"],
      additionalArgs,
      notFoundMessage:
        "xcrun not found. Mauersegler requires macOS with Xcode installed. " +
        "Set swiftFormat.useXcrun to \"off\" to search PATH instead, or set swiftFormat.path.",
    };
  }

  return {
    command: "swift-format",
    baseArgs: [],
    additionalArgs,
    notFoundMessage:
      "swift-format not found on PATH. Install swift-format, set swiftFormat.path " +
      "to its location, or set swiftFormat.useXcrun to \"on\" on macOS.",
  };
}

/**
 * Splits a shell-like argument string into argv tokens. execFile runs no
 * shell, so nothing else does this job. Supports single/double quotes
 * (double-quoted allows \" and \\ escapes) and a bare backslash escaping
 * the next character outside quotes. Throws on an unterminated quote
 * rather than guessing, so a malformed setting fails loudly.
 */
export function tokenizeArguments(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let hasCurrent = false;
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " " || ch === "\t" || ch === "\n") {
      if (hasCurrent) {
        tokens.push(current);
        current = "";
        hasCurrent = false;
      }
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      hasCurrent = true;
      while (i < input.length && input[i] !== quote) {
        if (
          quote === '"' &&
          input[i] === "\\" &&
          i + 1 < input.length &&
          (input[i + 1] === '"' || input[i + 1] === "\\")
        ) {
          current += input[i + 1];
          i += 2;
        } else {
          current += input[i];
          i++;
        }
      }
      if (i >= input.length) {
        throw new Error(
          "Unterminated quote in swiftFormat.additionalArguments."
        );
      }
      i++; // closing quote
      continue;
    }
    if (ch === "\\" && i + 1 < input.length) {
      current += input[i + 1];
      hasCurrent = true;
      i += 2;
      continue;
    }
    current += ch;
    hasCurrent = true;
    i++;
  }
  if (hasCurrent) {
    tokens.push(current);
  }
  return tokens;
}

export type UseXcrunSetting = "auto" | "on" | "off";

function resolveUseXcrun(settings: vscode.WorkspaceConfiguration): boolean {
  const mode = settings.get<UseXcrunSetting>("useXcrun", "auto");
  if (mode === "on") {
    return true;
  }
  if (mode === "off") {
    return false;
  }
  return process.platform === "darwin";
}

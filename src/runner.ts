import { execFile } from "child_process";
import * as vscode from "vscode";
import { SwiftFormatCommand } from "./binary";

export interface FormatOffsets {
  start: number;
  end: number;
}

export interface RunSwiftFormatOptions {
  readonly source: string;
  readonly fileName: string;
  readonly configurationPath: string | undefined;
  readonly command: SwiftFormatCommand;
  readonly token: vscode.CancellationToken;
  readonly output: vscode.OutputChannel;
  readonly offsets?: FormatOffsets;
}

/**
 * True when the process never started at all (missing binary, a
 * directory where a file was expected, no permission to execute, ...),
 * as opposed to a process that ran and exited with a nonzero code.
 * Node sets `error.code` to a string errno (e.g. "ENOENT", "EACCES")
 * for the former and to the numeric exit code for the latter — verified
 * empirically, since this isn't documented behavior to rely on blindly.
 */
function isSpawnFailure(error: NodeJS.ErrnoException): boolean {
  return typeof error.code === "string";
}

export function runSwiftFormat(
  options: RunSwiftFormatOptions
): Promise<string> {
  const { source, fileName, configurationPath, command, token, output, offsets } =
    options;

  const args = [...command.baseArgs, "format", "-", "--assume-filename", fileName];

  if (configurationPath) {
    args.push("--configuration", configurationPath);
  }

  if (offsets) {
    args.push("--offsets", `${offsets.start}:${offsets.end}`);
  }

  args.push(...command.additionalArgs);

  output.appendLine(`Running: ${command.command} ${args.join(" ")}`);

  return new Promise<string>((resolve, reject) => {
    const proc = execFile(
      command.command,
      args,
      {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30_000,
      },
      (error, stdout, stderr) => {
        if (error) {
          if (isSpawnFailure(error as NodeJS.ErrnoException)) {
            reject(new Error(command.notFoundMessage));
          } else if (error.killed) {
            reject(new Error("swift-format timed out."));
          } else {
            reject(
              new Error(
                stderr.trim() ||
                  `swift-format exited with code ${error.code ?? "unknown"}.`
              )
            );
          }
          return;
        }
        if (stderr.trim()) {
          output.appendLine(`stderr: ${stderr.trim()}`);
        }
        resolve(stdout);
      }
    );

    proc.stdin?.on("error", () => {
      // swift-format can exit before consuming stdin; ignore EPIPE
    });
    proc.stdin?.end(source);

    const cancellation = token.onCancellationRequested(() => {
      proc.kill();
    });
    proc.on("close", () => cancellation.dispose());
  });
}

export function dumpDefaultConfiguration(
  command: SwiftFormatCommand
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    execFile(
      command.command,
      [...command.baseArgs, "dump-configuration"],
      { maxBuffer: 10 * 1024 * 1024, timeout: 30_000 },
      (error, stdout, stderr) => {
        if (error) {
          if (isSpawnFailure(error as NodeJS.ErrnoException)) {
            reject(new Error(command.notFoundMessage));
          } else {
            reject(
              new Error(
                stderr.trim() ||
                  `swift-format exited with code ${error.code ?? "unknown"}.`
              )
            );
          }
          return;
        }
        resolve(stdout);
      }
    );
  });
}

import { execFile } from "child_process";
import * as vscode from "vscode";

export interface FormatOffsets {
  start: number;
  end: number;
}

export function runSwiftFormat(
  source: string,
  fileName: string,
  cwd: string | undefined,
  token: vscode.CancellationToken,
  output: vscode.OutputChannel,
  offsets?: FormatOffsets
): Promise<string> {
  const args = ["swift-format", "format", "-", "--assume-filename", fileName];

  if (offsets) {
    args.push("--offsets", `${offsets.start}:${offsets.end}`);
  }

  output.appendLine(`Running: xcrun ${args.join(" ")}`);

  return new Promise<string>((resolve, reject) => {
    const proc = execFile(
      "xcrun",
      args,
      {
        cwd,
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30_000,
      },
      (error, stdout, stderr) => {
        if (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            reject(
              new Error(
                "xcrun not found. Swift Format requires macOS with Xcode installed."
              )
            );
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

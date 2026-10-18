import { spawn } from "node:child_process";
import { loadResolvedConfig } from "./config.js";
import { onDeployFailure, onDeploySuccess } from "./onDeploySuccess.js";

export async function runVoidDeploy(args: string[]): Promise<number> {
  const cwd = process.cwd();
  const config = loadResolvedConfig(cwd);
  const isTTY = Boolean(process.stdout.isTTY);

  const exitCode = await new Promise<number>((resolve) => {
    const child = spawn("void", ["deploy", ...args], {
      stdio: "inherit",
      shell: false,
    });

    child.on("error", () => resolve(127));
    child.on("close", (code, signal) => {
      if (signal) {
        resolve(128);
        return;
      }
      resolve(code ?? 1);
    });
  });

  const ctx = {
    cwd,
    env: process.env,
    isTTY,
    config,
  };

  if (exitCode === 0) {
    await onDeploySuccess(ctx);
  } else if (config.playOnFailure) {
    await onDeployFailure(ctx);
  }

  return exitCode;
}

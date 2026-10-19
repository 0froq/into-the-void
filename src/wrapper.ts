import { spawn } from "node:child_process";
import { loadResolvedConfig } from "./config.js";
import { onDeployFailure, onDeploySuccess } from "./onDeploySuccess.js";
import { resolveVoidBinary, voidNotFoundMessage } from "./resolveVoid.js";

export interface RunVoidDeployOptions {
  dryRun?: boolean;
}

function successContext(cwd: string, silence?: { ignoreNonTTY?: boolean }) {
  return {
    cwd,
    env: process.env,
    isTTY: Boolean(process.stdout.isTTY),
    config: loadResolvedConfig(cwd),
    silence,
  };
}

export async function runPlayJingle(): Promise<number> {
  const cwd = process.cwd();
  await onDeploySuccess(successContext(cwd));
  return 0;
}

export async function runVoidDeploy(
  args: string[],
  options: RunVoidDeployOptions = {},
): Promise<number> {
  const cwd = process.cwd();

  if (options.dryRun) {
    await onDeploySuccess(
      successContext(cwd, { ignoreNonTTY: true }),
    );
    return 0;
  }

  const voidBin = resolveVoidBinary(cwd, process.env);

  if (!voidBin) {
    console.error(voidNotFoundMessage());
    return 127;
  }

  const config = loadResolvedConfig(cwd);
  const isTTY = Boolean(process.stdout.isTTY);

  const exitCode = await new Promise<number>((resolve) => {
    const child = spawn(voidBin, ["deploy", ...args], {
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

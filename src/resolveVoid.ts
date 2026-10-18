import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const VOID_BIN_NAME = "void";

function voidBinCandidates(binDir: string): string[] {
  if (process.platform === "win32") {
    return [
      path.join(binDir, `${VOID_BIN_NAME}.cmd`),
      path.join(binDir, `${VOID_BIN_NAME}.ps1`),
      path.join(binDir, VOID_BIN_NAME),
    ];
  }
  return [path.join(binDir, VOID_BIN_NAME)];
}

export function findLocalVoidBin(startDir: string): string | null {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;

  while (true) {
    const binDir = path.join(dir, "node_modules", ".bin");
    for (const candidate of voidBinCandidates(binDir)) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    if (dir === root) {
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return null;
}

export function findVoidOnPath(env: NodeJS.ProcessEnv = process.env): string | null {
  const pathKey = process.platform === "win32" ? "Path" : "PATH";
  const pathValue = env[pathKey] ?? env.PATH ?? "";
  const segments = pathValue.split(path.delimiter).filter(Boolean);

  for (const segment of segments) {
    for (const candidate of voidBinCandidates(segment)) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  const which = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(which, [VOID_BIN_NAME], {
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  if (result.status === 0 && result.stdout) {
    const first = result.stdout.trim().split(/\r?\n/)[0]?.trim();
    if (first && fs.existsSync(first)) {
      return first;
    }
  }

  return null;
}

export function resolveVoidBinary(
  startDir: string,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  return findLocalVoidBin(startDir) ?? findVoidOnPath(env);
}

export function voidNotFoundMessage(): string {
  return (
    "void-jingle: could not find the void CLI.\n" +
    "Install it in this project (e.g. pnpm add -D void) or ensure `void` is available on your PATH."
  );
}

import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { CONFIG_DIR_NAME, CONFIG_FILE_NAME } from "./constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function packageRoot(): string {
  return path.resolve(__dirname, "..");
}

export function bundledAssetsDir(): string {
  return path.join(packageRoot(), "assets");
}

export function userConfigPath(): string {
  return path.join(os.homedir(), ".config", CONFIG_DIR_NAME, CONFIG_FILE_NAME);
}

export function resolvePathMaybe(cwd: string, p: string): string {
  if (path.isAbsolute(p)) {
    return p;
  }
  return path.resolve(cwd, p);
}

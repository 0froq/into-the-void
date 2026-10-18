import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadResolvedConfig } from "../src/config.js";
import { bundledAssetsDir } from "../src/paths.js";

let tmpDirs: string[] = [];

afterEach(() => {
  for (const d of tmpDirs) {
    fs.rmSync(d, { recursive: true, force: true });
  }
  tmpDirs = [];
});

describe("loadResolvedConfig", () => {
  it("uses bundled defaults in empty project", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-cfg-"));
    tmpDirs.push(cwd);
    const cfg = loadResolvedConfig(cwd);
    expect(cfg.audioPath).toBe(path.join(bundledAssetsDir(), "default.wav"));
    expect(cfg.playOnFailure).toBe(false);
  });

  it("merges package.json voidJingle", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-cfg-"));
    tmpDirs.push(cwd);
    const custom = path.join(cwd, "custom.wav");
    fs.writeFileSync(custom, "x");
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({ voidJingle: { audio: "./custom.wav" } }),
    );
    const cfg = loadResolvedConfig(cwd);
    expect(cfg.audioPath).toBe(custom);
  });
});

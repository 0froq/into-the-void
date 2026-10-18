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
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "into-the-void-cfg-"));
    tmpDirs.push(cwd);
    const cfg = loadResolvedConfig(cwd);
    expect(cfg.audioPath).toBe(path.join(bundledAssetsDir(), "default.wav"));
    expect(cfg.playOnFailure).toBe(false);
  });

  it("merges package.json intoTheVoid", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "into-the-void-cfg-"));
    tmpDirs.push(cwd);
    const custom = path.join(cwd, "custom.wav");
    fs.writeFileSync(custom, "x");
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({ intoTheVoid: { audio: "./custom.wav" } }),
    );
    const cfg = loadResolvedConfig(cwd);
    expect(cfg.audioPath).toBe(custom);
  });

  it("falls back to legacy voidJingle package field", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "into-the-void-cfg-"));
    tmpDirs.push(cwd);
    const custom = path.join(cwd, "legacy.wav");
    fs.writeFileSync(custom, "x");
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({ voidJingle: { audio: "./legacy.wav" } }),
    );
    const cfg = loadResolvedConfig(cwd);
    expect(cfg.audioPath).toBe(custom);
  });

  it("reads legacy ~/.config/void-jingle/config.json", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "into-the-void-cfg-"));
    tmpDirs.push(cwd);
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "into-the-void-home-"));
    tmpDirs.push(home);
    const legacyDir = path.join(home, ".config", "void-jingle");
    fs.mkdirSync(legacyDir, { recursive: true });
    const custom = path.join(cwd, "from-legacy.wav");
    fs.writeFileSync(custom, "x");
    fs.writeFileSync(
      path.join(legacyDir, "config.json"),
      JSON.stringify({ audio: custom }),
    );
    const priorHome = process.env.HOME;
    process.env.HOME = home;
    const cfg = loadResolvedConfig(cwd);
    process.env.HOME = priorHome;
    expect(cfg.audioPath).toBe(custom);
  });

  it("prefers intoTheVoid over voidJingle in package.json", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "into-the-void-cfg-"));
    tmpDirs.push(cwd);
    const newFile = path.join(cwd, "new.wav");
    fs.writeFileSync(newFile, "x");
    fs.writeFileSync(path.join(cwd, "old.wav"), "x");
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({
        intoTheVoid: { audio: "./new.wav" },
        voidJingle: { audio: "./old.wav" },
      }),
    );
    const cfg = loadResolvedConfig(cwd);
    expect(cfg.audioPath).toBe(newFile);
  });
});

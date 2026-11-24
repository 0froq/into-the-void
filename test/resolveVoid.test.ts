import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  findLocalVoidBin,
  findVoidOnPath,
  resolveVoidBinary,
} from "../src/resolveVoid.js";

const tmpRoots: string[] = [];
let savedPath: string | undefined;

function mkProjectTree(): {
  root: string;
  nested: string;
  localVoid: string;
  globalVoid: string;
  globalDir: string;
} {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-resolve-"));
  tmpRoots.push(root);
  const nested = path.join(root, "packages", "app");
  fs.mkdirSync(path.join(root, "node_modules", ".bin"), { recursive: true });
  fs.mkdirSync(nested, { recursive: true });

  const localVoid = path.join(root, "node_modules", ".bin", "void");
  fs.writeFileSync(localVoid, "#!/bin/sh\nexit 0\n", { mode: 0o755 });

  const globalDir = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-global-"));
  tmpRoots.push(globalDir);
  const globalVoid = path.join(globalDir, "void");
  fs.writeFileSync(globalVoid, "#!/bin/sh\nexit 9\n", { mode: 0o755 });

  return { root, nested, localVoid, globalVoid, globalDir };
}

afterEach(() => {
  for (const d of tmpRoots) {
    fs.rmSync(d, { recursive: true, force: true });
  }
  tmpRoots.length = 0;
  if (savedPath !== undefined) {
    process.env.PATH = savedPath;
    savedPath = undefined;
  }
});

describe("resolveVoidBinary", () => {
  it("prefers local node_modules/.bin/void when walking up from a nested cwd", () => {
    const { nested, localVoid, globalDir } = mkProjectTree();
    savedPath = process.env.PATH;
    process.env.PATH = `${globalDir}${path.delimiter}${process.env.PATH}`;

    expect(findLocalVoidBin(nested)).toBe(localVoid);
    expect(resolveVoidBinary(nested)).toBe(localVoid);
  });

  it("falls back to void on PATH when no local install exists", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-no-local-"));
    tmpRoots.push(dir);
    const globalDir = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-global-only-"));
    tmpRoots.push(globalDir);
    const globalVoid = path.join(globalDir, "void");
    fs.writeFileSync(globalVoid, "#!/bin/sh\nexit 0\n", { mode: 0o755 });

    savedPath = process.env.PATH;
    process.env.PATH = globalDir;

    expect(findLocalVoidBin(dir)).toBeNull();
    expect(findVoidOnPath(process.env)).toBe(globalVoid);
    expect(resolveVoidBinary(dir, process.env)).toBe(globalVoid);
  });

  it("returns null when void is missing locally and on PATH", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-missing-"));
    tmpRoots.push(dir);
    savedPath = process.env.PATH;
    process.env.PATH = "";

    expect(resolveVoidBinary(dir, process.env)).toBeNull();
  });
});

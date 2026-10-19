import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as onDeploy from "../src/onDeploySuccess.js";
import { runPlayJingle, runVoidDeploy } from "../src/wrapper.js";

let fakeVoidDir: string | null = null;
let originalPath: string | undefined;
let originalCwd: string | undefined;
let projectRoot: string | null = null;

function writeFakeVoid(exitCode: number, mode: "path" | "local" = "path"): void {
  const script = `#!/usr/bin/env node
const code = Number(process.env.FAKE_VOID_EXIT || "0");
process.exit(code);
`;

  if (mode === "local") {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-project-"));
    const binDir = path.join(projectRoot, "node_modules", ".bin");
    fs.mkdirSync(binDir, { recursive: true });
    const scriptPath = path.join(binDir, "void");
    fs.writeFileSync(scriptPath, script, { mode: 0o755 });
    originalCwd = process.cwd();
    process.chdir(projectRoot);
    process.env.FAKE_VOID_EXIT = String(exitCode);
    return;
  }

  fakeVoidDir = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-fake-void-"));
  const scriptPath = path.join(fakeVoidDir, "void");
  fs.writeFileSync(scriptPath, script, { mode: 0o755 });
  originalPath = process.env.PATH;
  process.env.PATH = `${fakeVoidDir}${path.delimiter}${process.env.PATH}`;
  process.env.FAKE_VOID_EXIT = String(exitCode);
}

beforeEach(() => {
  originalCwd = process.cwd();
});

afterEach(() => {
  if (projectRoot) {
    process.chdir(originalCwd ?? projectRoot);
    fs.rmSync(projectRoot, { recursive: true, force: true });
    projectRoot = null;
  }
  if (fakeVoidDir) {
    fs.rmSync(fakeVoidDir, { recursive: true, force: true });
    fakeVoidDir = null;
  }
  if (originalPath !== undefined) {
    process.env.PATH = originalPath;
    originalPath = undefined;
  }
  delete process.env.FAKE_VOID_EXIT;
  vi.restoreAllMocks();
});

describe("runVoidDeploy", () => {
  it("deploy --dry-run skips void and simulates success without resolving void", async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-dry-"));
    projectRoot = empty;
    process.chdir(empty);
    const saved = process.env.PATH;
    process.env.PATH = "";
    const spy = vi.spyOn(onDeploy, "onDeploySuccess").mockResolvedValue();
    const code = await runVoidDeploy(["--prod"], { dryRun: true });
    process.env.PATH = saved;
    expect(code).toBe(0);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0].silence).toEqual({ ignoreNonTTY: true });
  });

  it("forwards exit code 0 and calls onDeploySuccess", async () => {
    writeFakeVoid(0);
    const spy = vi.spyOn(onDeploy, "onDeploySuccess").mockResolvedValue();
    const code = await runVoidDeploy(["--prod"]);
    expect(code).toBe(0);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("uses local node_modules/.bin/void before PATH", async () => {
    writeFakeVoid(0, "local");
    const spy = vi.spyOn(onDeploy, "onDeploySuccess").mockResolvedValue();
    const code = await runVoidDeploy([]);
    expect(code).toBe(0);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("returns 127 when void cannot be resolved", async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-empty-"));
    projectRoot = empty;
    process.chdir(empty);
    const saved = process.env.PATH;
    process.env.PATH = "";
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
    const code = await runVoidDeploy([]);
    expect(code).toBe(127);
    expect(stderr).toHaveBeenCalled();
    process.env.PATH = saved;
    stderr.mockRestore();
  });

  it("forwards non-zero exit and skips success handler", async () => {
    writeFakeVoid(3);
    const successSpy = vi.spyOn(onDeploy, "onDeploySuccess").mockResolvedValue();
    const failureSpy = vi.spyOn(onDeploy, "onDeployFailure").mockResolvedValue();
    const code = await runVoidDeploy([]);
    expect(code).toBe(3);
    expect(successSpy).not.toHaveBeenCalled();
    expect(failureSpy).not.toHaveBeenCalled();
  });
});

describe("runPlayJingle", () => {
  it("invokes onDeploySuccess without dry-run silence override", async () => {
    const spy = vi.spyOn(onDeploy, "onDeploySuccess").mockResolvedValue();
    await runPlayJingle();
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0].silence).toBeUndefined();
  });
});

describe("fake void on PATH", () => {
  it("executable receives deploy subcommand", () => {
    writeFakeVoid(0);
    const logDir = fs.mkdtempSync(path.join(os.tmpdir(), "void-log-"));
    const voidPath = path.join(fakeVoidDir!, "void");
    const wrapper = `#!/usr/bin/env node
const fs = require('fs');
fs.appendFileSync(process.env.VOID_LOG, process.argv.slice(2).join(' ') + '\\n');
process.exit(0);
`;
    fs.writeFileSync(voidPath, wrapper, { mode: 0o755 });
    const logFile = path.join(logDir, "log.txt");
    process.env.VOID_LOG = logFile;
    const r = spawnSync(voidPath, ["deploy", "staging"], { encoding: "utf8" });
    expect(r.status).toBe(0);
    expect(fs.readFileSync(logFile, "utf8").trim()).toBe("deploy staging");
    fs.rmSync(logDir, { recursive: true, force: true });
  });
});

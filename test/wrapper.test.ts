import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as onDeploy from "../src/onDeploySuccess.js";
import { runVoidDeploy } from "../src/wrapper.js";

let fakeVoidDir: string | null = null;
let originalPath: string | undefined;

function writeFakeVoid(exitCode: number): void {
  fakeVoidDir = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-fake-void-"));
  const script = `#!/usr/bin/env node
const code = Number(process.env.FAKE_VOID_EXIT || "0");
process.exit(code);
`;
  const scriptPath = path.join(fakeVoidDir, "void");
  fs.writeFileSync(scriptPath, script, { mode: 0o755 });
  originalPath = process.env.PATH;
  process.env.PATH = `${fakeVoidDir}${path.delimiter}${process.env.PATH}`;
  process.env.FAKE_VOID_EXIT = String(exitCode);
}

afterEach(() => {
  if (fakeVoidDir) {
    fs.rmSync(fakeVoidDir, { recursive: true, force: true });
    fakeVoidDir = null;
  }
  if (originalPath !== undefined) {
    process.env.PATH = originalPath;
  }
  delete process.env.FAKE_VOID_EXIT;
  vi.restoreAllMocks();
});

describe("runVoidDeploy", () => {
  it("forwards exit code 0 and calls onDeploySuccess", async () => {
    writeFakeVoid(0);
    const spy = vi.spyOn(onDeploy, "onDeploySuccess").mockResolvedValue();
    const code = await runVoidDeploy(["--prod"]);
    expect(code).toBe(0);
    expect(spy).toHaveBeenCalledOnce();
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

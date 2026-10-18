import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyInstallBlock,
  getInstallTargets,
  hasVoidJingleBlock,
  installShellIntegration,
  stripVoidJingleBlock,
  uninstallShellIntegration,
} from "../src/install.js";
import { INSTALL_BEGIN_MARKER, INSTALL_END_MARKER } from "../src/constants.js";

const originalHome = os.homedir();
let tmpHome: string | null = null;

function useTempHome(): string {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "void-jingle-home-"));
  process.env.HOME = tmpHome;
  if (process.platform !== "win32") {
    process.env.USERPROFILE = tmpHome;
  }
  return tmpHome;
}

afterEach(() => {
  if (tmpHome) {
    fs.rmSync(tmpHome, { recursive: true, force: true });
    tmpHome = null;
  }
  process.env.HOME = originalHome;
});

describe("install block", () => {
  it("strips marked block exactly", () => {
    const block = `${INSTALL_BEGIN_MARKER}\necho hi\n${INSTALL_END_MARKER}`;
    const content = `# before\n${block}\n# after\n`;
    const stripped = stripVoidJingleBlock(content);
    expect(stripped).toContain("# before");
    expect(stripped).toContain("# after");
    expect(stripped).not.toContain(INSTALL_BEGIN_MARKER);
  });

  it("install and uninstall are idempotent", () => {
    useTempHome();
    const first = installShellIntegration(false);
    expect(first.some((r) => r.action === "created" || r.action === "updated")).toBe(
      true,
    );

    for (const t of getInstallTargets()) {
      expect(fs.existsSync(t.filePath)).toBe(true);
      expect(hasVoidJingleBlock(fs.readFileSync(t.filePath, "utf8"))).toBe(true);
    }

    const second = installShellIntegration(false);
    expect(second.every((r) => r.action === "unchanged")).toBe(true);

    uninstallShellIntegration(false);
    for (const t of getInstallTargets()) {
      if (t.label === "fish") {
        expect(fs.existsSync(t.filePath)).toBe(false);
      } else {
        const content = fs.readFileSync(t.filePath, "utf8");
        expect(hasVoidJingleBlock(content)).toBe(false);
      }
    }

    const again = uninstallShellIntegration(false);
    expect(again.every((r) => r.action === "unchanged" || r.action === "skipped")).toBe(
      true,
    );
  });

  it("dry-run does not write files", () => {
    useTempHome();
    installShellIntegration(true);
    for (const t of getInstallTargets()) {
      expect(fs.existsSync(t.filePath)).toBe(false);
    }
  });

  it("applyInstallBlock replaces existing marked block", () => {
    const blockA = `${INSTALL_BEGIN_MARKER}\nblock-a\n${INSTALL_END_MARKER}\n`;
    const blockB = `${INSTALL_BEGIN_MARKER}\nblock-b\n${INSTALL_END_MARKER}\n`;
    const a = applyInstallBlock("", blockA);
    const b = applyInstallBlock(a, blockB);
    expect(b).toContain("block-b");
    expect(b).not.toContain("block-a");
  });
});

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyInstallBlock,
  getInstallTargets,
  hasInstallBlock,
  installShellIntegration,
  stripInstallBlock,
  uninstallShellIntegration,
} from "../src/install.js";
import {
  INSTALL_BEGIN_MARKER,
  INSTALL_END_MARKER,
  LEGACY_INSTALL_BEGIN_MARKER,
  LEGACY_INSTALL_END_MARKER,
} from "../src/constants.js";

const originalHome = os.homedir();
let tmpHome: string | null = null;

function useTempHome(): string {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "into-the-void-home-"));
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
  it("shell block resolves local void before PATH", () => {
    const bash = getInstallTargets().find((t) => t.label === "bash");
    expect(bash?.block).toContain("_into_the_void_void_bin");
    expect(bash?.block).toContain("command into-the-void deploy");
    expect(bash?.block).toContain("node_modules/.bin/void");
    expect(bash?.block).toContain("whence -p void");
  });

  it("strips marked block exactly", () => {
    const block = `${INSTALL_BEGIN_MARKER}\necho hi\n${INSTALL_END_MARKER}`;
    const content = `# before\n${block}\n# after\n`;
    const stripped = stripInstallBlock(content);
    expect(stripped).toContain("# before");
    expect(stripped).toContain("# after");
    expect(stripped).not.toContain(INSTALL_BEGIN_MARKER);
  });

  it("strips legacy void-jingle blocks on uninstall", () => {
    const legacy = `${LEGACY_INSTALL_BEGIN_MARKER}\nold\n${LEGACY_INSTALL_END_MARKER}`;
    const stripped = stripInstallBlock(`# x\n${legacy}\n`);
    expect(stripped).not.toContain(LEGACY_INSTALL_BEGIN_MARKER);
    expect(stripped).toContain("# x");
  });

  it("install migrates legacy block to into-the-void", () => {
    useTempHome();
    const bashPath = getInstallTargets().find((t) => t.label === "bash")!.filePath;
    const legacy = `${LEGACY_INSTALL_BEGIN_MARKER}\nlegacy\n${LEGACY_INSTALL_END_MARKER}\n`;
    fs.writeFileSync(bashPath, legacy);
    installShellIntegration(false);
    const content = fs.readFileSync(bashPath, "utf8");
    expect(content).toContain(INSTALL_BEGIN_MARKER);
    expect(content).not.toContain(LEGACY_INSTALL_BEGIN_MARKER);
    expect(content).toContain("into-the-void deploy");
  });

  it("install and uninstall are idempotent", () => {
    useTempHome();
    const first = installShellIntegration(false);
    expect(first.some((r) => r.action === "created" || r.action === "updated")).toBe(
      true,
    );

    for (const t of getInstallTargets()) {
      expect(fs.existsSync(t.filePath)).toBe(true);
      expect(hasInstallBlock(fs.readFileSync(t.filePath, "utf8"))).toBe(true);
    }

    const second = installShellIntegration(false);
    expect(second.every((r) => r.action === "unchanged")).toBe(true);

    uninstallShellIntegration(false);
    for (const t of getInstallTargets()) {
      if (t.label === "fish") {
        expect(fs.existsSync(t.filePath)).toBe(false);
      } else {
        const content = fs.readFileSync(t.filePath, "utf8");
        expect(hasInstallBlock(content)).toBe(false);
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

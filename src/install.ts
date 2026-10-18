import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { INSTALL_BEGIN_MARKER, INSTALL_END_MARKER } from "./constants.js";

export interface InstallTarget {
  label: string;
  filePath: string;
  block: string;
}

function shellBlock(): string {
  return `${INSTALL_BEGIN_MARKER}
void() {
  if [[ "\${1:-}" == "deploy" ]]; then
    command void-jingle deploy "\${@:2}"
  else
    command void "$@"
  fi
}
${INSTALL_END_MARKER}
`;
}

function fishBlock(): string {
  return `${INSTALL_BEGIN_MARKER}
function void
  if test (count $argv) -ge 1 -a $argv[1] = deploy
    command void-jingle deploy $argv[2..]
  else
    command void $argv
  end
end
${INSTALL_END_MARKER}
`;
}

export function getInstallTargets(): InstallTarget[] {
  const home = os.homedir();
  const fishConfig =
    process.env.XDG_CONFIG_HOME
      ? path.join(process.env.XDG_CONFIG_HOME, "fish", "functions", "void.fish")
      : path.join(home, ".config", "fish", "functions", "void.fish");

  return [
    { label: "zsh", filePath: path.join(home, ".zshrc"), block: shellBlock() },
    { label: "bash", filePath: path.join(home, ".bashrc"), block: shellBlock() },
    { label: "fish", filePath: fishConfig, block: fishBlock() },
  ];
}

export function stripVoidJingleBlock(content: string): string {
  const begin = content.indexOf(INSTALL_BEGIN_MARKER);
  if (begin === -1) {
    return content;
  }
  const end = content.indexOf(INSTALL_END_MARKER, begin);
  if (end === -1) {
    return content;
  }
  const afterEnd = end + INSTALL_END_MARKER.length;
  let result = content.slice(0, begin) + content.slice(afterEnd);
  result = result.replace(/\n{3,}/g, "\n\n");
  if (result.endsWith("\n\n")) {
    result = result.slice(0, -1);
  }
  return result;
}

export function hasVoidJingleBlock(content: string): boolean {
  return (
    content.includes(INSTALL_BEGIN_MARKER) &&
    content.includes(INSTALL_END_MARKER)
  );
}

export function applyInstallBlock(content: string, block: string): string {
  const stripped = stripVoidJingleBlock(content);
  const trimmed = stripped.replace(/\s+$/, "");
  const separator = trimmed.length === 0 ? "" : "\n\n";
  return `${trimmed}${separator}${block}\n`;
}

export interface InstallResult {
  label: string;
  filePath: string;
  action: "created" | "updated" | "unchanged" | "skipped";
  message?: string;
}

function ensureParentDir(filePath: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

export function installShellIntegration(dryRun: boolean): InstallResult[] {
  const results: InstallResult[] = [];

  for (const target of getInstallTargets()) {
    const exists = fs.existsSync(target.filePath);
    const prior = exists ? fs.readFileSync(target.filePath, "utf8") : "";

    const next = applyInstallBlock(prior, target.block);

    if (next === prior) {
      results.push({
        label: target.label,
        filePath: target.filePath,
        action: "unchanged",
      });
      continue;
    }

    if (dryRun) {
      results.push({
        label: target.label,
        filePath: target.filePath,
        action: exists ? "updated" : "created",
        message: "dry-run",
      });
      continue;
    }

    ensureParentDir(target.filePath);
    fs.writeFileSync(target.filePath, next, "utf8");
    results.push({
      label: target.label,
      filePath: target.filePath,
      action: exists ? "updated" : "created",
    });
  }

  return results;
}

export function uninstallShellIntegration(dryRun: boolean): InstallResult[] {
  const results: InstallResult[] = [];

  for (const target of getInstallTargets()) {
    if (!fs.existsSync(target.filePath)) {
      results.push({
        label: target.label,
        filePath: target.filePath,
        action: "skipped",
        message: "file not found",
      });
      continue;
    }

    const prior = fs.readFileSync(target.filePath, "utf8");
    if (!hasVoidJingleBlock(prior)) {
      results.push({
        label: target.label,
        filePath: target.filePath,
        action: "unchanged",
        message: "no block",
      });
      continue;
    }

    const next = stripVoidJingleBlock(prior);

    if (dryRun) {
      results.push({
        label: target.label,
        filePath: target.filePath,
        action: "updated",
        message: "dry-run",
      });
      continue;
    }

    if (next.trim().length === 0 && target.label === "fish") {
      fs.unlinkSync(target.filePath);
    } else {
      fs.writeFileSync(target.filePath, next.endsWith("\n") ? next : `${next}\n`, "utf8");
    }

    results.push({
      label: target.label,
      filePath: target.filePath,
      action: "updated",
    });
  }

  return results;
}

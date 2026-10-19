import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  INSTALL_BEGIN_MARKER,
  INSTALL_END_MARKER,
  INSTALL_MARKER_PAIRS,
  PACKAGE_NAME,
} from "./constants.js";

export interface InstallTarget {
  label: string;
  filePath: string;
  block: string;
}

function shellResolveHelper(): string {
  return `_into_the_void_void_bin() {
  local dir="$PWD"
  while [[ -n "$dir" && "$dir" != "/" ]]; do
    if [[ -x "$dir/node_modules/.bin/void" ]]; then
      echo "$dir/node_modules/.bin/void"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  local p=""
  if [[ -n "\${ZSH_VERSION:-}" ]]; then
    p="$(whence -p void 2>/dev/null || true)"
  else
    p="$(type -P void 2>/dev/null || true)"
  fi
  if [[ -n "$p" && -x "$p" ]]; then
    echo "$p"
    return 0
  fi
  return 1
}`;
}

function shellBlock(): string {
  return `${INSTALL_BEGIN_MARKER}
${shellResolveHelper()}
void() {
  if [[ "\${1:-}" == "deploy" ]]; then
    command ${PACKAGE_NAME} deploy "\${@:2}"
    return $?
  fi
  local bin
  if bin="$(_into_the_void_void_bin)"; then
    "$bin" "$@"
  else
    echo "${PACKAGE_NAME}: could not find the void CLI. Install it in this project (e.g. pnpm add -D void) or ensure \\\`void\\\` is on your PATH." >&2
    return 127
  fi
}
${INSTALL_END_MARKER}
`;
}

function fishBlock(): string {
  return `${INSTALL_BEGIN_MARKER}
function _into_the_void_void_bin
  set -l dir $PWD
  while test -n "$dir" -a "$dir" != "/"
    if test -x "$dir/node_modules/.bin/void"
      echo "$dir/node_modules/.bin/void"
      return 0
    end
    set dir (dirname $dir)
  end
  for p in $PATH
    if test -x "$p/void"
      echo "$p/void"
      return 0
    end
  end
  return 1
end
function void
  if test (count $argv) -ge 1 -a $argv[1] = deploy
    command ${PACKAGE_NAME} deploy $argv[2..]
    return $status
  else
    set -l bin (_into_the_void_void_bin)
    if test $status -eq 0 -a -n "$bin"
      command $bin $argv
    else
      echo "${PACKAGE_NAME}: could not find the void CLI. Install it in this project (e.g. pnpm add -D void) or ensure \\\`void\\\` is on your PATH." >&2
      return 127
    end
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

function stripMarkerPair(content: string, begin: string, end: string): string {
  const beginIndex = content.indexOf(begin);
  if (beginIndex === -1) {
    return content;
  }
  const endIndex = content.indexOf(end, beginIndex);
  if (endIndex === -1) {
    return content;
  }
  const afterEnd = endIndex + end.length;
  return content.slice(0, beginIndex) + content.slice(afterEnd);
}

export function stripInstallBlock(content: string): string {
  let result = content;
  for (const [begin, end] of INSTALL_MARKER_PAIRS) {
    let next = stripMarkerPair(result, begin, end);
    while (next !== result) {
      result = next;
      next = stripMarkerPair(result, begin, end);
    }
  }
  result = result.replace(/\n{3,}/g, "\n\n");
  if (result.endsWith("\n\n")) {
    result = result.slice(0, -1);
  }
  return result;
}

/** @deprecated Use {@link stripInstallBlock} */
export const stripVoidJingleBlock = stripInstallBlock;

export function hasInstallBlock(content: string): boolean {
  return INSTALL_MARKER_PAIRS.some(
    ([begin, end]) => content.includes(begin) && content.includes(end),
  );
}

/** @deprecated Use {@link hasInstallBlock} */
export const hasVoidJingleBlock = hasInstallBlock;

export function applyInstallBlock(content: string, block: string): string {
  const stripped = stripInstallBlock(content);
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
    if (!hasInstallBlock(prior)) {
      results.push({
        label: target.label,
        filePath: target.filePath,
        action: "unchanged",
        message: "no block",
      });
      continue;
    }

    const next = stripInstallBlock(prior);

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

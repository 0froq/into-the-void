import { runVoidDeploy } from "./wrapper.js";
import {
  installShellIntegration,
  uninstallShellIntegration,
} from "./install.js";

function printHelp(): void {
  console.log(`void-jingle — celebrate successful void deploys

Usage:
  void-jingle deploy [...args]   Run void deploy, then jingle on success
  void-jingle install [--dry-run]  Add shell wrapper to route void deploy
  void-jingle uninstall [--dry-run]  Remove shell wrapper block
  void-jingle help

Environment:
  CI              When set, jingle is disabled
  VOID_JINGLE=0   Disable jingle

Config:
  ~/.config/void-jingle/config.json
  package.json "voidJingle" field (project overrides, user config wins)
`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  const dryRun = argv.includes("--dry-run");
  const filtered = argv.filter((a) => a !== "--dry-run");

  if (command === "deploy") {
    const deployArgs = filtered.slice(1);
    const code = await runVoidDeploy(deployArgs);
    process.exit(code);
  }

  if (command === "install") {
    const results = installShellIntegration(dryRun);
    for (const r of results) {
      const extra = r.message ? ` (${r.message})` : "";
      console.log(`${r.label}: ${r.action} ${r.filePath}${extra}`);
    }
    process.exit(0);
  }

  if (command === "uninstall") {
    const results = uninstallShellIntegration(dryRun);
    for (const r of results) {
      const extra = r.message ? ` (${r.message})` : "";
      console.log(`${r.label}: ${r.action} ${r.filePath}${extra}`);
    }
    process.exit(0);
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

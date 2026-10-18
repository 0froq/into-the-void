import { runPlayJingle, runVoidDeploy } from "./wrapper.js";
import {
  installShellIntegration,
  uninstallShellIntegration,
} from "./install.js";

function printHelp(): void {
  console.log(`void-jingle — celebrate successful void deploys

Usage:
  void-jingle deploy [...args]       Run void deploy, then jingle on success
  void-jingle deploy --dry-run [...]  Skip void; simulate success and play jingle
  void-jingle play                    Play jingle and lyrics (no deploy)
  void-jingle install [--dry-run]     Add shell wrapper to route void deploy
  void-jingle uninstall [--dry-run]   Remove shell wrapper block
  void-jingle help

void is resolved by walking up from cwd for node_modules/.bin/void, then PATH.

Environment:
  CI              When set, jingle is disabled
  VOID_JINGLE=0   Disable jingle
  (no TTY)        Disable jingle (except deploy --dry-run ignores non-TTY)

Config:
  ~/.config/void-jingle/config.json
  package.json "voidJingle" field (user config wins over package.json)
`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  if (command === "deploy") {
    const rest = argv.slice(1);
    const deployDryRun = rest.includes("--dry-run");
    const deployArgs = rest.filter((a) => a !== "--dry-run");
    const code = await runVoidDeploy(deployArgs, { dryRun: deployDryRun });
    process.exit(code);
  }

  if (command === "play") {
    const code = await runPlayJingle();
    process.exit(code);
  }

  if (command === "install") {
    const dryRun = argv.slice(1).includes("--dry-run");
    const results = installShellIntegration(dryRun);
    for (const r of results) {
      const extra = r.message ? ` (${r.message})` : "";
      console.log(`${r.label}: ${r.action} ${r.filePath}${extra}`);
    }
    process.exit(0);
  }

  if (command === "uninstall") {
    const dryRun = argv.slice(1).includes("--dry-run");
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

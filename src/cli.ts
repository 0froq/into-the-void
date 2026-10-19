import { PACKAGE_NAME } from "./constants.js";
import { runPlayJingle, runVoidDeploy } from "./wrapper.js";
import {
  installShellIntegration,
  uninstallShellIntegration,
} from "./install.js";

function printHelp(): void {
  console.log(`${PACKAGE_NAME} — celebrate successful void deploys

Usage:
  ${PACKAGE_NAME} deploy [...args]       Run void deploy, then jingle on success
  ${PACKAGE_NAME} deploy --dry-run [...]  Skip void; simulate success and play jingle
  ${PACKAGE_NAME} play                    Play jingle and print tagline (no deploy)
  ${PACKAGE_NAME} install [--dry-run]     Add shell wrapper to route void deploy
  ${PACKAGE_NAME} uninstall [--dry-run]   Remove shell wrapper block
  ${PACKAGE_NAME} help

void is resolved by walking up from cwd for node_modules/.bin/void, then PATH.

Environment:
  CI                 When set, jingle is disabled
  INTO_THE_VOID=0    Disable jingle (VOID_JINGLE=0 also honored)
  (no TTY)           Disable jingle (except deploy --dry-run ignores non-TTY)

Config:
  ~/.config/into-the-void/config.json (legacy: ~/.config/void-jingle/config.json)
  package.json "intoTheVoid" field (legacy: "voidJingle"; user config wins)
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

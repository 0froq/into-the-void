import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";

function playerCandidates(audioPath: string): Array<{ cmd: string; args: string[] }> {
  const platform = process.platform;

  if (platform === "darwin") {
    return [{ cmd: "afplay", args: [audioPath] }];
  }

  if (platform === "win32") {
    const escaped = audioPath.replace(/'/g, "''");
    return [
      {
        cmd: "powershell",
        args: [
          "-NoProfile",
          "-Command",
          `(New-Object Media.SoundPlayer '${escaped}').PlaySync()`,
        ],
      },
    ];
  }

  if (platform === "linux") {
    return [
      { cmd: "paplay", args: [audioPath] },
      { cmd: "aplay", args: [audioPath] },
      {
        cmd: "ffplay",
        args: ["-nodisp", "-autoexit", "-loglevel", "quiet", audioPath],
      },
    ];
  }

  return [];
}

function canRun(cmd: string): boolean {
  const which = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(which, [cmd], { stdio: "ignore" });
  return r.status === 0;
}

export async function playAudio(audioPath: string): Promise<void> {
  if (!fs.existsSync(audioPath)) {
    return;
  }

  const candidates = playerCandidates(audioPath);
  for (const spec of candidates) {
    if (!canRun(spec.cmd)) {
      continue;
    }

    const ok = await new Promise<boolean>((resolve) => {
      const child = spawn(spec.cmd, spec.args, {
        stdio: "ignore",
        shell: process.platform === "win32",
      });

      child.on("error", () => resolve(false));
      child.on("close", (code) => resolve(code === 0));

      setTimeout(() => {
        child.kill();
        resolve(false);
      }, 60_000);
    });

    if (ok) {
      return;
    }
  }
}

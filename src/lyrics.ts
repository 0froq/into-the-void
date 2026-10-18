import fs from "node:fs";

export interface LrcLine {
  timeMs: number;
  text: string;
}

const LRC_TIME = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

export function parseLrc(content: string): LrcLine[] {
  const lines: LrcLine[] = [];
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    let match: RegExpExecArray | null;
    const times: number[] = [];
    const re = new RegExp(LRC_TIME.source, "g");
    while ((match = re.exec(line)) !== null) {
      const min = Number(match[1]);
      const sec = Number(match[2]);
      const frac = match[3] ? Number(match[3].padEnd(3, "0")) : 0;
      times.push(min * 60_000 + sec * 1000 + frac);
    }
    const text = line.replace(LRC_TIME, "").trim();
    if (!text) {
      continue;
    }
    for (const timeMs of times) {
      lines.push({ timeMs, text });
    }
  }
  lines.sort((a, b) => a.timeMs - b.timeMs);
  return lines;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function printLyrics(
  lyricsPath: string,
  lrcPath: string | null,
): Promise<void> {
  if (lrcPath && fs.existsSync(lrcPath)) {
    const lrc = fs.readFileSync(lrcPath, "utf8");
    const parsed = parseLrc(lrc);
    if (parsed.length > 0) {
      const start = Date.now();
      for (const { timeMs, text } of parsed) {
        const wait = timeMs - (Date.now() - start);
        if (wait > 0) {
          await sleep(wait);
        }
        console.log(text);
      }
      return;
    }
  }

  if (fs.existsSync(lyricsPath)) {
    const text = fs.readFileSync(lyricsPath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      console.log(line);
    }
  }
}

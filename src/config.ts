import fs from "node:fs";
import path from "node:path";
import type { ResolvedConfig, VoidJingleConfig } from "./types.js";
import {
  bundledAssetsDir,
  resolvePathMaybe,
  userConfigPath,
} from "./paths.js";

const DEFAULT_AUDIO = "default.wav";
const DEFAULT_LYRICS = "default.txt";
const DEFAULT_LRC = "default.lrc";

function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function loadUserConfig(): VoidJingleConfig | null {
  const p = userConfigPath();
  const data = readJsonFile(p);
  if (!data) {
    return null;
  }
  return data as VoidJingleConfig;
}

function loadPackageConfig(cwd: string): VoidJingleConfig | null {
  const pkgPath = path.join(cwd, "package.json");
  const data = readJsonFile(pkgPath);
  if (!data || !data.voidJingle) {
    return null;
  }
  return data.voidJingle as VoidJingleConfig;
}

function mergeConfig(
  base: VoidJingleConfig,
  ...overrides: (VoidJingleConfig | null)[]
): VoidJingleConfig {
  const out: VoidJingleConfig = { ...base };
  for (const o of overrides) {
    if (!o) {
      continue;
    }
    if (o.audio !== undefined) {
      out.audio = o.audio;
    }
    if (o.lyrics !== undefined) {
      out.lyrics = o.lyrics;
    }
    if (o.lrc !== undefined) {
      out.lrc = o.lrc;
    }
    if (o.playOnFailure !== undefined) {
      out.playOnFailure = o.playOnFailure;
    }
    if (o.failureAudio !== undefined) {
      out.failureAudio = o.failureAudio;
    }
  }
  return out;
}

function bundledDefaults(): VoidJingleConfig {
  const assets = bundledAssetsDir();
  return {
    audio: path.join(assets, DEFAULT_AUDIO),
    lyrics: path.join(assets, DEFAULT_LYRICS),
    lrc: path.join(assets, DEFAULT_LRC),
    playOnFailure: false,
  };
}

export function loadResolvedConfig(cwd: string): ResolvedConfig {
  const bundled = bundledDefaults();
  const merged = mergeConfig(
    bundled,
    loadPackageConfig(cwd),
    loadUserConfig(),
  );

  const assets = bundledAssetsDir();
  const audioPath = merged.audio
    ? resolvePathMaybe(cwd, merged.audio)
    : path.join(assets, DEFAULT_AUDIO);
  const lyricsPath = merged.lyrics
    ? resolvePathMaybe(cwd, merged.lyrics)
    : path.join(assets, DEFAULT_LYRICS);
  let lrcPath: string | null = null;
  if (merged.lrc) {
    const resolved = resolvePathMaybe(cwd, merged.lrc);
    if (fs.existsSync(resolved)) {
      lrcPath = resolved;
    }
  }

  const failureAudioPath =
    merged.failureAudio && merged.playOnFailure
      ? resolvePathMaybe(cwd, merged.failureAudio)
      : null;

  return {
    audioPath,
    lyricsPath,
    lrcPath,
    playOnFailure: merged.playOnFailure ?? false,
    failureAudioPath,
  };
}

import fs from "node:fs";
import path from "node:path";
import type { IntoTheVoidConfig, ResolvedConfig } from "./types.js";
import {
  LEGACY_PACKAGE_JSON_CONFIG_KEY,
  PACKAGE_JSON_CONFIG_KEY,
} from "./constants.js";
import {
  bundledAssetsDir,
  resolvePathMaybe,
  userConfigCandidates,
} from "./paths.js";

const DEFAULT_AUDIO = "default.wav";

function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function loadUserConfig(): IntoTheVoidConfig | null {
  for (const configPath of userConfigCandidates()) {
    const data = readJsonFile(configPath);
    if (data) {
      return data as IntoTheVoidConfig;
    }
  }
  return null;
}

function loadPackageConfig(cwd: string): IntoTheVoidConfig | null {
  const pkgPath = path.join(cwd, "package.json");
  const data = readJsonFile(pkgPath);
  if (!data) {
    return null;
  }
  if (data[PACKAGE_JSON_CONFIG_KEY]) {
    return data[PACKAGE_JSON_CONFIG_KEY] as IntoTheVoidConfig;
  }
  if (data[LEGACY_PACKAGE_JSON_CONFIG_KEY]) {
    return data[LEGACY_PACKAGE_JSON_CONFIG_KEY] as IntoTheVoidConfig;
  }
  return null;
}

function mergeConfig(
  base: IntoTheVoidConfig,
  ...overrides: (IntoTheVoidConfig | null)[]
): IntoTheVoidConfig {
  const out: IntoTheVoidConfig = { ...base };
  for (const o of overrides) {
    if (!o) {
      continue;
    }
    if (o.audio !== undefined) {
      out.audio = o.audio;
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

function bundledDefaults(): IntoTheVoidConfig {
  const assets = bundledAssetsDir();
  return {
    audio: path.join(assets, DEFAULT_AUDIO),
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

  const failureAudioPath =
    merged.failureAudio && merged.playOnFailure
      ? resolvePathMaybe(cwd, merged.failureAudio)
      : null;

  return {
    audioPath,
    playOnFailure: merged.playOnFailure ?? false,
    failureAudioPath,
  };
}

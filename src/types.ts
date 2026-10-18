import type { SilenceOptions } from "./silence.js";

export interface IntoTheVoidConfig {
  audio?: string;
  lyrics?: string;
  lrc?: string;
  playOnFailure?: boolean;
  failureAudio?: string;
}

/** @deprecated Use {@link IntoTheVoidConfig} */
export type VoidJingleConfig = IntoTheVoidConfig;

export interface DeploySuccessContext {
  cwd: string;
  env: NodeJS.ProcessEnv;
  isTTY: boolean;
  config: ResolvedConfig;
  silence?: SilenceOptions;
}

export interface ResolvedConfig {
  audioPath: string;
  lyricsPath: string;
  lrcPath: string | null;
  playOnFailure: boolean;
  failureAudioPath: string | null;
}

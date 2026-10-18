export interface VoidJingleConfig {
  audio?: string;
  lyrics?: string;
  lrc?: string;
  playOnFailure?: boolean;
  failureAudio?: string;
}

export interface DeploySuccessContext {
  cwd: string;
  env: NodeJS.ProcessEnv;
  isTTY: boolean;
  config: ResolvedConfig;
}

export interface ResolvedConfig {
  audioPath: string;
  lyricsPath: string;
  lrcPath: string | null;
  playOnFailure: boolean;
  failureAudioPath: string | null;
}

export interface SilenceOptions {
  /** When true, allow playback without a TTY (still respects CI and disable env vars). */
  ignoreNonTTY?: boolean;
}

export function shouldStaySilent(
  env: NodeJS.ProcessEnv,
  isTTY: boolean,
  options?: SilenceOptions,
): boolean {
  if (env.CI) {
    return true;
  }
  if (env.INTO_THE_VOID === "0" || env.VOID_JINGLE === "0") {
    return true;
  }
  if (!isTTY && !options?.ignoreNonTTY) {
    return true;
  }
  return false;
}

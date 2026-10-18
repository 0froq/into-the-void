export interface SilenceOptions {
  /** When true, allow playback without a TTY (still respects CI and VOID_JINGLE=0). */
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
  if (env.VOID_JINGLE === "0") {
    return true;
  }
  if (!isTTY && !options?.ignoreNonTTY) {
    return true;
  }
  return false;
}

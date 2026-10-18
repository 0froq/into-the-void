export function shouldStaySilent(env: NodeJS.ProcessEnv, isTTY: boolean): boolean {
  if (env.CI) {
    return true;
  }
  if (env.VOID_JINGLE === "0") {
    return true;
  }
  if (!isTTY) {
    return true;
  }
  return false;
}

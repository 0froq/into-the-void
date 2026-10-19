export const TAGLINE_TEXT = "into the void";

const GRADIENT = ["\x1b[38;5;141m", "\x1b[38;5;135m", "\x1b[1;38;5;163m", "\x1b[1;35m"];
const RESET = "\x1b[0m";

export function formatIntoTheVoid(
  env: NodeJS.ProcessEnv,
  isTTY: boolean,
): string {
  if (!isTTY || env.NO_COLOR !== undefined) {
    return TAGLINE_TEXT;
  }

  const chars = TAGLINE_TEXT.split("");
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const color = GRADIENT[i % GRADIENT.length];
    out += `${color}${chars[i]}`;
  }
  return `${out}${RESET}`;
}

export function printIntoTheVoid(env: NodeJS.ProcessEnv, isTTY: boolean): void {
  console.log(formatIntoTheVoid(env, isTTY));
}

/* eslint-disable no-control-regex -- ANSI escape stripping in tests */
export function stripAnsi(value: string): string {
  return value.replace(/\x1b\[[0-9;]*m/g, "");
}

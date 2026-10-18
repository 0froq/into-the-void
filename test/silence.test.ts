import { describe, expect, it } from "vitest";
import { shouldStaySilent } from "../src/silence.js";

describe("shouldStaySilent", () => {
  it("is silent when CI is set", () => {
    expect(shouldStaySilent({ CI: "true" }, true)).toBe(true);
    expect(shouldStaySilent({ CI: "1" }, true)).toBe(true);
  });

  it("is silent when VOID_JINGLE=0", () => {
    expect(shouldStaySilent({ VOID_JINGLE: "0" }, true)).toBe(true);
  });

  it("is silent without TTY", () => {
    expect(shouldStaySilent({}, false)).toBe(true);
  });

  it("plays when interactive and no suppressors", () => {
    expect(shouldStaySilent({}, true)).toBe(false);
  });

  it("allows non-TTY when ignoreNonTTY is set", () => {
    expect(shouldStaySilent({}, false, { ignoreNonTTY: true })).toBe(false);
    expect(shouldStaySilent({ CI: "1" }, false, { ignoreNonTTY: true })).toBe(true);
  });
});

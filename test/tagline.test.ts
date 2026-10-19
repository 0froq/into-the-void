import { describe, expect, it } from "vitest";
import { formatIntoTheVoid, TAGLINE_TEXT } from "../src/tagline.js";
import { stripAnsi } from "./helpers.js";

describe("formatIntoTheVoid", () => {
  it("returns plain text without TTY", () => {
    expect(formatIntoTheVoid({}, false)).toBe(TAGLINE_TEXT);
  });

  it("returns plain text when NO_COLOR is set", () => {
    const styled = formatIntoTheVoid({ NO_COLOR: "1" }, true);
    expect(styled).toBe(TAGLINE_TEXT);
    expect(styled).not.toContain("\x1b");
  });

  it("applies ANSI styling on TTY without NO_COLOR", () => {
    const styled = formatIntoTheVoid({}, true);
    const plain = stripAnsi(styled);
    expect(plain).toBe(TAGLINE_TEXT);
    expect(styled).toContain("\x1b");
  });
});

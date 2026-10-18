import { describe, expect, it } from "vitest";
import { parseLrc } from "../src/lyrics.js";

describe("parseLrc", () => {
  it("parses timestamps and text", () => {
    const lines = parseLrc(`[00:01.50]Hello\n[00:02]World`);
    expect(lines).toHaveLength(2);
    expect(lines[0].timeMs).toBe(1500);
    expect(lines[0].text).toBe("Hello");
    expect(lines[1].timeMs).toBe(2000);
  });
});

import { describe, expect, it, vi } from "vitest";
import { playAudio } from "../src/audio.js";
import { onDeploySuccess } from "../src/onDeploySuccess.js";
import { bundledAssetsDir } from "../src/paths.js";
import path from "node:path";
import { stripAnsi } from "./helpers.js";

describe("onDeploySuccess", () => {
  it("prints tagline and calls playAudio without playing real audio", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await onDeploySuccess({
      cwd: process.cwd(),
      env: {},
      isTTY: true,
      config: {
        audioPath: path.join(bundledAssetsDir(), "default.wav"),
        playOnFailure: false,
        failureAudioPath: null,
      },
    });
    expect(log).toHaveBeenCalledOnce();
    const printed = stripAnsi(String(log.mock.calls[0][0]));
    expect(printed).toBe("into the void");
    expect(playAudio).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});

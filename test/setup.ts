import { vi } from "vitest";

vi.mock("../src/audio.js", () => ({
  playAudio: vi.fn(async () => {}),
}));

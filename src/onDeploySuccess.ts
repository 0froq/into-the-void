import type { DeploySuccessContext } from "./types.js";
import { shouldStaySilent } from "./silence.js";
import { playAudio } from "./audio.js";
import { printLyrics } from "./lyrics.js";

export async function onDeploySuccess(ctx: DeploySuccessContext): Promise<void> {
  if (shouldStaySilent(ctx.env, ctx.isTTY)) {
    return;
  }

  const { config } = ctx;

  await Promise.all([
    playAudio(config.audioPath),
    printLyrics(config.lyricsPath, config.lrcPath),
  ]);
}

export async function onDeployFailure(ctx: DeploySuccessContext): Promise<void> {
  if (shouldStaySilent(ctx.env, ctx.isTTY)) {
    return;
  }

  const { config } = ctx;
  if (!config.playOnFailure || !config.failureAudioPath) {
    return;
  }

  await playAudio(config.failureAudioPath).catch(() => {
    /* never fail */
  });
}

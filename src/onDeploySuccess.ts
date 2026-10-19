import type { DeploySuccessContext } from "./types.js";
import { shouldStaySilent } from "./silence.js";
import { playAudio } from "./audio.js";
import { printIntoTheVoid } from "./tagline.js";

export async function onDeploySuccess(ctx: DeploySuccessContext): Promise<void> {
  if (shouldStaySilent(ctx.env, ctx.isTTY, ctx.silence)) {
    return;
  }

  const { config } = ctx;

  printIntoTheVoid(ctx.env, ctx.isTTY);
  await playAudio(config.audioPath);
}

export async function onDeployFailure(ctx: DeploySuccessContext): Promise<void> {
  if (shouldStaySilent(ctx.env, ctx.isTTY, ctx.silence)) {
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

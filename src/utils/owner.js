import { env } from "../config/env.js";
import { messages } from "../constants/messages.js";
import { replyEphemeral } from "./discord.js";

export function isBotOwner(userId) {
  return String(userId) === String(env.ownerId);
}

export async function requireOwner(interaction) {
  if (isBotOwner(interaction.user.id)) return true;
  await replyEphemeral(interaction, messages.ownerOnly);
  return false;
}

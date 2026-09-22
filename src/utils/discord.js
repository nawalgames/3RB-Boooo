import { MessageFlags } from "discord.js";
import { messages } from "../constants/messages.js";

export async function replyEphemeral(interaction, content) {
  const response = { content, flags: MessageFlags.Ephemeral };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(response).catch(() => {});
  } else {
    await interaction.reply(response).catch(() => {});
  }
}

export async function sendTemporaryWarning(channel) {
  const warning = await channel.send(messages.linkWarning);

  setTimeout(() => {
    warning.delete().catch(() => {});
  }, 5000);
}

import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { env } from "./env.js";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates, // <--- أضفنا هذه الصلاحية خصيصاً لتتبع الرومات الصوتية
  ],
});

export const rest = new REST({ version: "10" }).setToken(env.discordToken);

export async function registerCommands(commands) {
  await rest.put(Routes.applicationCommands(env.discordClientId), {
    body: commands,
  });

  console.info("Slash commands registered.");
}

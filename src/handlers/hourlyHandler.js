import { hourlyReminders } from "../constants/messages.js";
import { getSettings } from "../services/firebaseStore.js";

async function sendReminders(client) {
  try {
    for (const [guildId, guild] of client.guilds.cache) {
      const settings = await getSettings(guildId);
      if (!settings || !settings.hourly_enabled || !settings.general_channel) continue;

      const channel = await client.channels
        .fetch(settings.general_channel)
        .catch(() => null);

      if (!channel?.isTextBased()) continue;

      const reminder =
        hourlyReminders[Math.floor(Math.random() * hourlyReminders.length)];
      await channel.send(reminder);
    }
  } catch (error) {
    console.error("Failed to send hourly automated message.", error);
  }
}

export function startHourlyReminders(client) {
  // 18000000 تعني 5 ساعات تماماً (5 ساعات × 60 دقيقة × 60 ثانية × 1000 ميلي ثانية)
  const FIVE_HOURS = 18000000;

  // تكرار العملية كل 5 ساعات
  setInterval(() => {
    sendReminders(client);
  }, FIVE_HOURS);
}

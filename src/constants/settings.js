export const defaultSettings = (guildId, generalChannelId) => ({
  guild_id: guildId,
  general_channel: generalChannelId || null,
  activity_channel: null, // <--- أضف هذا السطر لحفظ قناة السجل والنشاط
  anti_link_enabled: 1,
  auto_salam_enabled: 1,
  faq_enabled: 1,
  ai_enabled: 1,
  hourly_enabled: 1,
  exempt_channels: "",
});

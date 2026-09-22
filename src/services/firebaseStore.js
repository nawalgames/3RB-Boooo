import { db } from "../config/firebase.js";
import { env } from "../config/env.js";
import { defaultSettings } from "../constants/settings.js";

const read = async (path, fallback) => {
  const snapshot = await db.ref(path).once("value");
  return snapshot.exists() ? snapshot.val() : fallback;
};

export async function getSettings(guildId) {
  const path = `settings/${guildId}`;
  const existing = await read(path, null);

  if (!existing) {
    const settings = {
      ...defaultSettings(guildId, env.generalChannelId),
      anti_link_enabled: true,
    };
    await db.ref(path).set(settings);
    return settings;
  }

  const settings = {
    ...existing,
    ai_enabled: existing.ai_enabled === undefined ? 1 : existing.ai_enabled,
    hourly_enabled:
      existing.hourly_enabled === undefined ? 1 : existing.hourly_enabled,
    anti_link_enabled:
      existing.anti_link_enabled === undefined ? true : Boolean(existing.anti_link_enabled),
  };

  if (
    settings.ai_enabled !== existing.ai_enabled ||
    settings.hourly_enabled !== existing.hourly_enabled ||
    settings.anti_link_enabled !== existing.anti_link_enabled
  ) {
    await db.ref(path).set(settings);
  }

  return settings;
}

export async function saveSettings(guildId, settings) {
  await db.ref(`settings/${guildId}`).set(settings);
}

export async function updateSettings(guildId, partialSettings) {
  await db.ref(`settings/${guildId}`).update(partialSettings);
}

export async function getFaqs(guildId) {
  return read(`faqs/${guildId}`, {});
}

export async function saveFaq(guildId, key, faq) {
  await db.ref(`faqs/${guildId}/${key}`).set(faq);
}

export async function deleteFaq(guildId, key) {
  await db.ref(`faqs/${guildId}/${key}`).remove();
}

export async function getBanWords(guildId) {
  return read(`banwords/${guildId}`, {});
}

export async function saveBanWord(guildId, key, banWord) {
  await db.ref(`banwords/${guildId}/${encodeURIComponent(key)}`).set(banWord);
}

export async function deleteBanWord(guildId, key) {
  await db.ref(`banwords/${guildId}/${encodeURIComponent(key)}`).remove();
}

export async function getLevel(guildId, userId) {
  return read(`levels/${guildId}/${userId}`, null);
}

export async function saveLevel(guildId, userId, userData) {
  await db.ref(`levels/${guildId}/${userId}`).set(userData);
}

/* =========================
   LEADERBOARD SYSTEM
========================= */

export async function getTopUsers(guildId, limit = 3) {
  const snapshot = await db.ref(`levels/${guildId}`).once("value");
  const data = snapshot.val();

  if (!data) return [];

  return Object.entries(data)
    .map(([userId, user]) => ({
      userId,
      level: Number(user.level) || 1,
      xp: Number(user.xp) || 0,
    }))
    .sort((a, b) => b.level - a.level || b.xp - a.xp)
    .slice(0, limit);
}

/* =========================
   ACTIVITY TRACKING SYSTEM (جديد)
========================= */

export async function getUserActivity(guildId, userId) {
  return read(`activity/${guildId}/${userId}`, {
    messagesCount: 0,
    voiceMinutes: 0,
    muteCount: 0,
    lastActive: Date.now(),
  });
}

export async function incrementMessageCount(guildId, userId) {
  const ref = db.ref(`activity/${guildId}/${userId}`);
  const snapshot = await ref.once("value");
  const data = snapshot.val() || { messagesCount: 0, voiceMinutes: 0, muteCount: 0 };

  await ref.update({
    messagesCount: (data.messagesCount || 0) + 1,
    lastActive: Date.now(),
  });
}

export async function addVoiceTime(guildId, userId, minutes) {
  const ref = db.ref(`activity/${guildId}/${userId}`);
  const snapshot = await ref.once("value");
  const data = snapshot.val() || { messagesCount: 0, voiceMinutes: 0, muteCount: 0 };

  await ref.update({
    voiceMinutes: (data.voiceMinutes || 0) + minutes,
    lastActive: Date.now(),
  });
}

export async function incrementMuteCount(guildId, userId) {
  const ref = db.ref(`activity/${guildId}/${userId}`);
  const snapshot = await ref.once("value");
  const data = snapshot.val() || { messagesCount: 0, voiceMinutes: 0, muteCount: 0 };

  await ref.update({
    muteCount: (data.muteCount || 0) + 1,
    lastActive: Date.now(),
  });
}

/* =========================
   ACTIVITY CHANNEL SETTINGS
========================= */

export async function getActivityChannel(guildId) {
  return read(`settings/${guildId}/activityChannel`, null);
}

export async function setActivityChannel(guildId, channelId) {
  await db.ref(`settings/${guildId}/activityChannel`).set(channelId);
}

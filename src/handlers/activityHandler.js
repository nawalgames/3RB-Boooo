import { Events } from "discord.js";
import {
  incrementMessageCount,
  addVoiceTime,
  incrementMuteCount,
} from "../services/firebaseStore.js";

const voiceSessionTracker = new Map(); // لتتبع وقت دخول الأعضاء للرومات

export function setupActivityTracking(client) {
  // 1. تتبع الرسائل في الشات
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    try {
      await incrementMessageCount(message.guild.id, message.author.id);
    } catch (error) {
      console.error("Failed to track message activity:", error);
    }
  });

  // 2. تتبع الرومات الصوتية
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guildId = member.guild.id;
    const userId = member.id;
    const sessionKey = `${guildId}-${userId}`;

    const joinedVoice = !oldState.channelId && newState.channelId;
    const leftVoice = oldState.channelId && !newState.channelId;
    const switchedVoice = oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;

    if (joinedVoice || switchedVoice) {
      voiceSessionTracker.set(sessionKey, Date.now());
    }

    if (leftVoice) {
      const joinTime = voiceSessionTracker.get(sessionKey);
      if (joinTime) {
        const durationMinutes = Math.round((Date.now() - joinTime) / (1000 * 60));
        voiceSessionTracker.delete(sessionKey);

        if (durationMinutes > 0) {
          try {
            await addVoiceTime(guildId, userId, durationMinutes);
          } catch (error) {
            console.error("Failed to track voice activity:", error);
          }
        }
      }
    }
  });

  // 3. تتبع الكتم (Timeout) داخل السيرفر
  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (!newMember || newMember.user.bot) return;

    const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
    const newTimeout = newMember.communicationDisabledUntilTimestamp;

    const wasNotMuted = !oldTimeout || oldTimeout < Date.now();
    const isNowMuted = newTimeout && newTimeout > Date.now();

    // احتساب مرة كتم جديدة فقط عند الانتقال من "غير مكتوم" إلى "مكتوم"
    if (wasNotMuted && isNowMuted) {
      try {
        await incrementMuteCount(newMember.guild.id, newMember.id);
      } catch (error) {
        console.error("Failed to track mute activity:", error);
      }
    }
  });
}

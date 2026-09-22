import { PermissionFlagsBits } from "discord.js";
import { env } from "../config/env.js";
import { messages } from "../constants/messages.js";
import {
  getBanWords,
  getFaqs,
  getLevel,
  getSettings,
  getTopUsers,
  saveLevel,
  getUserActivity,
} from "../services/firebaseStore.js";
import { askAI, getFallbackReply } from "../services/ai/aiService.js";
import {
  containsLinkOrInvite,
  exemptChannelIds,
  isLevelQuestion,
  isSalam,
  splitDiscordMessage,
} from "../utils/text.js";

const processedMessages = new Set();
const salamCooldowns = new Map();
const xpCooldowns = new Map();
const aiCooldowns = new Map();

function rememberMessage(messageId) {
  if (processedMessages.has(messageId)) return false;

  processedMessages.add(messageId);

  setTimeout(() => {
    processedMessages.delete(messageId);
  }, 60000);

  return true;
}

/* =========================
   LEVEL SYSTEM & LEADERBOARD
========================= */

async function handleLevelQuestion(message) {
  const userData = await getLevel(
    message.guildId,
    message.author.id,
  );

  if (!userData) {
    await message.reply(
      `📊 <@${message.author.id}> ${messages.defaultLevel}`,
    );
    return;
  }

  const level = Number(userData.level) || 1;
  const xp = Number(userData.xp) || 0;

  if (level >= 50) {
    await message.reply(
      `👑 <@${message.author.id}> بلغت قمة المجد! مستواك الحالي هو **[ 50 MAX ]** ⚔️🔥\n🌟 **XP: مكتمل بالكامل**\n🏆 *(سُجل اسمك بحروف من ذهب في أساطير السيرفر)*`,
    );
    return;
  }

  await message.reply(
    `📊 <@${message.author.id}> مستواك الحالي هو **${level}** ✨\n⭐ XP: **${xp} / ${level * 100}**`,
  );
}

async function handleLeaderboard(message) {
  const topUsers = await getTopUsers(message.guildId, 3);

  if (!topUsers || topUsers.length === 0) {
    await message.reply("📊 لا يوجد بيانات مستويات مسجلة في السيرفر حالياً!");
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  let leaderboardText = `🏆 **| أساطير السيرفر (أعلى 3 مستويات)**\n\n`;

  topUsers.forEach((user, index) => {
    const medal = medals[index] || "⭐";
    const isMax = Number(user.level) >= 50;

    const userTitle = isMax
      ? `<@${user.userId}> 👑`
      : `<@${user.userId}>`;

    const levelDisplay = isMax
      ? `**50** 🔴 **[ MAX ]**`
      : `**${user.level}**`;

    leaderboardText += `${medal} **المركز ${index + 1}:** ${userTitle}\n┗ 📊 المستوى: ${levelDisplay} | ⭐ XP: **${user.xp}**\n\n`;
  });

  leaderboardText += `⚔️ *واصل التفاعل للوصول للقائمة الملكية!* 🔥`;

  await message.reply(leaderboardText);
}

/* =========================
   ACTIVITY KEYWORDS SYSTEM (محدث وجذري)
========================= */

async function handleActivityKeyword(message) {
  const content = message.content.trim().toLowerCase();
  const triggers = ["نشاطي", "!نشاطي", "!سجلي", "!السجل", "إنشاطي"];

  if (!triggers.includes(content)) {
    return false;
  }

  try {
    const settings = await getSettings(message.guild.id);
    const targetChannelId = settings.activityChannel || "1549377399731396658";

    if (message.channel.id !== targetChannelId) {
      await message.delete().catch(() => {});
      
      const warning = await message.channel.send(
        `❌ <@${message.author.id}> أوامر السجل والنشاط مخصصة للاستخدام حصراً داخل قناة السجل: <#${targetChannelId}>`
      );
      setTimeout(() => warning.delete().catch(() => {}), 5000);
      
      return true;
    }

    await message.delete().catch(() => {});

    const targetChannel = message.guild.channels.cache.get(targetChannelId) || message.channel;

    const user = message.author;
    const member = message.member || await message.guild.members.fetch(user.id).catch(() => null);
    
    const joinedAt = member?.joinedAt || user.createdAt;
    const joinedTimestamp = Math.floor(joinedAt.getTime() / 1000);
    const daysInServer = Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24));

    const activity = await getUserActivity(message.guild.id, user.id);
    const messagesCount = activity.messagesCount || 0;
    const voiceMinutes = activity.voiceMinutes || 0;
    const muteCount = activity.muteCount || 0;

    const hours = Math.floor(voiceMinutes / 60);
    const minutes = voiceMinutes % 60;
    const voiceDisplay = hours > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${minutes} دقيقة`;

    const embed = {
      color: 0x1a1a2e,
      author: {
        name: `تقرير نشاط العضو: ${user.username}`,
        icon_url: user.displayAvatarURL({ dynamic: true }),
      },
      fields: [
        {
          name: "🔹 سجل الانضمام",
          value: `> 📅 تاريخ الانضمام: <t:${joinedTimestamp}:D>\n> ⏳ الفترة المضاة: **${daysInServer} يوماً**`,
        },
        {
          name: "🟢 التفاعل في الشات",
          value: `> 💬 عدد الرسائل: **${messagesCount} رسالة**`,
        },
        {
          name: "🟠 النشاط الصوتي",
          value: `> 🎙️ الوقت في الرومات: **${voiceDisplay}**`,
        },
        {
          name: "🟣 سجل الكتم",
          value: `> 🔇 عدد مرات الكتم: **${muteCount} مرة**`,
        },
      ],
      thumbnail: {
        url: user.displayAvatarURL({ dynamic: true, size: 256 }),
      },
      footer: {
        text: `3RB Bot | طلب بواسطة ${user.tag}`,
        icon_url: message.guild.iconURL({ dynamic: true }),
      },
      timestamp: new Date().toISOString(),
    };

    await targetChannel.send({
      content: `📊 **إليك تقرير نشاطك يا بطل:** <@${user.id}>`,
      embeds: [embed],
    });

  } catch (error) {
    console.error("Error handling activity keyword:", error);
  }

  return true;
}

/* =========================
   AI MENTION
========================= */

async function handleAiMention(message, client) {
  if (!client.user || !message.mentions.has(client.user)) {
    return false;
  }

  const lastAiTime =
    aiCooldowns.get(message.author.id) ?? 0;

  if (Date.now() - lastAiTime < 5000) {
    return true;
  }

  aiCooldowns.set(
    message.author.id,
    Date.now(),
  );

  await message.channel.sendTyping();

  const mentionRegex = new RegExp(
    `<@!?${client.user.id}>`,
    "g",
  );

  const prompt = message.content
    .replace(mentionRegex, "")
    .trim();

  if (!prompt) {
    await message.reply(messages.emptyAiPrompt);
    return true;
  }

  try {
    const replyText = await askAI(prompt);

    if (!replyText) {
      await message.reply(getFallbackReply());
      return true;
    }

    if (replyText.length <= 2000) {
      await message.reply(replyText);
      return true;
    }

    const chunks = splitDiscordMessage(replyText);

    for (const [index, chunk] of chunks.entries()) {
      if (index === 0) {
        await message.reply(chunk);
      } else {
        await message.channel.send(chunk);
      }
    }
  } catch (error) {
    console.error(
      "All AI providers failed.",
      error,
    );

    await message.reply(getFallbackReply());
  }

  return true;
}

/* =========================
   FORBIDDEN WORDS
========================= */

async function handleForbiddenWords(message) {
  if (
    !message.content.trim() ||
    !message.member ||
    message.member.permissions.has(
      PermissionFlagsBits.ManageGuild,
    )
  ) {
    return false;
  }

  const banWords = await getBanWords(
    message.guildId,
  );

  const banWordsList = Object.values(banWords);

  const normalizedContent =
    message.content.toLocaleLowerCase();

  const matchedWord = banWordsList.find(
    ({ keyword }) =>
      keyword &&
      normalizedContent.includes(
        keyword.toLocaleLowerCase(),
      ),
  );

  if (!matchedWord) {
    return false;
  }

  const duration =
    Number(matchedWord.duration) || 10;

  await message.delete().catch(() => {});

  if (!message.member.moderatable) {
    return true;
  }

  const success = await message.member
    .timeout(
      duration * 60 * 1000,
      `استخدام كلمة ممنوعة: ${matchedWord.keyword}`,
    )
    .then(() => true)
    .catch((error) => {
      console.error(
        "Failed to timeout member.",
        error,
      );

      return false;
    });

  if (!success) {
    return true;
  }

  const warning = await message.channel
    .send(
      `🔇 <@${message.author.id}> تم كتمك لمدة **${duration} دقيقة** بسبب استخدام كلمة ممنوعة.`,
    )
    .catch(() => null);

  if (warning) {
    setTimeout(() => {
      warning.delete().catch(() => {});
    }, 5000);
  }

  return true;
}

/* =========================
   FAQ / SMART REPLIES
========================= */

function normalizeText(text) {
  return String(text ?? "")
    .toLocaleLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[؟?!.,،]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasBotCall(message, client) {
  const content = normalizeText(message.content);

  if (
    client?.user &&
    message.mentions.has(client.user)
  ) {
    return true;
  }

  const botCallPatterns = [
    "يا بوت",
    "ي بوت",
    "ياالبوت",
    "يا البوت",
    "البوت",
    "بوت",
    "الو بوت",
    "الو يا بوت",
    "الو ي بوت",
    "هلا بوت",
    "هلا يا بوت",
    "هلا ي بوت",
    "مرحبا بوت",
    "مرحبا يا بوت",
    "السلام عليك يا بوت",
    "السلام عليكم يا بوت",
  ];

  return botCallPatterns.some((pattern) =>
    content.includes(
      normalizeText(pattern),
    ),
  );
}

function removeBotCall(text) {
  let result = normalizeText(text);

  const botCallPatterns = [
    "السلام عليكم يا بوت",
    "السلام عليك يا بوت",
    "الو يا بوت",
    "الو ي بوت",
    "هلا يا بوت",
    "هلا ي بوت",
    "مرحبا يا بوت",
    "مرحبا ي بوت",
    "يا بوت",
    "ي بوت",
    "يا البوت",
    "ياالبوت",
    "البوت",
    "بوت",
  ];

  for (const pattern of botCallPatterns) {
    result = result.replace(
      normalizeText(pattern),
      " ",
    );
  }

  return result
    .replace(/\s+/g, " ")
    .trim();
}

function keywordMatches(content, keyword) {
  if (!keyword) return false;

  const normalizedContent =
    normalizeText(content);

  const normalizedKeyword =
    normalizeText(keyword);

  if (!normalizedKeyword) return false;

  return normalizedContent.includes(
    normalizedKeyword,
  );
}

function botKeywordMatches(content, keyword) {
  if (!keyword) return false;

  const normalizedContent =
    normalizeText(content);

  const normalizedKeyword =
    normalizeText(keyword);

  if (!normalizedKeyword) return false;

  if (
    normalizedContent.includes(
      normalizedKeyword,
    )
  ) {
    return true;
  }

  const cleanContent =
    removeBotCall(normalizedContent);

  const cleanKeyword =
    removeBotCall(normalizedKeyword);

  if (
    cleanKeyword &&
    cleanContent.includes(cleanKeyword)
  ) {
    return true;
  }

  return false;
}

function chooseAnswer(answer) {
  if (Array.isArray(answer)) {
    const validAnswers = answer.filter(
      (item) =>
        typeof item === "string" &&
        item.trim(),
    );

    if (validAnswers.length === 0) {
      return null;
    }

    return validAnswers[
      Math.floor(
        Math.random() * validAnswers.length,
      )
    ];
  }

  if (
    typeof answer === "string" &&
    answer.trim()
  ) {
    return answer;
  }

  return null;
}

async function handleFaqReply(message, client) {
  const faqData = await getFaqs(
    message.guildId,
  );

  const faqs = Object.values(faqData ?? {});

  if (faqs.length === 0) {
    return;
  }

  const content = normalizeText(
    message.content,
  );

  if (!content) {
    return;
  }

  const botWasCalled = hasBotCall(
    message,
    client,
  );

  const botFaqs = faqs.filter(
    (faq) =>
      faq &&
      faq.mention_required === true,
  );

  const publicFaqs = faqs.filter(
    (faq) =>
      faq &&
      faq.mention_required !== true,
  );

  let matchedFaq = null;

  if (botWasCalled) {
    const matchingBotFaqs =
      botFaqs.filter((faq) =>
        botKeywordMatches(
          content,
          faq.keyword,
        ),
      );

    matchingBotFaqs.sort(
      (first, second) => {
        const firstLength =
          normalizeText(
            first.keyword,
          ).length;

        const secondLength =
          normalizeText(
            second.keyword,
          ).length;

        return secondLength - firstLength;
      },
    );

    matchedFaq =
      matchingBotFaqs[0] ?? null;
  }

  if (!matchedFaq) {
    const matchingPublicFaqs =
      publicFaqs.filter((faq) =>
        keywordMatches(
          content,
          faq.keyword,
        ),
      );

    matchingPublicFaqs.sort(
      (first, second) => {
        const firstLength =
          normalizeText(
            first.keyword,
          ).length;

        const secondLength =
          normalizeText(
            second.keyword,
          ).length;

        return secondLength - firstLength;
      },
    );

    matchedFaq =
      matchingPublicFaqs[0] ?? null;
  }

  if (!matchedFaq) {
    return;
  }

  const answer = chooseAnswer(
    matchedFaq.answer,
  );

  if (!answer) {
    return;
  }

  await message.reply(answer);
}

/* =========================
   XP SYSTEM
========================= */

async function awardXp(message) {
  const cooldownKey =
    `${message.guildId}_${message.author.id}`;

  const lastXpTime =
    xpCooldowns.get(cooldownKey) ?? 0;

  if (
    Date.now() - lastXpTime <= 60000
  ) {
    return;
  }

  xpCooldowns.set(
    cooldownKey,
    Date.now(),
  );

  const current =
    (await getLevel(
      message.guildId,
      message.author.id,
    )) || {
      xp: 0,
      level: 1,
    };

  const userData = {
    ...current,
    xp: Number(current.xp) || 0,
    level: Number(current.level) || 1,
  };

  if (userData.level >= 50) {
    return;
  }

  userData.xp +=
    Math.floor(Math.random() * 10) + 15;

  if (
    userData.xp >=
    userData.level * 100
  ) {
    userData.level += 1;
    userData.xp = 0;

    const levelChannel =
      await message.guild.channels
        .fetch(env.levelUpChannelId)
        .catch(() => null);

    if (levelChannel?.isTextBased()) {
      await levelChannel.send(
        `💎 **| ترقية جديدة!**\n` +
        `ارتقى العضو <@${message.author.id}> للمستوى **${userData.level}** ✨\n\n` +
        `⚔️~~~~~~~~~~~~~~~~~~~~~~~~~~~~⚔️\n` +
        `تشتعل الهمم وتصعد الأسماء نحو القمة في سماء المملكة.\n` +
        `أطلق من يتواجد عندنا.. وحياك الله ! 🦅🔥`,
      );
    }
  }

  await saveLevel(
    message.guildId,
    message.author.id,
    userData,
  );
}

/* =========================
   MESSAGE HANDLER
========================= */

export function createMessageHandler(client) {
  return async function handleMessage(message) {
    if (
      !message.guildId ||
      message.author.bot
    ) {
      return;
    }

    if (!rememberMessage(message.id)) {
      return;
    }

    try {
      if (await handleActivityKeyword(message)) {
        return;
      }

      const settings =
        await getSettings(
          message.guildId,
        );

      const isExempt =
        exemptChannelIds(
          settings.exempt_channels,
        ).includes(
          message.channelId,
        );

      /* =====================
         ANTI LINK & LOGS SYSTEM
      ===================== */

      if (
        settings.anti_link_enabled &&
        !isExempt &&
        containsLinkOrInvite(
          message.content,
        ) &&
        !message.member?.permissions.has(
          PermissionFlagsBits.ManageMessages,
        )
      ) {
        const user = message.author;
        const deletedContent = message.content;
        const channel = message.channel;
        const durationMinutes = 10;

        await message
          .delete()
          .catch(() => {});

        if (message.member?.moderatable) {
          await message.member
            .timeout(
              durationMinutes * 60 * 1000,
              "إرسال روابط غير مصرح بها",
            )
            .catch((err) =>
              console.error("فشل تطبيق الكتم:", err),
            );
        }

        const dmEmbed = {
          color: 0xff0000,
          title: "⚠️ تنبيه: تم اتخاذ إجراء إداري",
          description: `أهلاً ${user.username}، تم حذف رسالتك وكتمك مؤقتاً في سيرفر **${message.guild.name}**.`,
          fields: [
            { name: "السبب", value: "إرسال روابط خارجية غير مصرح بها" },
            { name: "مدة الكتم", value: `${durationMinutes} دقائق` },
            { name: "القناة", value: `<#${channel.id}>` },
          ],
          footer: {
            text: "إذا كان هناك خطأ، يمكنك التواصل مع الإدارة عبر قناة الدعم الفني.",
          },
        };

        await user.send({ embeds: [dmEmbed] }).catch(() => {
          channel
            .send(
              `⚠️ <@${user.id}> تم حذف رسالتك وكتمك لمدة ${durationMinutes} دقائق بسبب إرسال روابط.`,
            )
            .then((msg) =>
              setTimeout(() => msg.delete().catch(() => {}), 5000),
            )
            .catch(() => {});
        });

        const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
        const logChannel =
          message.guild.channels.cache.get(logChannelId) ||
          message.guild.channels.cache.find(
            (c) => c.name === "mod-logs",
          );

        if (logChannel) {
          const logEmbed = {
            color: 0xff9900,
            title: "🚨 سجل عقوبة تلقائية (AutoMod)",
            fields: [
              {
                name: "المخالف",
                value: `${user.tag} (\`${user.id}\`)`,
                inline: true,
              },
              {
                name: "الإجراء",
                value: `حذف رسالة + كتم (${durationMinutes}m)`,
                inline: true,
              },
              {
                name: "القناة",
                value: `<#${channel.id}>`,
                inline: true,
              },
              {
                name: "محتوى الرسالة المحذوفة",
                value: `\`\`\`${deletedContent.slice(0, 1000)}\`\`\``,
              },
            ],
            timestamp: new Date().toISOString(),
          };

          await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }

        return;
      }

      /* =====================
         FORBIDDEN WORDS
      ===================== */

      if (
        await handleForbiddenWords(
          message,
        )
      ) {
        return;
      }

      /* =====================
         LEADERBOARD
      ===================== */

      const trimmedContent =
        message.content.trim();

      if (
        trimmedContent === "ترتيب اللفل" ||
        trimmedContent === "ترتيب المستوى" ||
        trimmedContent === "ترتيب المستويات" ||
        trimmedContent === "التوب"
      ) {
        await handleLeaderboard(message);
        return;
      }

      /* =====================
         LEVEL QUESTION
      ===================== */

      if (
        isLevelQuestion(
          message.content,
        )
      ) {
        await handleLevelQuestion(
          message,
        );

        return;
      }

      /* =====================
         AI MENTION
      ===================== */

      if (
        settings.ai_enabled &&
        (await handleAiMention(
          message,
          client,
        ))
      ) {
        return;
      }

      /* =====================
         AUTO SALAM
      ===================== */

      if (
        settings.auto_salam_enabled &&
        settings.general_channel ===
          message.channelId &&
        isSalam(message.content)
      ) {
        const lastReply =
          salamCooldowns.get(
            message.guildId,
          ) ?? 0;

        if (
          Date.now() - lastReply >=
          30000
        ) {
          salamCooldowns.set(
            message.guildId,
            Date.now(),
          );

          await message.reply(
            messages.salamReply,
          );
        }
      }

      /* =====================
         FAQ / SMART REPLIES
      ===================== */

      if (
        settings.faq_enabled &&
        message.content.trim()
      ) {
        await handleFaqReply(
          message,
          client,
        );
      }

      /* =====================
         XP
      ===================== */

      await awardXp(message);
    } catch (error) {
      console.error(
        "Message handling failed.",
        error,
      );
    }
  };
}

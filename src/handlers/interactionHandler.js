import {
  getSettings,
  saveBanWord,
  saveFaq,
  deleteBanWord,
  deleteFaq,
  saveSettings,
  getUserActivity, // <-- استيراد دالة جلب النشاط من فايربيس
} from "../services/firebaseStore.js";

import { env } from "../config/env.js";
import { normalizeKeyword } from "../utils/text.js";
import { requireOwner } from "../utils/owner.js";
import { replyEphemeral } from "../utils/discord.js";
import { messages } from "../constants/messages.js";

import { handleTicketInteraction } from "./ticketHandler.js";
import { execute as executeTicketPanel } from "../commands/ticket.js";
import { handleWelcome } from "./welcomeHandler.js";
import { execute as executeTestBoost } from "../commands/testboost.js";

// استيراد معالج الممالك والشخصيات بالدالتين معاً (إرسال اللوحة ومعالجة الاختيار)
import { handleKingdomPanel, handleKingdomInteraction } from "./kingdomsHandler.js";

// استيراد قاعدة بيانات Realtime Database الخاصة بـ Firebase
import { db } from "../config/firebase.js";

// استيراد دالة توليد بطاقة النشاط كصورة
import { generateActivityCard } from "../utils/generateActivityCard.js";

import {
  EmbedBuilder,
  MessageFlags,
  AttachmentBuilder,
} from "discord.js";

// ============================================================
// معرف قناة سجل الأعضاء المخصص (إلزامي للأوامر)
// ============================================================
const TARGET_LOG_CHANNEL_ID = "1549377399731396658";


// ============================================================
// أوامر المالك فقط (تمت إضافة kingdoms و test-boost للقائمة)
// ============================================================

const ownerCommands = new Set([
  "settings",
  "exempt-channel",
  "faq",
  "banword",
  "rules",
  "test-welcome",
  "test-boost",
  "kingdoms", // <-- خاص بالإدارة
]);


// ============================================================
// حالة الإعدادات
// ============================================================

const enabledText = (enabled, onText, offText) =>
  enabled ? `🟢 ${onText}` : `🔴 ${offText}`;


// ============================================================
// Settings
// ============================================================

async function handleSettings(interaction, settings) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "show") {
    const general = settings.general_channel
      ? `<#${settings.general_channel}>`
      : "غير محددة";

    await interaction.reply(
      [
        "👑 **إعدادات 3RB Bot**",
        "",
        `🔗 حماية الروابط: ${enabledText(
          settings.anti_link_enabled,
          "مفعلة",
          "متوقفة",
        )}`,
        `👋 رد السلام: ${enabledText(
          settings.auto_salam_enabled,
          "مفعل",
          "متوقف",
        )}`,
        `❓ FAQ: ${enabledText(
          settings.faq_enabled,
          "مفعل",
          "متوقف",
        )}`,
        `🧠 AI: ${enabledText(
          settings.ai_enabled,
          "مفعل",
          "متوقف",
        )}`,
        `⏰ الرسائل التلقائية: ${enabledText(
          settings.hourly_enabled,
          "مفعل",
          "متوقف",
        )}`,
        `💬 الشات العام: ${general}`,
        "",
        `👑 المالك: <@${env.ownerId}>`,
      ].join("\n"),
    );

    return;
  }

  const guildId = interaction.guildId;

  if (
    [
      "anti-links",
      "auto-salam",
      "faq",
      "ai",
      "hourly",
    ].includes(subcommand)
  ) {
    const enabled = interaction.options.getBoolean(
      "enabled",
      true,
    );

    const settingBySubcommand = {
      "anti-links": "anti_link_enabled",
      "auto-salam": "auto_salam_enabled",
      faq: "faq_enabled",
      ai: "ai_enabled",
      hourly: "hourly_enabled",
    };

    const settingName =
      settingBySubcommand[subcommand];

    settings[settingName] = enabled ? 1 : 0;

    await saveSettings(
      guildId,
      settings,
    );

    const replies = {
      "anti-links": enabled
        ? "🛡️ تم تشغيل حماية الروابط."
        : "🛡️ تم إيقاف حماية الروابط.",

      "auto-salam": enabled
        ? "👋 تم تشغيل رد السلام."
        : "👋 تم إيقاف رد السلام.",

      faq: enabled
        ? "❓ تم تشغيل FAQ."
        : "❓ تم إيقاف FAQ.",

      ai: enabled
        ? "🧠 تم تشغيل الذكاء الاصطناعي."
        : "🧠 تم إيقاف الذكاء الاصطناعي.",

      hourly: enabled
        ? "⏰ تم تشغيل الرسائل التلقائية."
        : "⏰ تم إيقاف الرسائل التلقائية.",
    };

    await interaction.reply(
      replies[subcommand],
    );

    return;
  }

  if (subcommand === "general") {
    const channel =
      interaction.options.getChannel(
        "channel",
        true,
      );

    settings.general_channel =
      channel.id;

    await saveSettings(
      guildId,
      settings,
    );

    await interaction.reply(
      `💬 تم تحديد <#${channel.id}> كقناة الشات العام.`,
    );
  }
}


// ============================================================
// Exempt Channel
// ============================================================

async function handleExemptChannel(
  interaction,
  settings,
) {
  const channel =
    interaction.options.getChannel(
      "channel",
      true,
    );

  const channels = (
    settings.exempt_channels ?? ""
  )
    .split(",")
    .map((channelId) =>
      channelId.trim(),
    )
    .filter(Boolean);

  if (!channels.includes(channel.id)) {
    channels.push(channel.id);
  }

  settings.exempt_channels =
    channels.join(",");

  await saveSettings(
    interaction.guildId,
    settings,
  );

  await interaction.reply(
    `🛡️ تم استثناء <#${channel.id}> من حماية الروابط.`,
  );
}


// ============================================================
// FAQ
// ============================================================

async function handleFaq(interaction) {
  const subcommand =
    interaction.options.getSubcommand();

  const keyword =
    interaction.options
      .getString("keyword", true)
      .trim();

  const key =
    normalizeKeyword(keyword);

  if (subcommand === "add") {
    const answer =
      interaction.options
        .getString("answer", true)
        .trim();

    await saveFaq(
      interaction.guildId,
      key,
      {
        keyword,
        answer,
      },
    );

    await interaction.reply(
      `✅ تم حفظ الرد للكلمة **${keyword}**.`,
    );

    return;
  }

  if (subcommand === "delete") {
    await deleteFaq(
      interaction.guildId,
      key,
    );

    await interaction.reply(
      `🗑️ تم حذف الرد للكلمة **${keyword}**.`,
    );
  }
}


// ============================================================
// Ban Word
// ============================================================

async function handleBanWord(
  interaction,
) {
  const subcommand =
    interaction.options.getSubcommand();

  const keyword =
    interaction.options
      .getString("keyword", true)
      .trim();

  const key =
    normalizeKeyword(keyword);

  if (subcommand === "add") {
    const duration =
      interaction.options.getInteger(
        "duration",
        true,
      );

    await saveBanWord(
      interaction.guildId,
      key,
      {
        keyword,
        duration,
      },
    );

    await interaction.reply(
      `🔇 تم إضافة **${keyword}** إلى الكلمات الممنوحة.\n⏱️ مدة الكتم: **${duration} دقيقة**.`,
    );

    return;
  }

  if (subcommand === "delete") {
    await deleteBanWord(
      interaction.guildId,
      key,
    );

    await interaction.reply(
      `✅ تم حذف **${keyword}** من الكلمات الممنوحة.`,
    );
  }
}


// ============================================================
// Rules
// ============================================================

async function handleRules(interaction) {
  try {
    const requestedChannel = interaction.options.getChannel("channel");
    const configuredChannelId = env.rulesChannelId;
    let channel = null;

    if (requestedChannel) {
      channel = requestedChannel;
    }

    if (!channel && configuredChannelId) {
      channel = await interaction.guild.channels
        .fetch(configuredChannelId)
        .catch(() => null);
    }

    if (!channel) {
      channel = interaction.guild.channels.cache.find(
        (item) => item.isTextBased() && item.name === "القوانين"
      );
    }

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        content: "❌ لم أجد قناة القوانين.\n\nاستخدم:\n`/rules channel:#القوانين`",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const rulesImageUrl = "https://cdn.discordapp.com/attachments/1541941746513088562/1544472149505609728/Use_AI_Image_Sep_2_2026_00_59_09.jpg?ex=6a98a147&is=6a974fc7&hm=362f93d0d7cb00457542afffc61285c680017a0fe64b5ba1e4fef0225401fd09&";

    await channel.send({
      content: rulesImageUrl,
    });

    await interaction.reply({
      content: `✅ تم إرسال قوانين السيرفر بنجاح في <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error("Rules command failed.", error);

    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ حدث خطأ أثناء إرسال القوانين.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}


// ============================================================
// Test Welcome
// ============================================================

async function handleTestWelcome(interaction) {
  await interaction.reply({
    content: "جاري توليد وعرض معاينة الترحيب...",
    flags: MessageFlags.Ephemeral,
  });

  try {
    await handleWelcome(interaction.member);
     
    await interaction.editReply({
      content: "✅ تم إرسال معاينة الترحيب بنجاح إلى روم الترحيب المحدد!",
    });
  } catch (error) {
    console.error("Test welcome command failed:", error);
    await interaction.editReply({
      content: "❌ حدث خطأ أثناء محاولة توليد الترحيب.",
    });
  }
}


// ============================================================
// Main Interaction Handler
// ============================================================

export async function handleInteraction(
  interaction,
) {
  if (!interaction.guildId) return;

  try {
    // ========================================================
    // 1. أزرار وقوائم التذاكر والممالك
    // ========================================================

    if (
      interaction.isButton() ||
      interaction.isStringSelectMenu()
    ) {
      if (
        interaction.customId === 'select_kingdom' || 
        interaction.customId === 'select_character' ||
        interaction.customId.startsWith('kingdom_')
      ) {
        await handleKingdomInteraction(interaction);
        return;
      }

      await handleTicketInteraction(
        interaction,
      );

      return;
    }

    // ========================================================
    // 2. أوامر Slash فقط
    // ========================================================

    if (
      !interaction.isChatInputCommand()
    ) {
      return;
    }

    // ========================================================
    // 🛑 2.1 شرط حصر أوامر السجل والنشاط في قناة سجل الأعضاء حصراً
    // ========================================================
    if (interaction.commandName === "activity") {
      if (interaction.channelId !== TARGET_LOG_CHANNEL_ID) {
        return interaction.reply({
          content: `❌ عذراً يا بطل، أوامر السجل والنشاط مخصصة للاستخدام حصراً داخل قناة: <#${TARGET_LOG_CHANNEL_ID}>`,
          flags: MessageFlags.Ephemeral, // رد خفي يظهر للمستخدم فقط ولا يزعج الشات
        });
      }
    }

    // ========================================================
    // 3. إرسال لوحة التذاكر
    // ========================================================

    if (
      interaction.commandName ===
      "send-ticket-panel"
    ) {
      await executeTicketPanel(
        interaction,
      );

      return;
    }

    // ========================================================
    // 3.5. إرسال لوحة الممالك والشخصيات
    // ========================================================

    if (
      interaction.commandName ===
      "kingdoms"
    ) {
      await handleKingdomPanel(interaction);
      return;
    }

    // ========================================================
    // 4. لوحة الأوامر والروابط
    // ========================================================

    if (
      interaction.commandName ===
      "command-panel"
    ) {
      const embed =
        new EmbedBuilder()
          .setColor("#b8860b")
          .setTitle(
            "📌 ⦙ لوحة الأوامر والروابط",
          )
          .setDescription(
            "اكتب أي **كلمة** من القائمة في الشات، وسيقوم البوت بالرد عليك فوراً بالمعلومات المطلوبة!",
          )
          .addFields(
            {
              name:
                "🎫 ⦙ الدعم والتذاكر:",
              value: [
                "> `تيكت` — لفتح تذكرة دعم فني أو استفسار",
                "> `مساعدة` — لمعرفة طريقة طلب الدعم",
                "> `قوانين` — للتعرف على قوانين السيرفر",
              ].join("\n"),
            },
            {
              name:
                "🔗 ⦙ روابطنا:",
              value: [
                "> `رابط` — الحصول على رابط دعوة السيرفر الدائم",
                "> `دعم` — حسابات التواصل والدعم المباشر",
              ].join("\n"),
            },
            {
              name:
                "👑 ⦙ الإدارة:",
              value: [
                "> `تقديم` — لمعرفة شروط الانضمام لفريق الإدارة",
              ].join("\n"),
            },
          )
          .setFooter({
            text:
              "✨ 3RB Community — جميع الحقوق محفوظة",
          });

      await interaction.channel.send({
        embeds: [embed],
      });

      await interaction.reply({
        content:
          "✅ تم إرسال لوحة الأوامر بنجاح!",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    // ========================================================
    // 5. Ping
    // ========================================================

    if (
      interaction.commandName ===
      "ping"
    ) {
      await interaction.reply(
        "🏓 Pong!",
      );

      return;
    }

    // ========================================================
    // 5.1. أمر تتبع النشاط وعراقة الأعضاء (/activity)
    // ========================================================

    if (interaction.commandName === "activity") {
      const targetUser = interaction.options.getUser("user") || interaction.user;
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!member) {
        await interaction.reply({
          content: "❌ لم يتم العثور على هذا العضو في السيرفر.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.deferReply();

      const activityData = await getUserActivity(interaction.guild.id, targetUser.id);
      const joinedTimestamp = member.joinedTimestamp;
      const daysInServer = joinedTimestamp ? Math.floor((Date.now() - joinedTimestamp) / (1000 * 60 * 60 * 24)) : 0;

      const buffer = await generateActivityCard({
        avatarURL: targetUser.displayAvatarURL({ extension: "png", size: 256 }),
        title: `تقرير نشاط العضو: ${targetUser.username}`,
        joinDate: joinedTimestamp
          ? new Date(joinedTimestamp).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "غير معروف",
        daysActive: `منذ ${daysInServer} يوماً`,
        requestedBy: interaction.user.tag,
        timestamp: new Date().toLocaleString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        activity: activityData,
      });

      const attachment = new AttachmentBuilder(buffer, { name: "activity.png" });

      await interaction.editReply({ files: [attachment] });
      return;
    }

    // ========================================================
    // 5.5. أمر قائمة متصدرين الدعوات
    // ========================================================

    if (
      interaction.commandName ===
      "invites"
    ) {
      try {
        const invitesRef = db.ref("invites");
        const snapshot = await invitesRef.once("value");
        const data = snapshot.val();

        if (!data) {
          await interaction.reply({
            content: "📊 لا توجد أي سجلات دعوات مسجلة حتى الآن في السيرفر.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const sortedInviters = Object.entries(data)
          .map(([userId, userInfo]) => ({
            userId,
            count: userInfo.invitedCount || 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        const medals = ["🥇", "🥈", "🥉"];
         
        const descriptionList = sortedInviters.map((item, index) => {
          const medal = medals[index] || "🔹";
          return `${medal} **المركز ${index + 1}:** <@${item.userId}> — **${item.count}** دعوة`;
        });

        const embed = new EmbedBuilder()
          .setColor("#b8860b")
          .setTitle("🏆 ⦙ قائمة أكثر الأعضاء دعوة للأشخاص")
          .setDescription(
            descriptionList.length > 0
              ? descriptionList.join("\n\n")
              : "لا يوجد أعضاء في القائمة بعد."
          )
          .setFooter({
            text: "✨ 3RB Community — نظام الدعوات",
          })
          .setTimestamp();

        await interaction.reply({
          embeds: [embed],
        });
      } catch (error) {
        console.error("خطأ أثناء جلب قائمة المتصدرين للدعوات:", error);
        await interaction.reply({
          content: "حدث خطأ أثناء محاولة جلب قائمة الدعوات، يرجى المحاولة لاحقاً.",
          flags: MessageFlags.Ephemeral,
        });
      }

      return;
    }

    // ========================================================
    // 6. التحقق من أن الأمر للمالك
    // ========================================================

    if (
      ownerCommands.has(
        interaction.commandName,
      ) &&
      !(await requireOwner(
        interaction,
      ))
    ) {
      return;
    }

    // ========================================================
    // 7. أمر القوانين
    // ========================================================

    if (
      interaction.commandName ===
      "rules"
    ) {
      await handleRules(
        interaction,
      );

      return;
    }

    // ========================================================
    // 8. أمر تجربة الترحيب
    // ========================================================

    if (
      interaction.commandName ===
      "test-welcome"
    ) {
      await handleTestWelcome(
        interaction,
      );

      return;
    }

    // ========================================================
    // 8. أمر تجربة البوست
    // ========================================================

    if (
      interaction.commandName ===
      "test-boost"
    ) {
      await executeTestBoost(
        interaction,
      );

      return;
    }

    // ========================================================
    // 9. جلب إعدادات السيرفر
    // ========================================================

    const settings =
      await getSettings(
        interaction.guildId,
      );

    // ========================================================
    // 10. معالجة بقية الأوامر
    // ========================================================

    switch (
      interaction.commandName
    ) {
      case "settings":
        await handleSettings(
          interaction,
          settings,
        );
        break;

      case "exempt-channel":
        await handleExemptChannel(
          interaction,
          settings,
        );
        break;

      case "faq":
        await handleFaq(
          interaction,
        );
        break;

      case "banword":
        await handleBanWord(
          interaction,
        );
        break;

      default:
        break;
    }
  } catch (error) {
    console.error(
      "Interaction handling failed.",
      error,
    );

    await replyEphemeral(
      interaction,
      messages.interactionError,
    );
  }
}

import { MessageFlags, AttachmentBuilder } from "discord.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { db } from "../config/firebase.js"; // استيراد قاعدة البيانات

const WIDTH = 1376;
const HEIGHT = 768;

const ASSETS_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../assets",
);

const BACKGROUND_PATH = path.join(
  ASSETS_DIRECTORY,
  "welcome-bg.png",
);

async function loadImageBuffer(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `فشل تحميل الصورة: ${response.status}`,
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer(),
  );

  if (!buffer.length) {
    throw new Error("الصورة فارغة.");
  }

  return loadImage(buffer);
}

function drawCoverImage(context, image) {
  const scale = Math.max(
    WIDTH / image.width,
    HEIGHT / image.height,
  );

  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;

  const x = (WIDTH - imageWidth) / 2;
  const y = (HEIGHT - imageHeight) / 2;

  context.drawImage(
    image,
    x,
    y,
    imageWidth,
    imageHeight,
  );
}

async function createTestBoostImage(member) {
  const canvas = createCanvas(
    WIDTH,
    HEIGHT,
  );

  const context = canvas.getContext("2d");

  // رسم صورة البوستر المحلية
  const background = await loadImage(
    await readFile(BACKGROUND_PATH),
  );

  drawCoverImage(
    context,
    background,
  );

  // تحميل صورة العضو من Discord
  const avatarUrl =
    member.user.displayAvatarURL({
      extension: "png",
      size: 512,
      forceStatic: true,
    });

  const avatar =
    await loadImageBuffer(avatarUrl);

  // مقاسات ومكان صورة العضو داخل الدائرة
  const centerX = 976;
  const centerY = 304;
  const radius = 112;

  context.save();

  context.beginPath();
  context.arc(
    centerX,
    centerY,
    radius,
    0,
    Math.PI * 2,
  );

  context.closePath();
  context.clip();

  context.drawImage(
    avatar,
    centerX - radius,
    centerY - radius,
    radius * 2,
    radius * 2,
  );

  context.restore();

  // كتابة اسم العضو داخل المستطيل
  const memberName =
    member.user.username;

  context.fillStyle = "#FFFFFF";
  context.font = "bold 38px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.shadowColor =
    "rgba(0, 0, 0, 0.85)";

  context.shadowBlur = 8;

  context.fillText(
    memberName,
    976,
    548,
  );

  context.shadowColor = "transparent";
  context.shadowBlur = 0;

  return canvas.toBuffer("image/png");
}

export async function execute(interaction) {
  await interaction.reply({
    content: "⏳ جاري توليد وعرض معاينة البوستر وحفظ البيانات...",
    flags: MessageFlags.Ephemeral,
  });

  try {
    // حفظ بيانات الداعم في Firebase فور تنفيذ الأمر أو التجربة
    const boosterRef = db.ref(`boosters/${interaction.user.id}`);
    await boosterRef.set({
      userId: interaction.user.id,
      username: interaction.user.username,
      boostTime: Date.now(),
      totalBoosts: interaction.guild.premiumSubscriptionCount,
      isTest: true // علامة توضح أن هذا السجل تم عبر التجربة
    });

    const channelId =
      process.env.BOOST_CHANNEL_ID;

    const channel = channelId
      ? interaction.guild.channels.cache.get(
          channelId,
        ) || interaction.channel
      : interaction.channel;

    const imageBuffer =
      await createTestBoostImage(
        interaction.member,
      );

    const attachment =
      new AttachmentBuilder(
        imageBuffer,
        {
          name: "3rb-boost.png",
        },
      );

    const messageContent = [
      `💎 أهلاً بنجم السيرفر وفخرنا <@${interaction.user.id}>! شكراً من القلب لدعمك المستمر.`,
      `W E L C O M E   T O   3 R B`,
      ``,
      `🚀 بفضل بوستك الغالي، مجتمع 3RB أصبح أقوى وأجمل، ودعمك يفرق معنا كثيراً ❤️`,
      ``,
      `📌 إجمالي بوستات السيرفر الآن: **${interaction.guild.premiumSubscriptionCount}**`,
      ``,
      `🌟 انضممت رسمياً إلى قائمة الداعمين المميزين في 3RB، ونحن نقدر ثقتك الكبيرة.`,
      ``,
      `✨ استمتع بمزاياك الخاصة، منور يا بطل!`,
    ].join("\n");

    if (
      channel &&
      channel.id !== interaction.channelId
    ) {
      await channel.send({
        content: messageContent,
        files: [attachment],
      });

      await interaction.editReply({
        content:
          "✅ تم إرسال البوستر وحفظ بيانات الداعم في قاعدة البيانات بنجاح!",
      });
    } else {
      await interaction.editReply({
        content: messageContent,
        files: [attachment],
      });
    }
  } catch (error) {
    console.error(
      "Test boost command failed:",
      error,
    );

    await interaction.editReply({
      content: `❌ حدث خطأ أثناء محاولة توليد البوستر: \`${error.message}\``,
    });
  }
}

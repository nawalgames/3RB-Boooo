import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AttachmentBuilder } from "discord.js";
import {
  createCanvas,
  loadImage,
} from "@napi-rs/canvas";
import { db } from "../config/firebase.js";

const WIDTH = 1376;
const HEIGHT = 768;

const WELCOME_CHANNEL_ID =
  "1530892777884225688";

const ASSETS_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../assets",
);

const BACKGROUND_PATH = path.join(
  ASSETS_DIRECTORY,
  "welcome-bg.png",
);

// مقاسات صورة العضو داخل الدائرة.
const AVATAR_CENTER_X = 976;
const AVATAR_CENTER_Y = 304;
const AVATAR_RADIUS = 112;

// مكان اسم العضو داخل المستطيل.
const NAME_CENTER_X = 976;
const NAME_CENTER_Y = 548;

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

function drawMemberName(context, memberName) {
  context.save();

  context.fillStyle = "#FFFFFF";
  context.font = "bold 38px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.shadowColor =
    "rgba(0, 0, 0, 0.85)";

  context.shadowBlur = 8;

  context.fillText(
    memberName,
    NAME_CENTER_X,
    NAME_CENTER_Y,
  );

  context.restore();
}

function drawMemberAvatar(
  context,
  avatar,
  centerX,
  centerY,
  radius,
) {
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
}

async function createWelcomeImage(member) {
  const canvas = createCanvas(
    WIDTH,
    HEIGHT,
  );

  const context = canvas.getContext("2d");

  const background = await loadImage(
    await readFile(BACKGROUND_PATH),
  );

  drawCoverImage(
    context,
    background,
  );

  const memberName =
    member.user.username;

  drawMemberName(
    context,
    memberName,
  );

  const avatarUrl =
    member.user.displayAvatarURL({
      extension: "png",
      size: 512,
      forceStatic: true,
    });

  const avatar =
    await loadImageBuffer(avatarUrl);

  drawMemberAvatar(
    context,
    avatar,
    AVATAR_CENTER_X,
    AVATAR_CENTER_Y,
    AVATAR_RADIUS,
  );

  return canvas.toBuffer("image/png");
}

function createWelcomeText(member, inviter) {
  const memberCount =
    member.guild.memberCount;

  const inviterText = inviter
    ? `🤝 تمت دعوتك بواسطة: <@${inviter.id}>`
    : "🔗 الداعي: غير معروف أو تم الدخول عبر رابط مخصص.";

  return [
    "✨ أهلًا وسهلًا بك في مجتمع [3RB] ✨",
    "",
    `${member} | ${inviterText}`,
    "",
    `🇸🇦 حيّ الله ${member}، نورتنا وشرفت [3RB]`,
    "",
    `أنت الآن العضو رقم ${memberCount}، وانضمامك أضاف لنا شخص جديد من أهل الدار. ❤️`,
    "",
    "عشان تبدأ صح وتعرف كل اللي لك واللي عليك، مرّ على الأقسام التالية بالترتيب:",
    "",
    "1️⃣ القوانين: <#1536609124538785885>",
    "(خذ لك دقيقة واقرأ القوانين، وخل دخولك من البداية على السليم)",
    "",
    "2️⃣ السوالف: <#1530892777884225693>",
    "(مكان الربع، التعارف، الضحك، والنقاشات اليومية)",
    "",
    "3️⃣ الدعم الفني: <#1543388837202501702>",
    "(إذا احتجت الإدارة أو واجهتك مشكلة، افتح تذكرة والإدارة ما تقصر معك)",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "🔥 [3RB] يجمعنا، والوناسة تكمل بوجودكم.",
    "",
    `نورت المكان يا ${member} ❤️`,
    "",
    "نتمنى لك تجربة ممتعة، ووقت أسعد بين ربعك.",
    "",
    "━━━━━━━━━━━━━━━━━━",
  ].join("\n");
}

export async function handleWelcome(
  member,
  inviter = null,
) {
  console.log(
    `[3RB] عضو جديد: ${member.user.tag}`,
  );

  try {
    const welcomeRef = db.ref(`welcomes/${member.guild.id}/${member.id}`);
    await welcomeRef.set({
      userId: member.id,
      username: member.user.username,
      joinedAt: Date.now(),
      inviterId: inviter ? inviter.id : null
    });
  } catch (dbError) {
    console.error('Error saving welcome member to Firebase:', dbError);
  }

  const channel =
    member.guild.channels.cache.get(
      WELCOME_CHANNEL_ID,
    );

  if (!channel) {
    console.error(
      `[3RB] لم يتم العثور على روم الترحيب: ${WELCOME_CHANNEL_ID}`,
    );

    return;
  }

  try {
    const imageBuffer =
      await createWelcomeImage(member);

    const attachment =
      new AttachmentBuilder(
        imageBuffer,
        {
          name: "3rb-welcome.png",
        },
      );

    await channel.send({
      files: [attachment],
    });

    await channel.send({
      content: createWelcomeText(
        member,
        inviter,
      ),
    });

    console.log(
      `[3RB] تم إرسال الصورة والترحيب بنجاح للعضو ${member.user.tag}`,
    );
  } catch (error) {
    console.error(
      "[3RB] خطأ في إنشاء أو إرسال صورة الترحيب:",
      error,
    );

    await channel.send({
      content: createWelcomeText(
        member,
        inviter,
      ),
    });
  }
}

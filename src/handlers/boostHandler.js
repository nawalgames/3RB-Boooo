import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { db } from "../config/firebase.js"; // استيراد اتصال قاعدة البيانات بنفس طريقة مشروعك
import { ref, set } from "firebase/database";

const BOOST_CHANNEL_ID = process.env.BOOST_CHANNEL_ID;
const WIDTH = 1200;
const HEIGHT = 675;
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
    throw new Error(`فشل تحميل الصورة: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) {
    throw new Error("الصورة فارغة.");
  }
  return loadImage(buffer);
}

function drawCoverImage(context, image) {
  const scale = Math.max(WIDTH / image.width, HEIGHT / image.height);
  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;
  const x = (WIDTH - imageWidth) / 2;
  const y = (HEIGHT - imageHeight) / 2;
  context.drawImage(image, x, y, imageWidth, imageHeight);
}

function coverTextArea(context, memberName) {
  const gradient = context.createLinearGradient(625, 330, 1155, 555);
  gradient.addColorStop(0, "#090807");
  gradient.addColorStop(0.45, "#1c1005");
  gradient.addColorStop(1, "#030303");
  context.fillStyle = gradient;
  context.beginPath();
  context.roundRect(610, 325, 550, 225, 28);
  context.fill();
  context.strokeStyle = "rgba(218, 150, 25, 0.85)";
  context.lineWidth = 3;
  context.beginPath();
  context.roundRect(610, 325, 550, 225, 28);
  context.stroke();

  context.fillStyle = "#d99620";
  context.font = "bold 38px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(memberName, 610 + 550 / 2, 325 + 225 / 2);
}

function drawMemberAvatar(context, avatar, centerX, centerY, radius) {
  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.closePath();
  context.clip();
  context.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
  context.restore();

  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.strokeStyle = "#d99620";
  context.lineWidth = 9;
  context.stroke();

  context.beginPath();
  context.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255, 255, 255, 0.95)";
  context.lineWidth = 2;
  context.stroke();
}

async function generateBoostImage(member) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const context = canvas.getContext("2d");

  try {
    const background = await loadImage(await readFile(BACKGROUND_PATH));
    drawCoverImage(context, background);

    const memberName = member.user.username;
    coverTextArea(context, memberName);

    const avatarUrl = member.user.displayAvatarURL({
      extension: "png",
      size: 512,
      forceStatic: true,
    });
    const avatar = await loadImageBuffer(avatarUrl);
    
    drawMemberAvatar(context, avatar, 823, 197, 126);

  } catch (error) {
    console.error('Error generating boost image:', error);
    return null;
  }

  return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: '3rb-boost.png' });
}

export default (bot) => {
    bot.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (oldMember.premiumSince === null && newMember.premiumSince !== null) {
            
            // حفظ بيانات الداعم في قاعدة بيانات Firebase تحت فرع boosters
            try {
                const boosterRef = ref(db, `boosters/${newMember.id}`);
                await set(boosterRef, {
                    userId: newMember.id,
                    username: newMember.user.username,
                    boostTime: Date.now(),
                    totalBoosts: newMember.guild.premiumSubscriptionCount
                });
            } catch (dbError) {
                console.error('Error saving booster to Firebase:', dbError);
            }

            const channel = bot.channels.cache.get(BOOST_CHANNEL_ID);
            if (channel) {
                try {
                    const attachment = await generateBoostImage(newMember);
                    
                    const messageContent = [
                      `💎 أهلاً بنجم السيرفر وفخرنا <@${newMember.id}>! شكراً من القلب لدعمك المستمر.`,
                      `W E L C O M E   T O   3 R B`,
                      ``,
                      `🚀 بفضل بوستك الغالي، مجتمع 3RB أصبح أقوى وأجمل، ودعمك يفرق معنا كثيراً ❤️`,
                      ``,
                      `📌 إجمالي بوستات السيرفر الآن: **${newMember.guild.premiumSubscriptionCount}**`,
                      ``,
                      `🌟 انضممت رسمياً إلى قائمة الداعمين المميزين في 3RB، ونحن نقدر ثقتك الكبيرة.`,
                      ``,
                      `✨ استمتع بمزاياك الخاصة، منور يا بطل!`
                    ].join("\n");

                    if (attachment) {
                        await channel.send({ 
                            content: messageContent, 
                            files: [attachment] 
                        });
                    } else {
                        await channel.send(messageContent);
                    }
                } catch (error) {
                    console.error('Error sending boost message:', error);
                }
            }
        }
    });
};

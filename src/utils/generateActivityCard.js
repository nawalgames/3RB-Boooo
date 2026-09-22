import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import path from "path";

try {
  GlobalFonts.registerFromPath(
    path.join(process.cwd(), "src", "assets", "NotoSansArabic-Regular.ttf"),
    "NotoSans"
  );
  GlobalFonts.registerFromPath(
    path.join(process.cwd(), "src", "assets", "NotoSansArabic-Bold.ttf"),
    "NotoSansBold"
  );
} catch (e) {
  console.error("Failed to load custom fonts:", e);
}

const W = 640;
const H = 1000; // تم زيادة الطول قليلاً لاستيعاب الصورة والشعار

const COLORS = {
  bg: "#141420",
  card: "#1a1a29",
  pill: "#232332",
  pillAlt: "#3a3a52",
  textDim: "#8a8ab0",
  join: { bg: "rgba(83,74,183,0.18)", icon: "#a89ff0" },
  chat: { bg: "rgba(29,158,117,0.18)", icon: "#5dcaa5" },
  voice: { bg: "rgba(216,90,48,0.18)", icon: "#f0997b" },
  mute: { bg: "rgba(212,83,126,0.18)", icon: "#ed93b1" },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function sectionHeader(ctx, x, y, w, title, colorSet) {
  const size = 34;
  roundRect(ctx, x + w - size, y, size, size, 9);
  ctx.fillStyle = colorSet.bg;
  ctx.fill();

  ctx.fillStyle = colorSet.icon;
  ctx.font = "bold 32px NotoSans";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("•", x + w - size / 2, y + size / 2 - 2);

  ctx.fillStyle = "#e8e8f0";
  ctx.font = "bold 26px NotoSans";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(title, x + w - size - 12, y + size / 2);
}

function fieldRow(ctx, x, y, w, label, value) {
  const h = 40;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = COLORS.pill;
  ctx.fill();

  ctx.font = "22px NotoSans";
  ctx.textBaseline = "middle";

  ctx.fillStyle = COLORS.textDim;
  ctx.textAlign = "right";
  ctx.fillText(label, x + w - 16, y + h / 2);

  ctx.fillStyle = "#e8e8f0";
  ctx.textAlign = "left";
  ctx.font = "bold 22px NotoSans";
  ctx.fillText(String(value), x + 16, y + h / 2);

  return y + h + 10;
}

function formatVoiceTime(totalMinutes = 0) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} ساعة و ${minutes} دقيقة`;
  return `${minutes} دقيقة`;
}

export async function generateActivityCard({
  avatarURL,
  title,
  joinDate,
  daysActive,
  requestedBy,
  timestamp,
  activity,
}) {
  const { messagesCount = 0, voiceMinutes = 0, muteCount = 0 } = activity || {};

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  roundRect(ctx, 0, 0, W, H, 24);
  ctx.fillStyle = COLORS.bg;
  ctx.fill();

  const pad = 28;
  let y = pad;

  // 1) العنوان + صورة العضو
  const headerH = 130;
  roundRect(ctx, pad, y, W - pad * 2, headerH, 16);
  ctx.fillStyle = COLORS.card;
  ctx.fill();

  ctx.fillStyle = "#e8e8f0";
  ctx.font = "bold 20px NotoSans";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(title, W - pad - 20, y + 24);

  const avatarSize = 84;
  const avatarX = pad + 20;
  const avatarY = y + (headerH - avatarSize) / 2;
  roundRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 12);
  ctx.save();
  ctx.clip();
  try {
    const img = await loadImage(avatarURL);
    ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
  } catch {
    ctx.fillStyle = COLORS.pill;
    ctx.fill();
  }
  ctx.restore();

  y += headerH + 16;

  // 2) العراقة والانضمام
  const section1H = 150;
  roundRect(ctx, pad, y, W - pad * 2, section1H, 16);
  ctx.fillStyle = COLORS.card;
  ctx.fill();
  sectionHeader(ctx, pad + 16, y + 16, W - pad * 2 - 32, "سجل الانضمام", COLORS.join);
  let fy = y + 66;
  fy = fieldRow(ctx, pad + 16, fy, W - pad * 2 - 32, "تاريخ الانضمام", joinDate);
  fieldRow(ctx, pad + 16, fy, W - pad * 2 - 32, "الفترة المقضاة", daysActive);
  y += section1H + 16;

  // 3) التفاعل في الشات
  const section2H = 96;
  roundRect(ctx, pad, y, W - pad * 2, section2H, 16);
  ctx.fillStyle = COLORS.card;
  ctx.fill();
  sectionHeader(ctx, pad + 16, y + 16, W - pad * 2 - 32, "التفاعل في الشات", COLORS.chat);
  fieldRow(ctx, pad + 16, y + 66, W - pad * 2 - 32, "عدد الرسائل", `${messagesCount} رسالة`);
  y += section2H + 16;

  // 4) النشاط الصوتي
  const section3H = 96;
  roundRect(ctx, pad, y, W - pad * 2, section3H, 16);
  ctx.fillStyle = COLORS.card;
  ctx.fill();
  sectionHeader(ctx, pad + 16, y + 16, W - pad * 2 - 32, "النشاط الصوتي", COLORS.voice);
  fieldRow(ctx, pad + 16, y + 66, W - pad * 2 - 32, "الوقت في الرومات", formatVoiceTime(voiceMinutes));
  y += section3H + 16;

  // 5) سجل الكتم
  const section4H = 96;
  roundRect(ctx, pad, y, W - pad * 2, section4H, 16);
  ctx.fillStyle = COLORS.card;
  ctx.fill();
  sectionHeader(ctx, pad + 16, y + 16, W - pad * 2 - 32, "سجل الكتم", COLORS.mute);
  fieldRow(ctx, pad + 16, y + 66, W - pad * 2 - 32, "عدد مرات الكتم", `${muteCount} مرة`);
  y += section4H + 20;

  // 6) إضافة شعار/صورة السيرفر الشفافة في الفراغ السفلي
  try {
    const logoImg = await loadImage(path.join(process.cwd(), "src", "assets", "server-logo.png"));
    const logoWidth = 460; // عرض الشعار (يمكنك تعديله حسب الرغبة)
    const logoHeight = (logoImg.height / logoImg.width) * logoWidth; // الحفاظ على أبعاد الصورة الأصلية
    const logoX = (W - logoWidth) / 2;
    const logoY = y + 10;
    
    ctx.save();
    ctx.globalAlpha = 0.85; // درجة الشفافية والوضوح للشعار
    ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
    ctx.restore();
    
    y += logoHeight + 25;
  } catch (e) {
    console.error("Failed to load server logo:", e);
  }

  // 7) الفوتر
  ctx.font = "13px NotoSans";
  ctx.fillStyle = COLORS.textDim;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(`طلب بواسطة: ${requestedBy} | ${timestamp}`, W - pad, y);

  return canvas.toBuffer("image/png");
}

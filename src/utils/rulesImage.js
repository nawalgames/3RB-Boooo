import {
  createCanvas,
  GlobalFonts,
} from "@napi-rs/canvas";

import {
  AttachmentBuilder,
} from "discord.js";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WIDTH = 2400;
const HEIGHT = 2050;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_PATH = path.resolve(
  __dirname,
  "../assets",
);

const FONT_REGULAR_PATH = path.join(
  ASSETS_PATH,
  "NotoSansArabic-Regular.ttf",
);

const FONT_BOLD_PATH = path.join(
  ASSETS_PATH,
  "NotoSansArabic-Bold.ttf",
);

if (fs.existsSync(FONT_REGULAR_PATH)) {
  GlobalFonts.registerFromPath(
    FONT_REGULAR_PATH,
    "Noto Arabic",
  );
}

if (fs.existsSync(FONT_BOLD_PATH)) {
  GlobalFonts.registerFromPath(
    FONT_BOLD_PATH,
    "Noto Arabic",
  );
}

const FONT_FAMILY = '"Noto Arabic"';

const RULES = [
  {
    title: "التعرض أو شتم الذات الإلهية",
    description:
      "يمنع منعاً باتاً الإساءة إلى الذات الإلهية بأي شكل من الأشكال، سواء باللفظ أو التلميح أو السخرية. هذا الفعل يعد من أخطر المخالفات ويظهر عدم احترام الدين الإسلامي.",
  },
  {
    title: "السب والشتم بجميع أشكاله",
    description:
      "يمنع استخدام أي لفظ جارح أو مهين، سواء كان صريحاً أو مبطناً أو مشفراً، ويشمل ذلك الألفاظ التي تخدش الحياء أو الشرف.",
  },
  {
    title: "الإساءة للمراقبين أو اتهامهم دون دليل",
    description:
      "يمنع الإساءة اللفظية أو توجيه الاتهامات الباطلة تجاه أعضاء الإدارة أو المراقبين. عند وجود مشكلة استخدم قنوات الدعم الرسمية.",
  },
  {
    title: "النقاشات الدينية أو الطائفية أو السياسية أو العنصرية",
    description:
      "يمنع الخوض في أي نقاش ديني أو طائفي أو سياسي أو عرقي، ويمنع نشر أي محتوى يحمل طابعاً عنصرياً أو تحريضياً.",
  },
  {
    title: "التكفير أو اللعن",
    description:
      "يمنع تكفير أي شخص أو طائفة، ويمنع اللعن أو الدعاء على الآخرين أو اتهامهم بشكل مسيء.",
  },
  {
    title: "التحدث باسم الإدارة بعبارات مهينة",
    description:
      "يمنع التحدث باسم الإدارة أو استخدام اسمها لتوجيه الإهانات أو التهديدات أو إعطاء تعليمات غير صادرة من الإدارة.",
  },
];

function roundedRect(
  context,
  x,
  y,
  width,
  height,
  radius,
) {
  context.beginPath();
  context.roundRect(
    x,
    y,
    width,
    height,
    radius,
  );
}

function wrapText(
  context,
  text,
  maxWidth,
) {
  const words = String(text)
    .trim()
    .split(/\s+/);

  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine
      ? `${currentLine} ${word}`
      : word;

    if (
      !currentLine ||
      context.measureText(testLine).width <=
        maxWidth
    ) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawWrappedText(
  context,
  text,
  x,
  y,
  maxWidth,
  lineHeight,
) {
  const lines = wrapText(
    context,
    text,
    maxWidth,
  );

  context.textAlign = "right";
  context.textBaseline = "alphabetic";
  context.direction = "rtl";

  lines.forEach((line, index) => {
    context.fillText(
      line,
      x,
      y + index * lineHeight,
    );
  });

  return lines.length;
}

function drawBackground(context) {
  const gradient =
    context.createLinearGradient(
      0,
      0,
      WIDTH,
      HEIGHT,
    );

  gradient.addColorStop(
    0,
    "#070707",
  );

  gradient.addColorStop(
    0.5,
    "#171108",
  );

  gradient.addColorStop(
    1,
    "#030303",
  );

  context.fillStyle = gradient;

  context.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT,
  );

  context.strokeStyle =
    "rgba(224, 171, 67, 0.65)";

  context.lineWidth = 6;

  context.strokeRect(
    30,
    30,
    WIDTH - 60,
    HEIGHT - 60,
  );

  context.strokeStyle =
    "rgba(224, 171, 67, 0.24)";

  context.lineWidth = 2;

  context.strokeRect(
    55,
    55,
    WIDTH - 110,
    HEIGHT - 110,
  );
}

function drawHeader(context) {
  const x = 80;
  const y = 70;
  const width = WIDTH - 160;
  const height = 190;

  roundedRect(
    context,
    x,
    y,
    width,
    height,
    30,
  );

  context.fillStyle =
    "rgba(5, 5, 6, 0.97)";

  context.fill();

  context.strokeStyle = "#e0ad43";
  context.lineWidth = 5;
  context.stroke();

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.direction = "rtl";

  context.fillStyle = "#edbd5b";
  context.font =
    `bold 82px ${FONT_FAMILY}`;

  context.fillText(
    "📜 قوانين السيرفر",
    WIDTH / 2,
    132,
  );

  context.fillStyle = "#ffffff";
  context.font =
    `32px ${FONT_FAMILY}`;

  context.fillText(
    "3RB Community • الالتزام بالقوانين مسؤولية الجميع",
    WIDTH / 2,
    210,
  );
}

function drawRule(
  context,
  rule,
  index,
  x,
  y,
) {
  const cardWidth = 1060;
  const cardHeight = 390;

  roundedRect(
    context,
    x,
    y,
    cardWidth,
    cardHeight,
    28,
  );

  context.fillStyle =
    "rgba(8, 8, 9, 0.98)";

  context.fill();

  context.strokeStyle =
    "rgba(224, 171, 67, 0.86)";

  context.lineWidth = 4;
  context.stroke();

  const badgeSize = 110;
  const badgeX = x + cardWidth - 145;
  const badgeY = y + 42;

  roundedRect(
    context,
    badgeX,
    badgeY,
    badgeSize,
    badgeSize,
    22,
  );

  context.fillStyle =
    "rgba(190, 139, 31, 0.25)";

  context.fill();

  context.strokeStyle = "#e0ad43";
  context.lineWidth = 4;
  context.stroke();

  context.fillStyle = "#f0c86b";
  context.font =
    `bold 62px ${FONT_FAMILY}`;

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.direction = "ltr";

  context.fillText(
    String(index + 1),
    badgeX + badgeSize / 2,
    badgeY + badgeSize / 2,
  );

  const textRight = x + cardWidth - 185;
  const textWidth = cardWidth - 260;

  context.textAlign = "right";
  context.textBaseline = "alphabetic";
  context.direction = "rtl";

  context.fillStyle = "#edbd5b";
  context.font =
    `bold 46px ${FONT_FAMILY}`;

  const titleLines = drawWrappedText(
    context,
    rule.title,
    textRight,
    y + 78,
    textWidth,
    58,
  );

  context.fillStyle = "#f4f4f4";
  context.font =
    `34px ${FONT_FAMILY}`;

  drawWrappedText(
    context,
    rule.description,
    textRight,
    y +
      78 +
      titleLines * 58 +
      28,
    textWidth,
    48,
  );
}

function drawFooter(context) {
  const x = 80;
  const y = HEIGHT - 205;
  const width = WIDTH - 160;
  const height = 125;

  roundedRect(
    context,
    x,
    y,
    width,
    height,
    25,
  );

  context.fillStyle =
    "rgba(5, 5, 6, 0.98)";

  context.fill();

  context.strokeStyle = "#e0ad43";
  context.lineWidth = 4;
  context.stroke();

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.direction = "rtl";

  context.fillStyle = "#edbd5b";
  context.font =
    `bold 34px ${FONT_FAMILY}`;

  context.fillText(
    "✅ بدخولك السيرفر فأنت توافق على الالتزام بهذه القوانين",
    WIDTH / 2,
    y + 48,
  );

  context.fillStyle = "#ffffff";
  context.font =
    `25px ${FONT_FAMILY}`;

  context.fillText(
    "3RB • جميع الحقوق محفوظة",
    WIDTH / 2,
    y + 96,
  );
}

export async function createRulesImage() {
  const canvas = createCanvas(
    WIDTH,
    HEIGHT,
  );

  const context = canvas.getContext("2d");

  drawBackground(context);
  drawHeader(context);

  const cardWidth = 1060;
  const cardHeight = 390;
  const gapX = 70;
  const gapY = 55;

  const leftX = 80;
  const rightX =
    leftX + cardWidth + gapX;

  const startY = 330;

  RULES.forEach((rule, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);

    const x =
      column === 0
        ? leftX
        : rightX;

    const y =
      startY +
      row * (cardHeight + gapY);

    drawRule(
      context,
      rule,
      index,
      x,
      y,
    );
  });

  drawFooter(context);

  return canvas.toBuffer("image/png");
}

export async function sendRules(channel) {
  const imageBuffer =
    await createRulesImage();

  const attachment =
    new AttachmentBuilder(
      imageBuffer,
      {
        name: "3rb-rules.png",
      },
    );

  await channel.send({
    files: [attachment],
  });
}

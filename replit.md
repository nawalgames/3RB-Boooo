# 3RB Discord Bot

منظم بوت Discord عربي يعمل مع Firebase Realtime Database ويدعم إدارة السيرفر والـ FAQ ونظام المستويات ومزودي AI الاحتياطيين.

## Run & Operate

- `pnpm --filter @workspace/3rb-discord-bot start` — run the Discord bot
- `pnpm --filter @workspace/3rb-discord-bot run check` — validate JavaScript syntax
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required bot env: see `services/3rb-discord-bot/.env.example`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Bot: Node.js 20+ with native ESM
- Discord: discord.js 14
- Web health server: Express 5
- Database: Firebase Admin SDK with Realtime Database
- AI: Gemini, OpenRouter, and Groq with fallback order

## Where things live

- `services/3rb-discord-bot/src/index.js` — application entry point
- `services/3rb-discord-bot/src/handlers/` — Discord events and feature orchestration
- `services/3rb-discord-bot/src/services/firebaseStore.js` — Firebase data access
- `services/3rb-discord-bot/src/services/ai/` — AI providers and fallback service
- `services/3rb-discord-bot/README.md` — local, GitHub, and Render setup

## Architecture decisions

- تم الحفاظ على مسارات Firebase Realtime Database القديمة كما هي.
- تم إبقاء JavaScript ESM بدل تحويل المشروع إلى TypeScript لتقليل مخاطر التغيير على بوت يعمل حاليًا.
- كل مزود AI معزول خلف واجهة `ask(prompt)`، لذلك تعطل مزود لا يوقف البوت.
- Render يشغل خادم HTTP بسيطًا مع بوت Discord في نفس العملية.

## Product

بوت 3RB لإدارة مجتمع Discord عربي: حماية، ردود تلقائية، FAQ، مستويات، ورسائل مساعدة بالذكاء الاصطناعي.

## User preferences

- يريد المستخدم بنية ملفات احترافية مناسبة لـ GitHub وRender مع عدم كسر اتصال Firebase.

## Gotchas

- يجب تفعيل Message Content Intent في Discord Developer Portal.
- لا ترفع `.env` أو مفاتيح Firebase إلى GitHub.
- `FIREBASE_PRIVATE_KEY` في Render يجب أن تحتوي على `\n` للحفاظ على أسطر المفتاح.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

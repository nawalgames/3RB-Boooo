# 3RB Discord Bot

بوت Discord عربي منظم يعمل مع Firebase Realtime Database ويدعم أكثر من مزود
للذكاء الاصطناعي. تم تقسيم الكود إلى وحدات صغيرة مع الحفاظ على مسارات Firebase
والأوامر الموجودة في النسخة الأصلية.

## المزايا الحالية

- أوامر `/ping` و`/settings` و`/faq` و`/banword` و`/exempt-channel`.
- حماية الروابط ودعوات Discord مع استثناء قنوات محددة.
- كلمات ممنوعة مع حذف الرسالة وكتم العضو لمدة قابلة للتحديد.
- رد السلام في القناة العامة.
- ردود FAQ قابلة للإضافة والتعديل والحذف.
- نظام XP ومستويات محفوظ في Firebase.
- رد مساعد AI عند منشن البوت، مع التبديل التلقائي بين Gemini ثم OpenRouter ثم Groq.
- خادم HTTP صغير لفحص الحالة وإبقاء خدمة Render مستيقظة.

## هيكل الملفات

```text
src/
├── commands/
│   └── definitions.js          # تعريف أوامر Discord slash commands
├── config/
│   ├── discord.js               # Discord client وتسجيل الأوامر
│   ├── env.js                   # قراءة والتحقق من متغيرات البيئة
│   └── firebase.js               # تهيئة Firebase مرة واحدة
├── constants/
│   ├── ai.js                    # تعليمات AI والردود الاحتياطية
│   ├── messages.js              # الرسائل الثابتة
│   └── settings.js              # الإعدادات الافتراضية
├── handlers/
│   ├── hourlyHandler.js         # الرسائل التلقائية كل ساعة
│   ├── interactionHandler.js    # تنفيذ slash commands
│   └── messageHandler.js        # مراقبة الرسائل وميزات البوت
├── services/
│   ├── ai/                      # Gemini وOpenRouter وGroq
│   └── firebaseStore.js         # كل عمليات القراءة والكتابة في Firebase
├── utils/
│   ├── discord.js                # ردود Discord والتحذيرات المؤقتة
│   ├── errors.js                 # أدوات الأخطاء والانتظار
│   ├── http.js                   # fetch مع مهلة زمنية
│   ├── owner.js                  # صلاحية مالك البوت
│   └── text.js                   # تحليل النصوص وتقسيم رسائل Discord
├── index.js                     # نقطة التشغيل وإدارة الإغلاق
└── server.js                    # خادم Render الصحي
```

## التشغيل محليًا

1. انسخ `.env.example` إلى `.env`.
2. أضف القيم الصحيحة إلى `.env`، ولا ترفع الملف إلى GitHub.
3. من جذر المستودع:

   ```bash
   pnpm install
   pnpm --filter @workspace/3rb-discord-bot start
   ```

   أو من هذا المجلد مباشرة:

   ```bash
   pnpm install
   pnpm start
   ```

للفحص السريع دون تشغيل Discord:

```bash
pnpm --filter @workspace/3rb-discord-bot run check
```

## إعداد Render

يمكن استخدام `render.yaml` الموجود في جذر المستودع، أو ضبط خدمة Render يدويًا:

- **Root Directory:** `services/3rb-discord-bot`
- **Build Command:** `pnpm install`
- **Start Command:** `pnpm start`
- **Environment:** Node.js 20 أو أحدث

أضف كل متغيرات `.env.example` المطلوبة في Environment Variables داخل Render.
اترك `PORT` لـ Render ليضبطه تلقائيًا. عند نسخ `FIREBASE_PRIVATE_KEY` إلى Render،
احتفظ بعلامات `\n` داخل القيمة كما هي.

## متطلبات Discord

يحتاج البوت إلى تفعيل **Message Content Intent** من Discord Developer Portal،
لأن ميزات الروابط والكلمات وFAQ وAI تعتمد على قراءة محتوى الرسائل. يجب أيضًا أن
يمتلك البوت صلاحيات قراءة الرسائل وإرسالها وحذف الرسائل وكتم الأعضاء عند الحاجة.

## توافق Firebase

لم يتم تغيير مسارات قاعدة البيانات حتى لا تتأثر البيانات الحالية:

```text
settings/{guildId}
faqs/{guildId}/{keyword}
banwords/{guildId}/{encodedKeyword}
levels/{guildId}/{userId}
```

المشروع يستخدم Firebase Realtime Database وليس Firestore.
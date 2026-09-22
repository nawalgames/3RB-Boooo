import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("rules")
    .setDescription("إرسال قوانين السيرفر بتصميم احترافي في قناة القوانين.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "قناة القوانين، اتركها فارغة لاستخدام القناة المحددة في الإعدادات.",
        )
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check whether the bot is online."),

  new SlashCommandBuilder()
    .setName("invites")
    .setDescription("معرفة عدد الأشخاص الذين دعوتهم إلى السيرفر")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("العضو المراد معرفة عدد دعواته (اختياري)")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("activity")
    .setDescription("معرفة تقرير نشاط وعراقة العضو في السيرفر (صوت وشات)")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("القناة المراد إرسال التقرير فيها (اختياري)")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("test-welcome")
    .setDescription("معاينة بطاقة الترحيب ورسالتها فوراً للتأكد من عملها"),

  new SlashCommandBuilder()
    .setName("test-boost")
    .setDescription("معاينة رسالة وصورة الدعم (Boost) فوراً"),

  new SlashCommandBuilder()
    .setName("settings")
    .setDescription("التحكم الكامل بإعدادات بوت 3RB - للمالك فقط.")
    .addSubcommand((subcommand) =>
      subcommand.setName("show").setDescription("عرض إعدادات البوت الحالية."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("anti-links")
        .setDescription("تشغيل أو إيقاف حماية الروابط.")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("تشغيل أو إيقاف.")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("auto-salam")
        .setDescription("تشغيل أو إيقاف رد السلام.")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("تشغيل أو إيقاف.")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("faq")
        .setDescription("تشغيل أو إيقاف نظام FAQ.")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("تشغيل أو إيقاف.")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ai")
        .setDescription("تشغيل أو إيقاف الذكاء الاصطناعي.")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("تشغيل أو إيقاف.")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("hourly")
        .setDescription("تشغيل أو إيقاف الرسائل التلقائية.")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("تشغيل أو إيقاف.")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("general")
        .setDescription("تحديد قناة الشات العام.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("القناة العامة.")
            .setRequired(true),
        ),
    ),

  new SlashCommandBuilder()
    .setName("exempt-channel")
    .setDescription("استثناء قناة من حماية الروابط.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("القناة المستثناة.")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("faq")
    .setDescription("إدارة الردود التلقائية.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("إضافة أو تحديث رد.")
        .addStringOption((option) =>
          option
            .setName("keyword")
            .setDescription("الكلمة المفتاحية.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("answer").setDescription("الرد.").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("حذف رد.")
        .addStringOption((option) =>
          option
            .setName("keyword")
            .setDescription("الكلمة المفتاحية.")
            .setRequired(true),
        ),
    ),

  new SlashCommandBuilder()
    .setName("banword")
    .setDescription("إدارة الكلمات الممنوعة.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("إضافة كلمة ممنوعة.")
        .addStringOption((option) =>
          option.setName("keyword").setDescription("الكلمة.").setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("duration")
            .setDescription("مدة الكتم بالدقائق.")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(40320),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("حذف كلمة ممنوعة.")
        .addStringOption((option) =>
          option.setName("keyword").setDescription("الكلمة.").setRequired(true),
        ),
    ),

  new SlashCommandBuilder()
    .setName("send-ticket-panel")
    .setDescription("إرسال لوحة فتح التذاكر في القناة.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("command-panel")
    .setDescription("إرسال لوحة الأوامر والروابط الخاصة بالسيرفر")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("kingdoms")
    .setDescription("إرسال لوحة اختيار الممالك والشخصيات للسيرفر")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
].map((command) => command.toJSON());

import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { requireOwner } from "../utils/owner.js"; // للتأكد أن المالك فقط من يستطيع استخدامه

export const data = new SlashCommandBuilder()
  .setName("command-panel")
  .setDescription("إرسال لوحة الأوامر والروابط الخاصة بالسيرفر");

export async function execute(interaction) {
  // التأكد أن المالك هو من قام بتنفيذ الأمر (اختياري، يمكنك حذف هذا السطر لو أردت لأي إداري استخدامه)
  if (!(await requireOwner(interaction))) return;

  const embed = new EmbedBuilder()
    .setColor("#b8860b") // لون ذهبي ملكي
    .setTitle("📌 ⦙ لوحة الأوامر والروابط")
    .setDescription("اكتب أي **كلمة** من القائمة في الشات، وسيقوم البوت بالرد عليك فوراً بالمعلومات المطلوبة!")
    .addFields(
      {
        name: "🎫 ⦙ الدعم والتذاكر:",
        value: [
          "> `تيكت` — لفتح تذكرة دعم فني أو استفسار",
          "> `مساعدة` — لمعرفة طريقة طلب الدعم",
          "> `قوانين` — للتعرف على قوانين السيرفر"
        ].join("\n")
      },
      {
        name: "🔗 ⦙ روابطنا:",
        value: [
          "> `رابط` — الحصول على رابط دعوة السيرفر الدائم",
          "> `دعم` — حسابات التواصل والدعم المباشر"
        ].join("\n")
      },
      {
        name: "👑 ⦙ الإدارة:",
        value: [
          "> `تقديم` — لمعرفة شروط الانضمام لفريق الإدارة"
        ].join("\n")
      }
    )
    .setFooter({ text: "✨ 3RB  — جميع الحقوق محفوظة" });

  // إرسال اللوحة في القناة التي كتب فيها الأمر وحذف رسالة الأمر حتى تكون نظيفة
  await interaction.channel.send({ embeds: [embed] });
  await interaction.reply({ content: "✅ تم إرسال لوحة الأوامر بنجاح!", ephemeral: true });
}

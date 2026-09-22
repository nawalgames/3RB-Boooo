import { SlashCommandBuilder } from "discord.js";
import { handleWelcome } from "../handlers/welcomeHandler.js";

export const data = new SlashCommandBuilder()
  .setName("test-welcome")
  .setDescription("معاينة بطاقة الترحيب ورسالتها فوراً للتأكد من عملها");

export async function execute(interaction) {
  // التأكد من أن صاحب البوت أو المشرف هو من يستخدم الأمر فقط (اختياري للاستخدام الآمن)
  // يمكنك تعديل الشرط حسب رغبتك أو حذفه ليتمكن الجميع من تجربته
  
  await interaction.reply({
    content: "جاري توليد وعرض معاينة الترحيب...",
    ephemeral: true, // رسالة سرية لا يراها غيرك
  });

  try {
    // تمرير معلومات المستخدم الحالي كأنه العضو الجديد الذي دخل
    await handleWelcome(interaction.member);
    
    await interaction.editReply({
      content: "✅ تم إرسال معاينة الترحيب بنجاح إلى روم الترحيب المحدد!",
    });
  } catch (error) {
    console.error("خطأ في تنفيذ أمر تجربة الترحيب:", error);
    await interaction.editReply({
      content: "❌ حدث خطأ أثناء محاولة توليد الترحيب، تحقق من الـ Console.",
    });
  }
}

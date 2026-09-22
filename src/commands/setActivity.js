import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { setActivityChannel } from "../services/firebaseStore.js";

export const setActivityCommand = {
  name: "set-activity",
  description: "تعيين قناة سجل النشاطات والأعضاء (خاص بالمشرفين)",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "channel",
      description: "اختر القناة التي ستظهر فيها بطاقات النشاط",
      type: ApplicationCommandOptionType.Channel,
      required: true,
    }
  ],
  run: async (client, interaction) => {
    try {
      const channel = interaction.options.getChannel("channel");
      await setActivityChannel(interaction.guild.id, channel.id);
      
      await interaction.reply({
        content: `✅ **تم بنجاح!**\nسيتم إرسال بطاقات سجل النشاط والأعضاء حصرياً في القناة: ${channel}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error setting activity channel:", error);
      await interaction.reply({ content: "❌ حدث خطأ أثناء تعيين القناة.", ephemeral: true });
    }
  },
};

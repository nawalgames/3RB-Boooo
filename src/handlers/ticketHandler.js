import { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { env } from '../config/env.js';

export async function handleTicketInteraction(interaction) {
  // دعم كل من الأزرار (Buttons) والقوائم المنسدلة (String Select Menus)
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  const { customId, guild, member } = interaction;

  // عند اختيار قسم من القائمة المنسدلة لفتح التذكرة
  if (interaction.isStringSelectMenu() && customId === 'ticket_select_menu') {
    try {
      const categoryId = env.ticketCategoryId;
      const supportUserId = env.supportRoleId; // الآيدي المحدد للدعم

      if (!categoryId || !supportUserId) {
        return await interaction.reply({
          content: '❌ خطأ: لم يتم التعرف على TICKET_CATEGORY_ID أو SUPPORT_ROLE_ID. تأكد من إضافتها في ملف البيئة أو Render.',
          ephemeral: true,
        });
      }

      const selectedValue = interaction.values[0];

      // خريطة لتحديد أسماء البادئة لكل قسم
      const categoryPrefixes = {
        ticket_general: 'دعم-عام',
        ticket_market: 'سوق',
        ticket_report: 'بلاغ',
        ticket_middleman: 'وسيط',
        ticket_suggestion: 'اقتراح',
      };

      const prefix = categoryPrefixes[selectedValue] || 'تذكرة';
      const supportMember = await guild.members.fetch(supportUserId).catch(() => null);

      const permissionOverwrites = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel], // إخفاء عن الجميع
        },
        {
          id: member.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory],
        },
      ];

      if (supportMember) {
        permissionOverwrites.push({
          id: supportMember.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory],
        });
      }

      // إنشاء قناة التذكرة بالاسم المخصص والقسم
      const channel = await guild.channels.create({
        name: `${prefix}-${member.user.username}`,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites,
      });

      // أزرار التحكم داخل التذكرة (إغلاق، استلام، خيارات)
      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('إغلاق')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger);

      const claimButton = new ButtonBuilder()
        .setCustomId('claim_ticket')
        .setLabel('استلام')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎯');

      const optionsButton = new ButtonBuilder()
        .setCustomId('ticket_options')
        .setLabel('خيارات')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⚙️');

      const row = new ActionRowBuilder().addComponents(closeButton, claimButton, optionsButton);

      const ticketEmbed = new EmbedBuilder()
        .setTitle(`🎫 تذكرة جديدة | ${member.user.username}`)
        .setDescription(`أهلاً بك ${member} في قسم **${prefix}**.\nيرجى كتابة تفاصيل مشكلتك أو استفسارك بوضوح، وسيتم خدمتك في أقرب وقت ممكن من قبل الإدارة.`)
        .setColor('#5865F2')
        .setTimestamp();

      await channel.send({ 
        content: `<@${member.id}> | <@${supportUserId}>`, 
        embeds: [ticketEmbed], 
        components: [row] 
      });

      await interaction.reply({ content: `✅ تم فتح تذكرتك بنجاح: ${channel}`, ephemeral: true });
    } catch (error) {
      console.error('فشل إنشاء التذكرة:', error);
      await interaction.reply({
        content: `❌ تعذر إنشاء التذكرة. تأكد من صلاحيات البوت وآيدي الفئة.\n**الخطأ:** ${error.message}`,
        ephemeral: true,
      });
    }
    return;
  }

  // التعامل مع الأزرار داخل التذكرة
  if (interaction.isButton()) {
    // عند ضغط زر "إغلاق التذكرة"
    if (customId === 'close_ticket') {
      try {
        await interaction.reply({ content: '🔒 سيتم إغلاق وحذف التذكرة خلال 5 ثوانٍ...', ephemeral: false });
        setTimeout(async () => {
          await interaction.channel.delete().catch(() => {});
        }, 5000);
      } catch (error) {
        console.error('فشل إغلاق التذكرة:', error);
      }
    }

    // عند ضغط زر "استلام التذكرة" (Claim)
    if (customId === 'claim_ticket') {
      try {
        await interaction.reply({ 
          content: `🎯 تم استلام هذه التذكرة بواسطة المشرف: ${interaction.user}` 
        });
      } catch (error) {
        console.error('فشل استلام التذكرة:', error);
      }
    }

    // عند ضغط زر "خيارات إضافية" (Options)
    if (customId === 'ticket_options') {
      try {
        await interaction.reply({ 
          content: '⚙️ قائمة الخيارات الإضافية (يمكنك تخصيصها كإضافة أعضاء أو تثبيت الرسائل لاحقاً).', 
          ephemeral: true 
        });
      } catch (error) {
        console.error('فشل عرض الخيارات:', error);
      }
    }
  }
}

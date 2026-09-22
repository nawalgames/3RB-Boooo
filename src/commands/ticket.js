import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('send-ticket-panel')
  .setDescription('إرسال لوحة فتح التذاكر في القناة')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🏰 | نظام الدعم والتذاكر')
    .setDescription('أهلاً بك في مركز دعم السيرفر!\n\nإذا كان لديك أي استفسار، مشكلة، بلاغ، أو طلب خاص، يرجى اختيار القسم المناسب من القائمة المنسدلة أدناه لفتح تذكرة خاصة بك وسيقوم فريق الإدارة بخدمتك في أقرب وقت.')
    .setColor('#5865F2')
    .setFooter({ text: 'يرجى عدم فتح تذكرة بدون سبب حقيقي' });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_select_menu')
    .setPlaceholder('اختر قسم التذكرة المناسب...')
    .addOptions([
      {
        label: 'الدعم العام',
        description: 'للاستفسارات العامة والمشاكل التقنية',
        value: 'ticket_general',
        emoji: '🛠️',
      },
      {
        label: 'مشاكل السوق',
        description: 'لحل مشاكل البيع والشراء والتعاملات المالية',
        value: 'ticket_market',
        emoji: '💰',
      },
      {
        label: 'بلاغ وشكوى',
        description: 'للتبليغ عن مخالفة عضو أو شكوى إدارية',
        value: 'ticket_report',
        emoji: '🚨',
      },
      {
        label: 'وسيط',
        description: 'لطلب وسيط معتمد لإتمام العمليات',
        value: 'ticket_middleman',
        emoji: '🤝',
      },
      {
        label: 'اقتراح',
        description: 'لتقديم أفكارك واقتراحاتك لتطوير السيرفر',
        value: 'ticket_suggestion',
        emoji: '💡',
      },
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.reply({ content: 'تم إرسال لوحة التذاكر بنجاح!', ephemeral: true });
  await interaction.channel.send({ embeds: [embed], components: [row] });
}

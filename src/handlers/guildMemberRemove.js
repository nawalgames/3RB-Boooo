import { EmbedBuilder } from "discord.js";

const GOODBYE_CHANNEL_ID = '1551918805083619428';

export async function handleGuildMemberRemove(member) {
    const channel = member.guild.channels.cache.get(GOODBYE_CHANNEL_ID);
    if (!channel) return;

    const goodbyeEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('👋 عضـو غـادر السيرفر')
        .setDescription(`للأسف غادرنا العضو **${member.user.tag}**.\nنتمنى له التوفيق!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `عدد الأعضاء الحالي: ${member.guild.memberCount}` })
        .setTimestamp();

    await channel.send({ embeds: [goodbyeEmbed] });
}

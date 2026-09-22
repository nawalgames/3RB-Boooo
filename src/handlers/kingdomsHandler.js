import { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

// دالة إرسال لوحات الاختيار إلى القناة
export async function handleKingdomPanel(interaction) {
  const kingdomEmbed = new EmbedBuilder()
    .setTitle('🏰 اختيار الممالك - عالم 3RB')
    .setDescription(
      'أرض الأساطير تنقسم إلى ثلاث إمبراطوريات كبرى تتصارع على النفوذ والسيادة.\n' +
      'اختر صفك بعناية، فهنا تبدأ قصتك وهنا تصنع مجدك بين رفقاء السلاح!\n\n' +
      '🦅 **【 الشينسو 】 🔴**\n' +
      '**إمبراطورية الإيمان والروحانيات**\n' +
      'الشينسو إمبراطورية ذات طابع روحي، يؤمن أهلها بقوة الإيمان والطاقة الروحية. يتميز محاربوها بالشجاعة والولاء، ويسعون لحماية إمبراطوريتهم ومواجهة الأخطار التي تهدد عالمهم.\n\n' +
      '🐉 **【 الشونجو 】 🟡**\n' +
      '**إمبراطورية التجارة والقوة الاقتصادية**\n' +
      'الشونجو إمبراطورية عُرفت بقوة تجارتها واتساع نفوذها، ويعتمد أهلها على الثروة والدهاء لبناء قوتهم. محاربون وتجار يسعون للسيطرة على طرق التجارة وفرض نفوذهم على الأراضي المحيطة.\n\n' +
      '🐅 **【 الجينو 】 🔵**\n' +
      '**إمبراطورية القوة العسكرية**\n' +
      'الجينو إمبراطورية عسكرية قوية، يعتمد أهلها على الانضباط والقوة والقتال. جيشها منظم ومحاربوها لا يتراجعون بسهولة، وهدفهم توسيع نفوذ الإمبراطورية وإثبات تفوقهم في ساحات المعارك.'
    )
    .setColor('#2b2d31');

  const kingdomMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('select_kingdom')
      .setPlaceholder('🛡️ حدد مملكتك وانضم لصفوفها...')
      .addOptions([
        { label: '【 الشينسو 】 🔴', value: 'kingdom_shinsoo', emoji: '🦅' },
        { label: '【 الشونجو 】 🟡', value: 'kingdom_shunsoo', emoji: '🐉' },
        { label: '【 الجينو 】 🔵', value: 'kingdom_jinno', emoji: '🐅' }
      ])
  );

  const characterEmbed = new EmbedBuilder()
    .setTitle('⚔️ اختيار الشخصية  - ')
    .setDescription(
      'لكل بطل مساره الخاص في ساحة المعركة؛ اختر المقاتل الذي يمثله أسلوب قتالك:\n\n' +
      '⚔️ **محارب:**\n' +
      'سيد ساحات القتال وقوة المواجهة المباشرة.\n' +
      'يعتمد المحارب على قوته الجسدية ومهارته في استخدام السيف أو السيفين، ويتميز بالتحمل والقدرة على إلحاق ضرر كبير بالخصوم. سواء دخل المعركة منفردًا أو وقف في مقدمة الفريق، يبقى المحارب أحد أقوى المقاتلين في المواجهات المباشرة.\n' +
      '• **أسلوبه:** قوة، دفاع، ضرر مباشر، قتال قريب.\n' +
      '• **نقاط قوته:** التحمل، الضرر الجسدي، مواجهة عدة خصوم.\n' +
      '• **يناسب:** من يحب الدخول في قلب المعركة وعدم التراجع.\n\n' +
      '⸻\n\n' +
      '🥷 **نينجا:**\n' +
      'سيد السرعة والكمائن والضربات القاتلة.\n' +
      'يعتمد النينجا على خفته وسرعة حركته ومباغتة خصومه قبل أن يتمكنوا من الرد. يستطيع القتال بالخنجر في المسافات القريبة أو القوس من مسافات بعيدة، مما يمنحه مرونة كبيرة في اختيار أسلوب المواجهة.\n' +
      '• **أسلوبه:** سرعة، مراوغة، كمائن، ضرر انفجاري أو بعيد.\n' +
      '• **نقاط قوته:** سرعة الهجوم، الحركة، الضربات الحرجة، القتال من مسافة.\n' +
      '• **يناسب:** من يحب السرعة والمراوغة والقضاء على الخصم قبل أن يستوعب الهجوم.\n\n' +
      '⸻\n\n' +
      '🗡️ **سورا:**\n' +
      'سيد السحر والطاقة المظلمة، ومقاتل يجمع بين السيف والقوى الخارقة.\n' +
      'يستخدم السورا قوى سحرية تمنحه قدرات هجومية ودفاعية مميزة، ويمكنه الاعتماد على السيف والقتال المباشر أو توجيه طاقاته المظلمة لإضعاف خصومه وتدميرهم.\n' +
      '• **أسلوبه:** سحر، تعزيزات، إضعاف الخصم، قتال قريب ومتوسط.\n' +
      '• **نقاط قوته:** التنوع، القوة السحرية، تعزيز القدرات، السيطرة على الخصم.\n' +
      '• **يناسب:** من يريد شخصية متوازنة تجمع بين القوة الجسدية والسحر.\n\n' +
      '⸻\n\n' +
      '✨ **شامان:**\n' +
      'سيد الأرواح والطاقة السماوية، وداعم قوي لا غنى عنه في المعارك.\n' +
      'يعتمد الشامان على القوى الروحية والسحرية، ويستطيع مساندة حلفائه بالتعزيزات والعلاج، أو تحويل قوته الروحية إلى هجمات سحرية قوية. وجود شامان متمكن قد يغيّر نتيجة المعركة بالكامل.\n' +
      '• **أسلوبه:** دعم، علاج، تعزيزات، سحر هجومي.\n' +
      '• **نقاط قوته:** تقوية الحلفاء، العلاج، الهجمات السحرية، دعم الفريق.\n' +
      '• **يناسب:** من يحب اللعب الجماعي ودعم الفريق مع امتلاك قوة هجومية خاصة به'
    )
    .setColor('#2b2d31');

  const characterMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('select_character')
      .setPlaceholder('🎭 اختر فئة شخصيتك القتالية...')
      .addOptions([
        { label: 'محارب', value: 'char_warrior', emoji: '⚔️' },
        { label: 'سورا', value: 'char_sura', emoji: '🗡️' },
        { label: 'شامان', value: 'char_shaman', emoji: '✨' },
        { label: 'نينجا', value: 'char_ninja', emoji: '🥷' }
      ])
  );

  // إرسال اللوحات للقناة
  await interaction.channel.send({ embeds: [kingdomEmbed], components: [kingdomMenu] });
  await interaction.channel.send({ embeds: [characterEmbed], components: [characterMenu] });

  // رد مخفي للمشرف
  await interaction.reply({
    content: '✨ تم نشر لوحات الشخصيات بالتنسيق الكامل بنجاح!',
    flags: MessageFlags.Ephemeral
  });
}

// دالة معالجة الاختيار ومنح الرتب بالآيديات الصحيحة
export async function handleKingdomInteraction(interaction) {
  if (!interaction.isStringSelectMenu()) return;
  if (!['select_kingdom', 'select_character'].includes(interaction.customId)) return;

  const member = interaction.member;
  const selectedValue = interaction.values[0];

  const rolesMap = {
    'kingdom_shinsoo': '1549183968065101854',
    'kingdom_shunsoo': '1549184732535984208',
    'kingdom_jinno': '1549185027554807879',
    'char_warrior': '1549185624098218054',
    'char_sura': '1549185953875239032',
    'char_shaman': '1549186184041996348',
    'char_ninja': '1549186295308357663'
  };

  const roleId = rolesMap[selectedValue];
  if (!roleId) return;

  try {
    await member.roles.add(roleId);
    await interaction.reply({ 
      content: `🎉 تمت إضافة رتبتك بنجاح في سيرفر 3RB! بالتوفيق في رحلتك.`, 
      flags: MessageFlags.Ephemeral 
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({ 
      content: `❌ عذراً، تأكد من صلاحيات البوت (Manage Roles) وأن رتبة البوت تعلو الرتب المراد منحها في قائمة رتب السيرفر.`, 
      flags: MessageFlags.Ephemeral 
    });
  }
}

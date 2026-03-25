const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getRoleplayPrefix } = require('../../../utils/prefixHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleplay')
    .setDescription('View all available roleplay commands'),

  async execute(interaction) {
    // Fetch roleplay prefix from database
    const ROLEPLAY_PREFIX = await getRoleplayPrefix(interaction.guild?.id);

    let currentPage = 0;

    // Commands that require @user
    const targetCommands = [
      'hug', 'kiss', 'pat', 'wave', 'poke', 'cuddle', 'slap', 'kick',
      'punch', 'feed', 'tickle', 'bite', 'peck', 'yeet', 'shoot',
      'highfive', 'handhold', 'bonk', 'handshake'
    ];

    // Solo action commands
    const soloCommands = [
      'cry', 'smile', 'dance', 'happy', 'blush', 'wink', 'pout', 'think',
      'nope', 'bored', 'nod', 'sleep', 'shrug', 'laugh', 'lurk', 'run',
      'facepalm', 'tableflip', 'thumbsup', 'smug', 'yawn', 'baka', 'angry',
      'stare', 'nom'
    ];

    // Bonus commands
    const bonusCommands = ['waifu', 'husbando'];

    const pages = [
      // Page 1: Commands with @user
      {
        title: 'ROLEPLAY COMMANDS',
        description: `**Commands that require @user mention**\n\n${targetCommands.map(cmd => `\`${ROLEPLAY_PREFIX}${cmd} @user\``).join('\n')}\n\n`,
        footer: 'Page 1/3 - Commands with @user'
      },
      // Page 2: Solo commands
      {
        title: 'ROLEPLAY COMMANDS',
        description: `**Solo action commands**\n\n${soloCommands.map(cmd => `\`${ROLEPLAY_PREFIX}${cmd}\``).join('\n')}\n\n`,
        footer: 'Page 2/3 - Solo actions'
      },
      // Page 3: Bonus commands
      {
        title: 'BONUS COMMANDS',
        description: `**Special claim commands**\n\n${bonusCommands.map(cmd => `\`${ROLEPLAY_PREFIX}${cmd}\` - Claim a random ${cmd}!`).join('\n')}\n\n**Note:** All roleplay commands use the \`${ROLEPLAY_PREFIX}\` prefix!\n\n`,
        footer: 'Page 3/3 - Bonus commands'
      }
    ];

    const getEmbed = (pageIndex) => {
      const page = pages[pageIndex];
      return new EmbedBuilder()
        .setColor(Math.floor(Math.random() * 0xFFFFFF))
        .setTitle(page.title)
        .setDescription(page.description)
        .setFooter({ text: page.footer })
        .setTimestamp();
    };

    const getButtons = (pageIndex) => {
      return new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(pageIndex === 0),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(pageIndex === pages.length - 1)
        );
    };

    await interaction.reply({
      embeds: [getEmbed(currentPage)],
      components: [getButtons(currentPage)]
    });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      time: 300000 // 5 minutes
    });

    // Auto-delete after 45 seconds
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
        collector.stop();
      } catch (err) {
        // Message already deleted
      }
    }, 45000);

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'These buttons are not for you!', ephemeral: true });
      }

      if (i.customId === 'prev') {
        currentPage = Math.max(0, currentPage - 1);
      } else if (i.customId === 'next') {
        currentPage = Math.min(pages.length - 1, currentPage + 1);
      }

      await i.update({
        embeds: [getEmbed(currentPage)],
        components: [getButtons(currentPage)]
      });
    });

    collector.on('end', async () => {
      try {
        await interaction.editReply({
          components: [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('prev')
                  .setLabel('Previous')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true),
                new ButtonBuilder()
                  .setCustomId('next')
                  .setLabel('Next')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true)
              )
          ]
        });
      } catch (err) {
        // Message deleted or not found
      }
    });
  }
};

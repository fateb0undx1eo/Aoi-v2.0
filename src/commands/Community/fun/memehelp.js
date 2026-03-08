const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('memehelp')
    .setDescription('View all available meme templates and examples'),

  async execute(interaction) {
    let currentPage = 0;

    const pages = [
      {
        title: '🎨 Meme Generator - Classic Templates',
        description: 'Use `/memegen` for these templates:\n\n' +
          '• **drake** - Drake Hotline Bling\n' +
          '• **db** - Distracted Boyfriend\n' +
          '• **cmm** - Change My Mind\n' +
          '• **ds** - Two Buttons\n' +
          '• **gb** - Galaxy Brain\n' +
          '• **pigeon** - Is This a Pigeon?\n' +
          '• **woman-cat** - Woman Yelling at Cat\n' +
          '• **stonks** - Stonks\n' +
          '• **fine** - This is Fine\n' +
          '• **astronaut** - Always Has Been\n' +
          '• **gru** - Gru\'s Plan\n' +
          '• **spongebob** - Mocking SpongeBob\n' +
          '• **mordor** - One Does Not Simply\n' +
          '• **success** - Success Kid\n' +
          '• **blb** - Bad Luck Brian\n\n' +
          '**Example:** `/memegen template:drake top:"Old memes" bottom:"New working memes"`',
        color: 0xFF6B6B,
        footer: 'Page 1/5 • Classic Memes'
      },
      {
        title: '🎨 Meme Generator - Reaction Templates',
        description: 'Use `/memegen2` for these templates:\n\n' +
          '• **panik-kalm-panik** - Panik Kalm Panik\n' +
          '• **spiderman** - Spider-Man Pointing\n' +
          '• **cheems** - Cheems\n' +
          '• **pooh** - Tuxedo Winnie Pooh\n' +
          '• **kombucha** - Kombucha Girl\n' +
          '• **leo** - Leo Strutting\n' +
          '• **patrick** - Push It Somewhere Else\n' +
          '• **kermit** - But That\'s None of My Business\n' +
          '• **buzz** - X, X Everywhere\n' +
          '• **oprah** - Oprah You Get a Car\n' +
          '• **seagull** - Inhaling Seagull\n' +
          '• **facepalm** - Facepalm\n' +
          '• **slap** - Will Smith Slap\n\n' +
          '**Example:** `/memegen2 template:cheems top:"Going to sleep" bottom:"Nothing will go wrong"`',
        color: 0x4ECDC4,
        footer: 'Page 2/5 • Reaction Memes'
      },
      {
        title: '🎨 Meme Generator - Vintage Templates',
        description: 'Use `/memegen3` for these templates:\n\n' +
          '• **joker** - It\'s Simple Kill Batman\n' +
          '• **friends** - Are You Two Friends\n' +
          '• **icanhas** - I Can Has Cheezburger\n' +
          '• **cb** - Confession Bear\n' +
          '• **iw** - Insanity Wolf\n' +
          '• **awkward** - Socially Awkward Penguin\n' +
          '• **awesome** - Socially Awesome Penguin\n' +
          '• **fa** - Forever Alone\n' +
          '• **yuno** - Y U NO Guy\n' +
          '• **philosoraptor** - Philosoraptor\n' +
          '• **noidea** - I Have No Idea What I\'m Doing\n' +
          '• **ss** - Scumbag Steve\n' +
          '• **ggg** - Good Guy Greg\n\n' +
          '**Example:** `/memegen3 template:philosoraptor top:"If memes are art" bottom:"Are we all artists?"`',
        color: 0xFFE66D,
        footer: 'Page 3/5 • Vintage Memes'
      },
      {
        title: '🎨 Meme Generator - Movie/TV Templates',
        description: 'Use `/memegen4` for these templates:\n\n' +
          '• **trump** - Donald Trump\n' +
          '• **morpheus** - Matrix Morpheus\n' +
          '• **keanu** - Conspiracy Keanu\n' +
          '• **dwight** - Schrute Facts\n' +
          '• **michael-scott** - Michael Scott No God No\n' +
          '• **jim** - Jim Halpert Whiteboard\n' +
          '• **officespace** - That Would Be Great\n' +
          '• **inigo** - Inigo Montoya\n' +
          '• **gandalf** - Confused Gandalf\n' +
          '• **chosen** - You Were the Chosen One\n' +
          '• **wonka** - Condescending Wonka\n' +
          '• **winter** - Winter is Coming\n\n' +
          '**Example:** `/memegen4 template:morpheus top:"What if I told you" bottom:"All templates now work"`',
        color: 0xA8E6CF,
        footer: 'Page 4/5 • Movie/TV Memes'
      },
      {
        title: '🎨 Meme Generator - Trending 2024-2026',
        description: 'Use `/memegen5` for these templates:\n\n' +
          '• **midwit** - Midwit IQ Bell Curve\n' +
          '• **millers** - You Guys Getting Paid\n' +
          '• **same** - They\'re The Same Picture\n' +
          '• **glasses** - Peter Parker Glasses\n' +
          '• **wkh** - Who Killed Hannibal\n' +
          '• **drowning** - Drowning High Five\n' +
          '• **balloon** - Running Away Balloon\n' +
          '• **pool** - Mother Ignoring Kid Drowning\n' +
          '• **reveal** - Scooby Doo Reveal\n' +
          '• **bongo** - Bongo Cat\n' +
          '• **headaches** - Types of Headaches\n' +
          '• **home** - We Have Food at Home\n\n' +
          '**Example:** `/memegen5 template:midwit top:"Simple solution" bottom:"Complex explanation"`',
        color: 0xFF6B9D,
        footer: 'Page 5/5 • Trending Memes'
      }
    ];

    const getEmbed = (pageIndex) => {
      const page = pages[pageIndex];
      return new EmbedBuilder()
        .setColor(page.color)
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
            .setLabel('◀ Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pageIndex === 0),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next ▶')
            .setStyle(ButtonStyle.Primary)
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
                  .setLabel('◀ Previous')
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(true),
                new ButtonBuilder()
                  .setCustomId('next')
                  .setLabel('Next ▶')
                  .setStyle(ButtonStyle.Primary)
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

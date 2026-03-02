const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

require('dotenv').config();

const DOMAIN_ROLE = process.env.DOMAIN_EXPANSION;
const ACCUSED_ROLE = process.env.ACCUSED_ROLE;

// ⏱️ Change this if you want later
const MESSAGE_DELETE_TIME = 15000; // 15 sec

// 👉 PUT YOUR GIF LINK HERE
const DEADLY_GIF =
  'https://cdn.discordapp.com/attachments/1457404028760625327/1475165182077698108/ezgif-34f5623570ffe407.gif?ex=699c7e22&is=699b2ca2&hm=85b3a92f761fff6dc8f1e1e1e1e9549012ebeaa1bbb46e9545f7f80a876528b8';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('domain-expansion')
    .setDescription('Activate a Domain Expansion')

    // Dropdown
    .addStringOption(option =>
      option
        .setName('technique')
        .setDescription('Choose a domain')
        .setRequired(true)
        .addChoices(
          {
            name: 'Deadly Sentencing (Higuruma)',
            value: 'deadly'
          }
        )
    )

    // Target
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('User to judge')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {

      /* =====================
         PERMISSION CHECK
      ===================== */

      if (!interaction.member.roles.cache.has(DOMAIN_ROLE)) {
        return interaction.reply({
          content: '⚠️ You lack authority to expand a Domain.',
          ephemeral: true
        });
      }

      /* =====================
         GET OPTIONS
      ===================== */

      const technique = interaction.options.getString('technique');
      const target = interaction.options.getUser('target');

      const member = await interaction.guild.members.fetch(target.id);

      if (!ACCUSED_ROLE) {
        return interaction.reply({
          content: '❌ ACCUSED_ROLE missing in .env',
          ephemeral: true
        });
      }

      /* =====================
         DEADLY SENTENCING
      ===================== */

      if (technique === 'deadly') {

        // Give role
        await member.roles.add(ACCUSED_ROLE);

        const embed = new EmbedBuilder()
          .setTitle('⚖️ Domain Expansion: Deadly Sentencing')
          .setDescription(
            `The court is in session.\n` +
            `${target} has been summoned as the **Defendant**.\n\n` +
            `Judgment will be passed.`
          )
          .setColor('#ddb560')
          .setImage(DEADLY_GIF);

        // Send message
        await interaction.reply({
          embeds: [embed]
        });

        // Auto delete
        setTimeout(async () => {
          try {
            await interaction.deleteReply();
          } catch {
            // ignore if already deleted
          }
        }, MESSAGE_DELETE_TIME);
      }

    } catch (err) {
      console.error('DOMAIN ERROR:', err);

      if (!interaction.replied) {
        interaction.reply({
          content: '❌ Domain failed to form.',
          ephemeral: true
        });
      }
    }
  }
};
const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const DOMAIN_ROLE = process.env.DOMAIN_EXPANSION;
const ACCUSED_ROLE = process.env.ACCUSED_ROLE;

// ⏱️ Change later if needed
const MESSAGE_DELETE_TIME = 10000; // 10 sec

module.exports = {
  data: new SlashCommandBuilder()
    .setName('release')
    .setDescription('Release the accused')

    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('User to release')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {

      /* =====================
         PERMISSION CHECK
      ===================== */

      if (!interaction.member.roles.cache.has(DOMAIN_ROLE)) {
        return interaction.reply({
          content: '⚠️ You cannot overturn the court.',
          ephemeral: true
        });
      }

      const target = interaction.options.getUser('target');
      const member = await interaction.guild.members.fetch(target.id);

      if (!ACCUSED_ROLE) {
        return interaction.reply({
          content: '❌ ACCUSED_ROLE missing in .env',
          ephemeral: true
        });
      }

      /* =====================
         CHECK ROLE
      ===================== */

      if (!member.roles.cache.has(ACCUSED_ROLE)) {
        return interaction.reply({
          content: '⚠️ This user is not under judgment.',
          ephemeral: true
        });
      }

      // Remove role
      await member.roles.remove(ACCUSED_ROLE);

      // Send message
      await interaction.reply({
        content: `🕊️ ${target} has been released from judgment.`
      });

      // Auto delete
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch {}
      }, MESSAGE_DELETE_TIME);

    } catch (err) {
      console.error('RELEASE ERROR:', err);

      if (!interaction.replied) {
        interaction.reply({
          content: '❌ Release failed.',
          ephemeral: true
        });
      }
    }
  }
};
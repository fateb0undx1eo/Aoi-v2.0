const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wasted")
    .setDescription("GTA Wasted 💀")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Mention a user")
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option.setName("image")
        .setDescription("Upload an image")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const user = interaction.options.getUser("user");
      const image = interaction.options.getAttachment("image");

      if (!user && !image) {
        return interaction.reply({
          content: "❌ Mention a user OR upload an image.",
          ephemeral: true
        });
      }

      await interaction.deferReply();

      let avatar = user
        ? user.displayAvatarURL({ extension: "png", size: 512 })
        : image.url;

      const url = `https://api.some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(avatar)}`;

      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      
      const buffer = await res.buffer();
      const file = new AttachmentBuilder(buffer, { name: "wasted.png" });

      await interaction.editReply({ files: [file] });
    } catch (error) {
      console.error('Wasted command error:', error);
      const errorMessage = { content: "❌ Failed to generate the wasted image. Please try again." };
      
      if (interaction.deferred) {
        await interaction.editReply(errorMessage).catch(() => {});
      } else if (!interaction.replied) {
        await interaction.reply({ ...errorMessage, ephemeral: true }).catch(() => {});
      }
    }
  }
};

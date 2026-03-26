const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lolice")
    .setDescription("Lolice meme 🚨")
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
          content: "❌ Provide a user OR upload an image.",
          ephemeral: true
        });
      }

      await interaction.deferReply();

      let avatar;

      if (user) {
        avatar = user.displayAvatarURL({ extension: "png", size: 512 });
      } else {
        avatar = image.url;
      }

      const url = `https://api.some-random-api.com/canvas/misc/lolice?avatar=${encodeURIComponent(avatar)}`;

      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      
      const buffer = await res.buffer();
      const file = new AttachmentBuilder(buffer, { name: "lolice.png" });

      await interaction.editReply({ files: [file] });
    } catch (error) {
      console.error('Lolice command error:', error);
      const errorMessage = { content: "❌ Failed to generate the lolice image. Please try again." };
      
      if (interaction.deferred) {
        await interaction.editReply(errorMessage).catch(() => {});
      } else if (!interaction.replied) {
        await interaction.reply({ ...errorMessage, ephemeral: true }).catch(() => {});
      }
    }
  }
};

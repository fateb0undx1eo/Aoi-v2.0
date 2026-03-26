const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("passed")
    .setDescription("Mission passed meme")
    .addUserOption(opt =>
      opt.setName("user")
        .setDescription("Mention a user")
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
      opt.setName("image")
        .setDescription("Upload an image")
        .setRequired(false)
    ),

  async execute(interaction) {

    const user = interaction.options.getUser("user");
    const image = interaction.options.getAttachment("image");

    // Require at least one
    if (!user && !image) {
      return interaction.reply({
        content: "❌ Mention a user or upload an image.",
        ephemeral: true
      });
    }

    await interaction.deferReply();

    // Get avatar
    const avatar = user
      ? user.displayAvatarURL({ extension: "png", size: 512 })
      : image.url;

    try {

      const url =
        `https://api.some-random-api.com/canvas/overlay/passed?avatar=${encodeURIComponent(avatar)}`;

      const res = await fetch(url);

      if (!res.ok) throw new Error("API Error");

      const buffer = await res.buffer();

      const file = new AttachmentBuilder(buffer, {
        name: "passed.png"
      });

      await interaction.editReply({
        files: [file]
      });

    } catch (err) {
      console.error("Passed Error:", err);
      
      if (interaction.deferred) {
        await interaction.editReply("❌ Failed to generate image.").catch(() => {});
      } else if (!interaction.replied) {
        await interaction.reply({ content: "❌ Failed to generate image.", ephemeral: true }).catch(() => {});
      }
    }
  }
};

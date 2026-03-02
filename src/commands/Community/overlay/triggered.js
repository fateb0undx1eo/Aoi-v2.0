const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("triggered")
    .setDescription("Triggered meme 😡")
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

    const url = `https://api.some-random-api.com/canvas/overlay/triggered?avatar=${encodeURIComponent(avatar)}`;

    const res = await fetch(url);
    const buffer = await res.buffer();

    const file = new AttachmentBuilder(buffer, { name: "triggered.gif" });

    interaction.editReply({ files: [file] });
  }
};

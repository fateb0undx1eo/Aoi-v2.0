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
    const buffer = await res.buffer();

    const file = new AttachmentBuilder(buffer, { name: "lolice.png" });

    interaction.editReply({ files: [file] });
  }
};

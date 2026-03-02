const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("glass")
    .setDescription("Glass effect 🪟")
    .addUserOption(o =>
      o.setName("user").setDescription("Mention user").setRequired(false)
    )
    .addAttachmentOption(o =>
      o.setName("image").setDescription("Upload image").setRequired(false)
    ),

  async execute(interaction) {

    const user = interaction.options.getUser("user");
    const image = interaction.options.getAttachment("image");

    if (!user && !image)
      return interaction.reply({ content: "❌ Provide user or image.", ephemeral: true });

    await interaction.deferReply();

    const avatar = user
      ? user.displayAvatarURL({ extension: "png", size: 512 })
      : image.url;

    const url = `https://api.some-random-api.com/canvas/overlay/glass?avatar=${encodeURIComponent(avatar)}`;

    const res = await fetch(url);
    const buf = await res.buffer();

    interaction.editReply({
      files: [new AttachmentBuilder(buf, { name: "glass.png" })]
    });
  }
};

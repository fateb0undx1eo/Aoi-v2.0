const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tonikawa")
    .setDescription("Tonikawa anime meme")

    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Use user's avatar")
        .setRequired(false)
    )

    .addAttachmentOption(option =>
      option
        .setName("image")
        .setDescription("Upload image")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const user = interaction.options.getUser("user");
      const image = interaction.options.getAttachment("image");

      let avatarUrl;

      if (image) {
        avatarUrl = image.url;
      } 
      else if (user) {
        avatarUrl = user.displayAvatarURL({
          extension: "png",
          size: 512,
        });
      } 
      else {
        return interaction.editReply("❌ Provide a user or image.");
      }

      const apiUrl =
        "https://api.some-random-api.com/canvas/misc/tonikawa" +
        `?avatar=${encodeURIComponent(avatarUrl)}`;

      const res = await fetch(apiUrl);

      if (!res.ok) return interaction.editReply("❌ API Error.");

      const buffer = await res.buffer();

      const file = new AttachmentBuilder(buffer, {
        name: "tonikawa.png",
      });

      await interaction.editReply({ files: [file] });

    } catch (err) {
      console.error(err);
      interaction.editReply("❌ Failed.");
    }
  },
};

const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lied")
    .setDescription("Generate a 'lied' meme with username and avatar")

    // Fake username
    .addStringOption(option =>
      option
        .setName("username")
        .setDescription("Enter a custom username")
        .setRequired(false)
    )

    // User avatar
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Use user's avatar")
        .setRequired(false)
    )

    // Upload image
    .addAttachmentOption(option =>
      option
        .setName("image")
        .setDescription("Upload custom avatar")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const username =
        interaction.options.getString("username") || "Someone";

      const user = interaction.options.getUser("user");
      const image = interaction.options.getAttachment("image");

      let avatarUrl;

      // Prefer uploaded image
      if (image) {
        avatarUrl = image.url;
      }
      // Else use user avatar
      else if (user) {
        avatarUrl = user.displayAvatarURL({
          extension: "png",
          size: 512,
        });
      }
      // Else error
      else {
        return interaction.editReply(
          "❌ Please mention a user or upload an image."
        );
      }

      const apiUrl =
        "https://api.some-random-api.com/canvas/misc/lied" +
        `?avatar=${encodeURIComponent(avatarUrl)}` +
        `&username=${encodeURIComponent(username)}`;

      const res = await fetch(apiUrl);

      if (!res.ok) {
        return interaction.editReply("❌ API error.");
      }

      const buffer = await res.buffer();

      const file = new AttachmentBuilder(buffer, {
        name: "lied.png",
      });

      await interaction.editReply({ files: [file] });

    } catch (err) {
      console.error("Lied command error:", err);
      await interaction.editReply("❌ Failed to generate image.");
    }
  },
};

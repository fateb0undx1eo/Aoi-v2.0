const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("its-so-stupid")
    .setDescription("It's so stupid meme (text + avatar/image)")

    // TEXT (dog param)
    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Text for the meme")
        .setRequired(true)
    )

    // USER (optional)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Use user's avatar")
        .setRequired(false)
    )

    // IMAGE (optional)
    .addAttachmentOption(option =>
      option
        .setName("image")
        .setDescription("Upload an image instead")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const text = interaction.options.getString("text");
      const user = interaction.options.getUser("user");
      const image = interaction.options.getAttachment("image");

      let avatarUrl;

      // Priority: image > user
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
        return interaction.editReply(
          "❌ Provide a user OR upload an image."
        );
      }

      // Build API URL
      const apiUrl =
        "https://api.some-random-api.com/canvas/misc/its-so-stupid" +
        `?dog=${encodeURIComponent(text)}` +
        `&avatar=${encodeURIComponent(avatarUrl)}`;

      const res = await fetch(apiUrl);

      if (!res.ok) {
        return interaction.editReply("❌ API error.");
      }

      const buffer = await res.buffer();

      const file = new AttachmentBuilder(buffer, {
        name: "its-so-stupid.png",
      });

      await interaction.editReply({ files: [file] });

    } catch (err) {
      console.error("its-so-stupid error:", err);
      await interaction.editReply("❌ Failed to generate meme.");
    }
  },
};

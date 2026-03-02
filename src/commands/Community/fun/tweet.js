const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tweet")
    .setDescription("Generate a fake tweet image")

    // Display name
    .addStringOption(option =>
      option
        .setName("displayname")
        .setDescription("Display name")
        .setRequired(true)
    )

    // Username
    .addStringOption(option =>
      option
        .setName("username")
        .setDescription("Username (without @)")
        .setRequired(true)
    )

    // Comment
    .addStringOption(option =>
      option
        .setName("comment")
        .setDescription("Tweet content")
        .setRequired(true)
    )

    // Theme
    .addStringOption(option =>
      option
        .setName("theme")
        .setDescription("Theme")
        .setRequired(true)
        .addChoices(
          { name: "Light", value: "light" },
          { name: "Dark", value: "dark" }
        )
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
      const displayname = interaction.options.getString("displayname");
      const username = interaction.options.getString("username");
      const comment = interaction.options.getString("comment");
      const theme = interaction.options.getString("theme");

      const user = interaction.options.getUser("user");
      const image = interaction.options.getAttachment("image");

      let avatar;

      // Priority: image > user
      if (image) {
        avatar = image.url;
      } 
      else if (user) {
        avatar = user.displayAvatarURL({
          extension: "png",
          size: 512,
        });
      } 
      else {
        return interaction.editReply(
          "❌ Please provide a user OR upload an image."
        );
      }

      // Build URL
      const url =
        "https://api.some-random-api.com/canvas/misc/tweet" +
        `?displayname=${encodeURIComponent(displayname)}` +
        `&username=${encodeURIComponent(username)}` +
        `&comment=${encodeURIComponent(comment)}` +
        `&theme=${theme}` +
        `&avatar=${encodeURIComponent(avatar)}`;

      // Request with API key
      const res = await fetch(url, {
        headers: {
          Authorization: process.env.SRA_API_KEY,
        },
      });

      if (!res.ok) {
        console.log(await res.text());
        return interaction.editReply("❌ API Error.");
      }

      // Convert to buffer
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const file = new AttachmentBuilder(buffer, {
        name: "tweet.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("Tweet Error:", err);

      await interaction.editReply(
        "❌ Failed to generate tweet."
      );
    }
  },
};

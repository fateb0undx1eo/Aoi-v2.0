const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("batmanslap")
    .setDescription("Batman slaps Robin meme")

    // Text 1
    .addStringOption(option =>
      option
        .setName("text1")
        .setDescription("Top text")
        .setRequired(true)
    )

    // Text 2
    .addStringOption(option =>
      option
        .setName("text2")
        .setDescription("Bottom text")
        .setRequired(true)
    )

    // Batman User
    .addUserOption(option =>
      option
        .setName("batman_user")
        .setDescription("Batman (user avatar)")
        .setRequired(false)
    )

    // Batman Image
    .addAttachmentOption(option =>
      option
        .setName("batman_image")
        .setDescription("Batman (upload image)")
        .setRequired(false)
    )

    // Robin User
    .addUserOption(option =>
      option
        .setName("robin_user")
        .setDescription("Robin (user avatar)")
        .setRequired(false)
    )

    // Robin Image
    .addAttachmentOption(option =>
      option
        .setName("robin_image")
        .setDescription("Robin (upload image)")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // Text
      const text1 = interaction.options.getString("text1");
      const text2 = interaction.options.getString("text2");

      // Batman
      const batmanUser = interaction.options.getUser("batman_user");
      const batmanImage = interaction.options.getAttachment("batman_image");

      // Robin
      const robinUser = interaction.options.getUser("robin_user");
      const robinImage = interaction.options.getAttachment("robin_image");

      let batmanAvatar;
      let robinAvatar;

      // Priority: image > user
      if (batmanImage) {
        batmanAvatar = batmanImage.url;
      } else if (batmanUser) {
        batmanAvatar = batmanUser.displayAvatarURL({
          extension: "png",
          size: 512,
        });
      }

      if (robinImage) {
        robinAvatar = robinImage.url;
      } else if (robinUser) {
        robinAvatar = robinUser.displayAvatarURL({
          extension: "png",
          size: 512,
        });
      }

      // Validation
      if (!batmanAvatar) {
        return interaction.editReply(
          "❌ Provide a Batman user OR upload a Batman image."
        );
      }

      if (!robinAvatar) {
        return interaction.editReply(
          "❌ Provide a Robin user OR upload a Robin image."
        );
      }

      // Build API URL
      const url =
        "https://vacefron.nl/api/batmanslap" +
        `?text1=${encodeURIComponent(text1)}` +
        `&text2=${encodeURIComponent(text2)}` +
        `&batman=${encodeURIComponent(batmanAvatar)}` +
        `&robin=${encodeURIComponent(robinAvatar)}`;

      // Fetch
      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      // Convert to buffer
      const buffer = Buffer.from(
        await res.arrayBuffer()
      );

      // Send file
      const file = new AttachmentBuilder(buffer, {
        name: "batmanslap.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("BatmanSlap Error:", err);
      await interaction.editReply("❌ Failed to generate meme.");
    }
  },
};

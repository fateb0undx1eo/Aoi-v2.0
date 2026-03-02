const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("circle")
    .setDescription("Make a circle avatar meme")

    // User for avatar
    .addUserOption(option =>
      option
        .setName("pfp")
        .setDescription("Mention user for avatar")
        .setRequired(false)
    )

    // Or upload image
    .addAttachmentOption(option =>
      option
        .setName("image")
        .setDescription("Upload image instead")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const user = interaction.options.getUser("pfp");
      const image = interaction.options.getAttachment("image");

      let avatarURL;

      // If image uploaded → use it
      if (image) {
        avatarURL = image.url;
      }

      // Else if user mentioned → use avatar
      else if (user) {
        avatarURL = user.displayAvatarURL({
          extension: "png",
          size: 512,
        });
      }

      // Nothing provided
      else {
        return interaction.editReply(
          "❌ Please mention a user OR upload an image."
        );
      }

      const apiURL =
        `https://some-random-api.com/canvas/misc/circle?avatar=` +
        encodeURIComponent(avatarURL);

      const res = await fetch(apiURL);
      const buffer = await res.buffer();

      const file = new AttachmentBuilder(buffer, {
        name: "circle.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("Circle Error:", err);

      await interaction.editReply(
        "❌ Failed to generate circle image."
      );
    }
  },
};

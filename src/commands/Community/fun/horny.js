const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("horny")
    .setDescription("Horny card meme")

    .addUserOption(option =>
      option
        .setName("pfp")
        .setDescription("Mention user for avatar")
        .setRequired(false)
    )

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

      if (image) {
        avatarURL = image.url;
      } else if (user) {
        avatarURL = user.displayAvatarURL({
          extension: "png",
          size: 512,
        });
      } else {
        return interaction.editReply(
          "❌ Please mention a user or upload an image."
        );
      }

      const url =
        "https://some-random-api.com/canvas/misc/horny?avatar=" +
        encodeURIComponent(avatarURL);

      const res = await fetch(url);
      const buffer = await res.buffer();

      const file = new AttachmentBuilder(buffer, {
        name: "horny.png",
      });

      await interaction.editReply({ files: [file] });

    } catch (err) {
      console.error(err);

      await interaction.editReply(
        "❌ Failed to generate image."
      );
    }
  },
};

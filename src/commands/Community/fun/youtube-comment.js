const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("youtube-comment")
    .setDescription("Create a fake YouTube comment")

    // ✅ REQUIRED FIRST
    .addStringOption(o =>
      o.setName("user")
        .setDescription("Username to display")
        .setRequired(true)
    )

    .addStringOption(o =>
      o.setName("comment")
        .setDescription("Comment text")
        .setRequired(true)
    )

    // ✅ OPTIONAL LAST
    .addUserOption(o =>
      o.setName("pfp_user")
        .setDescription("Mention user for avatar")
        .setRequired(false)
    )

    .addAttachmentOption(o =>
      o.setName("pfp_image")
        .setDescription("Upload image for avatar")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const username = interaction.options.getString("user");
    const comment = interaction.options.getString("comment");

    const pfpUser = interaction.options.getUser("pfp_user");
    const pfpImage = interaction.options.getAttachment("pfp_image");

    let avatarURL;

    if (pfpUser) {
      avatarURL = pfpUser.displayAvatarURL({ extension: "png", size: 256 });
    } 
    else if (pfpImage) {
      avatarURL = pfpImage.url;
    } 
    else {
      return interaction.editReply("❌ Please provide a profile picture (mention user OR upload image).");
    }

    const apiURL =
      `https://some-random-api.com/canvas/youtube-comment` +
      `?avatar=${encodeURIComponent(avatarURL)}` +
      `&username=${encodeURIComponent(username)}` +
      `&comment=${encodeURIComponent(comment)}`;

    const res = await fetch(apiURL);
    const buffer = await res.buffer();

    const img = new AttachmentBuilder(buffer, {
      name: "youtube.png"
    });

    interaction.editReply({ files: [img] });
  }
};

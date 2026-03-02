const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("memegen4")
    .setDescription("Create memes - Gaming & More (Page 4)")
    .addStringOption(option =>
      option
        .setName("template")
        .setDescription("Meme template")
        .setRequired(true)
        .addChoices(
          { name: "Roblox", value: "roblox" },
          { name: "Fortnite", value: "fortnite" },
          { name: "GTA", value: "gta" },
          { name: "Twitter Screenshot", value: "twitter" },
          { name: "Reddit", value: "reddit" },
          { name: "Discord", value: "discord" },
          { name: "TikTok", value: "tiktok" },
          { name: "Putin", value: "putin" },
          { name: "Trump", value: "trump" },
          { name: "Obama", value: "obama" },
          { name: "Biden", value: "biden" },
          { name: "Churchill", value: "churchill" },
          { name: "Anime", value: "anime" },
          { name: "Naruto", value: "naruto" },
          { name: "Dragon Ball Z", value: "dbz" },
          { name: "One Piece", value: "onepiece" },
          { name: "Attack on Titan", value: "aot" },
          { name: "Soccer", value: "soccer" },
          { name: "Basketball", value: "basketball" },
          { name: "Football", value: "football" },
          { name: "Baseball", value: "baseball" },
          { name: "Pizza", value: "pizza" },
          { name: "Burger", value: "burger" },
          { name: "Taco", value: "taco" },
          { name: "Sushi", value: "sushi" }
        )
    )
    .addStringOption(option =>
      option
        .setName("top")
        .setDescription("Top text")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("bottom")
        .setDescription("Bottom text")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const template = interaction.options.getString("template");
      const topText = interaction.options.getString("top");
      const bottomText = interaction.options.getString("bottom") || "_";

      const url =
        `https://api.memegen.link/images/${template}/` +
        `${encodeURIComponent(topText.replace(/ /g, "_"))}/` +
        `${encodeURIComponent(bottomText.replace(/ /g, "_"))}.png`;

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ Failed to generate meme.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "meme.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("Meme Error:", err);
      await interaction.editReply("❌ Failed to generate meme.");
    }
  },
};

const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("memegen3")
    .setDescription("Create memes - Even more templates (Page 3)")
    .addStringOption(option =>
      option
        .setName("template")
        .setDescription("Meme template")
        .setRequired(true)
        .addChoices(
          { name: "Thumbs Up", value: "thumbsup" },
          { name: "Thumbs Down", value: "thumbsdown" },
          { name: "Thanos Snap", value: "thanos" },
          { name: "Joker Stairs", value: "joker" },
          { name: "Batman Slap", value: "batman" },
          { name: "Spiderman Desk", value: "spiderman-desk" },
          { name: "The Office", value: "office" },
          { name: "Friends", value: "friends" },
          { name: "Breaking Bad", value: "breaking-bad" },
          { name: "Smudge the Cat", value: "cat" },
          { name: "Doge Dog", value: "dog" },
          { name: "Awkward Seal", value: "seal" },
          { name: "Confession Bear", value: "bear" },
          { name: "Courage Wolf", value: "wolf" },
          { name: "Socially Awkward Penguin", value: "penguin" },
          { name: "Rick Roll", value: "rickroll" },
          { name: "Troll Face", value: "troll" },
          { name: "Rage Guy", value: "rage" },
          { name: "Yao Ming", value: "yao" },
          { name: "Cereal Guy", value: "cereal" },
          { name: "Poker Face", value: "poker" },
          { name: "Me Gusta", value: "megusta" },
          { name: "Forever Alone", value: "foreveralone" },
          { name: "Minecraft", value: "minecraft" },
          { name: "Among Us", value: "among" }
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

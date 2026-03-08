const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quickmeme")
    .setDescription("Quick meme with popular templates")
    .addStringOption(option =>
      option
        .setName("template")
        .setDescription("Choose a popular template")
        .setRequired(true)
        .addChoices(
          { name: "Drake - Reject/Accept", value: "drake" },
          { name: "Distracted Boyfriend", value: "db" },
          { name: "Change My Mind", value: "cmm" },
          { name: "Two Buttons", value: "ds" },
          { name: "Woman Yelling at Cat", value: "woman-cat" },
          { name: "Stonks", value: "stonks" },
          { name: "This is Fine", value: "fine" },
          { name: "Always Has Been", value: "astronaut" },
          { name: "Mocking SpongeBob", value: "spongebob" },
          { name: "Roll Safe", value: "rollsafe" }
        )
    )
    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Your meme text (use | to separate top and bottom)")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const template = interaction.options.getString("template");
      const text = interaction.options.getString("text");

      // Split text by | for top and bottom
      const parts = text.split("|").map(p => p.trim());
      const topText = parts[0] || "Top Text";
      const bottomText = parts[1] || "_";

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
        content: `**${interaction.user.username}'s meme:**`,
        files: [file],
      });

    } catch (err) {
      console.error("Quick Meme Error:", err);
      await interaction.editReply("❌ Failed to generate meme. Use format: `text | bottom text`");
    }
  },
};

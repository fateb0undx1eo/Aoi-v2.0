const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("memegen")
    .setDescription("Create a custom meme from 100+ templates")
    .addStringOption(option =>
      option
        .setName("template")
        .setDescription("Meme template (type to search)")
        .setRequired(true)
        .addChoices(
          // Page 1 - Classic Memes
          { name: "Drake Hotline Bling", value: "drake" },
          { name: "Distracted Boyfriend", value: "db" },
          { name: "Change My Mind", value: "cmm" },
          { name: "Two Buttons", value: "ds" },
          { name: "Expanding Brain", value: "gb" },
          { name: "Is This a Pigeon?", value: "pigeon" },
          { name: "Woman Yelling at Cat", value: "woman-cat" },
          { name: "Stonks", value: "stonks" },
          { name: "This is Fine", value: "fine" },
          { name: "Always Has Been", value: "astronaut" },
          { name: "Gru's Plan", value: "gru" },
          { name: "Mocking SpongeBob", value: "spongebob" },
          { name: "One Does Not Simply", value: "mordor" },
          { name: "Success Kid", value: "success" },
          { name: "Bad Luck Brian", value: "blb" },
          { name: "Futurama Fry", value: "fry" },
          { name: "Roll Safe", value: "rollsafe" },
          { name: "Hide the Pain Harold", value: "harold" },
          { name: "Doge", value: "doge" },
          { name: "Grumpy Cat", value: "grumpycat" },
          { name: "Disaster Girl", value: "disastergirl" },
          { name: "Surprised Pikachu", value: "pikachu" },
          { name: "Bernie Sanders", value: "bernie" },
          { name: "Anakin Padme", value: "aag" },
          { name: "Monkey Puppet", value: "monkeypuppet" }
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

const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("memegen2")
    .setDescription("Create memes - More templates (Page 2)")
    .addStringOption(option =>
      option
        .setName("template")
        .setDescription("Meme template")
        .setRequired(true)
        .addChoices(
          { name: "Panik Kalm", value: "panik" },
          { name: "Spiderman Pointing", value: "spiderman" },
          { name: "Buff Doge vs Cheems", value: "buff" },
          { name: "Tuxedo Winnie", value: "tuxedo" },
          { name: "Sad Pablo Escobar", value: "sad-pablo" },
          { name: "Laughing Leo", value: "leo" },
          { name: "Baby Yoda", value: "yoda" },
          { name: "Buzz Lightyear", value: "buzz" },
          { name: "Patrick Star", value: "patrick" },
          { name: "Kermit Sipping Tea", value: "kermit" },
          { name: "Thinking Guy", value: "thinking" },
          { name: "Big Brain", value: "brain" },
          { name: "Not Stonks", value: "stonks-down" },
          { name: "Trade Offer", value: "trade" },
          { name: "Wojak", value: "wojak" },
          { name: "Pepe the Frog", value: "pepe" },
          { name: "NPC Wojak", value: "npc" },
          { name: "Chad", value: "chad" },
          { name: "Virgin vs Chad", value: "virgin" },
          { name: "Facepalm", value: "facepalm" },
          { name: "Laughing", value: "laughing" },
          { name: "Crying", value: "crying" },
          { name: "Angry", value: "angry" },
          { name: "Surprised", value: "surprised" },
          { name: "Confused", value: "confused" }
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

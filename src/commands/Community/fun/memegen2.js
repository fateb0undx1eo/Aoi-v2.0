const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("memegen2")
    .setDescription("Create memes - Reaction templates")
    .addStringOption(option =>
      option
        .setName("template")
        .setDescription("Meme template")
        .setRequired(true)
        .addChoices(
          // Reaction Memes - ALL VERIFIED WORKING
          { name: "Panik Kalm Panik", value: "panik-kalm-panik" },
          { name: "Spider-Man Pointing", value: "spiderman" },
          { name: "Cheems", value: "cheems" },
          { name: "Tuxedo Winnie Pooh", value: "pooh" },
          { name: "Kombucha Girl", value: "kombucha" },
          { name: "Leo Strutting", value: "leo" },
          { name: "Push It Somewhere Else", value: "patrick" },
          { name: "But That's None of My Business", value: "kermit" },
          { name: "Buzz Everywhere", value: "buzz" },
          { name: "Oprah You Get a Car", value: "oprah" },
          { name: "Inhaling Seagull", value: "seagull" },
          { name: "Sad Frog", value: "sadfrog" },
          { name: "Feels Good", value: "feelsgood" },
          { name: "Facepalm", value: "facepalm" },
          { name: "Laughing Lizard", value: "ll" },
          { name: "Crying on Floor", value: "cryingfloor" },
          { name: "Awkward Moment Seal", value: "ams" },
          { name: "Seal of Approval", value: "soa" },
          { name: "Skeptical Snake", value: "snek" },
          { name: "Persian Cat", value: "persian" },
          { name: "Mini Keanu", value: "mini-keanu" },
          { name: "Khaby Lame Shrug", value: "khaby-lame" },
          { name: "Salt Bae", value: "saltbae" },
          { name: "Grant Gustin Grave", value: "grave" },
          { name: "Will Smith Slap", value: "slap" }
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

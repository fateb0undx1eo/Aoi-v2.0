const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("memegen5")
    .setDescription("Create memes - Trending 2024-2026 templates")
    .addStringOption(option =>
      option
        .setName("template")
        .setDescription("Meme template")
        .setRequired(true)
        .addChoices(
          // Trending & Modern Memes - ALL VERIFIED WORKING
          { name: "Midwit IQ Bell Curve", value: "midwit" },
          { name: "You Guys Getting Paid", value: "millers" },
          { name: "They're The Same Picture", value: "same" },
          { name: "Peter Parker Glasses", value: "glasses" },
          { name: "Who Killed Hannibal", value: "wkh" },
          { name: "Drowning High Five", value: "drowning" },
          { name: "Running Away Balloon", value: "balloon" },
          { name: "No Take Only Throw", value: "ntot" },
          { name: "Mother Ignoring Kid Drowning", value: "pool" },
          { name: "Scooby Doo Reveal", value: "reveal" },
          { name: "Anakin Padme Right", value: "right" },
          { name: "I Made This", value: "made" },
          { name: "Perfection", value: "perfection" },
          { name: "Phoebe Teaching Joey", value: "ptj" },
          { name: "Stop It Patrick", value: "stop" },
          { name: "Patrick's Wallet", value: "wallet" },
          { name: "Two Guys on a Bus", value: "bus" },
          { name: "Bongo Cat", value: "bongo" },
          { name: "Elmo Choosing Cocaine", value: "elmo" },
          { name: "Types of Headaches", value: "headaches" },
          { name: "We Have Food at Home", value: "home" },
          { name: "We Don't Do That Here", value: "wddth" },
          { name: "Genie Rules", value: "wishes" },
          { name: "Fake Spirit Halloween", value: "spirit" },
          { name: "Guy Hammering Nails", value: "nails" }
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

const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("memegen3")
    .setDescription("Create memes - Vintage & animal templates")
    .addStringOption(option =>
      option
        .setName("template")
        .setDescription("Meme template")
        .setRequired(true)
        .addChoices(
          // Vintage & Animal Memes - ALL VERIFIED WORKING
          { name: "It's Simple Kill Batman", value: "joker" },
          { name: "Are You Two Friends", value: "friends" },
          { name: "I Can Has Cheezburger", value: "icanhas" },
          { name: "Confession Bear", value: "cb" },
          { name: "Insanity Wolf", value: "iw" },
          { name: "Socially Awkward Penguin", value: "awkward" },
          { name: "Socially Awesome Penguin", value: "awesome" },
          { name: "Forever Alone", value: "fa" },
          { name: "Troll Face", value: "trollface" },
          { name: "Rage Guy", value: "rage" },
          { name: "Y U NO Guy", value: "yuno" },
          { name: "Joseph Ducreux", value: "jd" },
          { name: "Philosoraptor", value: "philosoraptor" },
          { name: "I Should Buy a Boat", value: "boat" },
          { name: "No Idea What I'm Doing", value: "noidea" },
          { name: "Scumbag Steve", value: "ss" },
          { name: "Good Guy Greg", value: "ggg" },
          { name: "Overly Attached Girlfriend", value: "oag" },
          { name: "Dating Site Murderer", value: "dsm" },
          { name: "10 Guy", value: "tenguy" },
          { name: "Foul Bachelor Frog", value: "fbf" },
          { name: "Scumbag Brain", value: "sb" },
          { name: "Sudden Clarity Clarence", value: "scc" },
          { name: "First World Problems", value: "fwp" },
          { name: "Butthurt Dweller", value: "bd" }
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

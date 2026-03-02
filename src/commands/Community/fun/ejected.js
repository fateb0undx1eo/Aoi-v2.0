const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ejected")
    .setDescription("Among Us ejected meme")
    .addStringOption(option =>
      option
        .setName("name")
        .setDescription("Player name")
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName("impostor")
        .setDescription("Was impostor?")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("crewmate")
        .setDescription("Crewmate color")
        .setRequired(true)
        .addChoices(
          { name: "Black", value: "black" },
          { name: "Blue", value: "blue" },
          { name: "Brown", value: "brown" },
          { name: "Cyan", value: "cyan" },
          { name: "Dark Green", value: "darkgreen" },
          { name: "Lime", value: "lime" },
          { name: "Orange", value: "orange" },
          { name: "Pink", value: "pink" },
          { name: "Purple", value: "purple" },
          { name: "Red", value: "red" },
          { name: "White", value: "white" },
          { name: "Yellow", value: "yellow" }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const name = interaction.options.getString("name");
      const impostor = interaction.options.getBoolean("impostor");
      const crewmate = interaction.options.getString("crewmate");

      const url =
        `https://vacefron.nl/api/ejected` +
        `?name=${encodeURIComponent(name)}` +
        `&impostor=${impostor}` +
        `&crewmate=${crewmate}`;

      const res = await fetch(url);

      if (!res.ok) {
        return interaction.editReply("❌ API Error.");
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, {
        name: "ejected.png",
      });

      await interaction.editReply({
        files: [file],
      });

    } catch (err) {
      console.error("Ejected Error:", err);
      await interaction.editReply("❌ Failed.");
    }
  },
};

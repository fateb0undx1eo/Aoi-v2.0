const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("memegen4")
    .setDescription("Create memes - Movie & TV templates")
    .addStringOption(option =>
      option
        .setName("template")
        .setDescription("Meme template")
        .setRequired(true)
        .addChoices(
          // Movie & TV Memes - ALL VERIFIED WORKING
          { name: "Donald Trump", value: "trump" },
          { name: "Sad Joe Biden", value: "sad-biden" },
          { name: "Sad Barack Obama", value: "sad-obama" },
          { name: "Matrix Morpheus", value: "morpheus" },
          { name: "Conspiracy Keanu", value: "keanu" },
          { name: "Schrute Facts", value: "dwight" },
          { name: "Michael Scott No God No", value: "michael-scott" },
          { name: "Jim Halpert Whiteboard", value: "jim" },
          { name: "That Would Be Great", value: "officespace" },
          { name: "Inigo Montoya", value: "inigo" },
          { name: "Confused Gandalf", value: "gandalf" },
          { name: "You Were the Chosen One", value: "chosen" },
          { name: "Bilbo Why Shouldn't I", value: "bilbo" },
          { name: "Everything the Light Touches", value: "light" },
          { name: "Condescending Wonka", value: "wonka" },
          { name: "You Sit on Throne of Lies", value: "elf" },
          { name: "Life Finds a Way", value: "away" },
          { name: "See Nobody Cares", value: "dodgson" },
          { name: "Probably Not Good Idea", value: "jw" },
          { name: "I Am Captain Now", value: "captain" },
          { name: "What Year Is It", value: "whatyear" },
          { name: "Winter is Coming", value: "winter" },
          { name: "Vince McMahon Reaction", value: "vince" },
          { name: "Say the Line Bart", value: "say" },
          { name: "Principal Skinner", value: "touch" }
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

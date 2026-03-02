const { EmbedBuilder } = require("discord.js");
const Prefix = require("../schemas/prefixSchema");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "kiss",
  description: "Kiss someone!",
  usage: "kiss <@user>",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: true,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

    const prefix = await Prefix.findOne({ guildId: message.guild.id });
    const guildPrefix = prefix ? prefix.prefix : "!";

    const target = message.mentions.users.first();
    
    if (!target) {
      const errorMsg = await message.channel.send(`❌ Please mention someone to kiss! Usage: \`${guildPrefix}kiss @user\``);
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.id === message.author.id) {
      const errorMsg = await message.channel.send("❌ You can't kiss yourself!");
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.bot) {
      const errorMsg = await message.channel.send("❌ You can't kiss bots!");
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    try {
      const res = await fetch("https://nekos.best/api/v2/kiss");
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} kisses ${target}`)
        .setImage(data.results[0].url)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Kiss Error:", err);
      await message.channel.send("❌ Failed to fetch kiss image.");
    }
  },
};

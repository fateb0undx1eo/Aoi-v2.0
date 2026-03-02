const { EmbedBuilder } = require("discord.js");
const Prefix = require("../schemas/prefixSchema");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "wave",
  description: "Wave at someone!",
  usage: "wave <@user>",
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
      const errorMsg = await message.channel.send(`❌ Please mention someone to wave at! Usage: \`${guildPrefix}wave @user\``);
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.id === message.author.id) {
      const errorMsg = await message.channel.send("❌ You can't wave at yourself!");
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    try {
      const res = await fetch("https://nekos.best/api/v2/wave");
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} waves at ${target}`)
        .setImage(data.results[0].url)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Wave Error:", err);
      await message.channel.send("❌ Failed to fetch wave image.");
    }
  },
};

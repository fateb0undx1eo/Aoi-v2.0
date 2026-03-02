const { EmbedBuilder } = require("discord.js");
const Prefix = require("../schemas/prefixSchema");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "yeet",
  description: "Yeet someone!",
  usage: "yeet <@user>",
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
      return message.reply(`❌ Please mention someone to yeet! Usage: \`${guildPrefix}yeet @user\``);
    }

    if (target.id === message.author.id) {
      return message.reply("❌ You can't yeet yourself!");
    }

    if (target.bot) {
      return message.reply("❌ You can't yeet bots!");
    }

    try {
      const res = await fetch("https://nekos.best/api/v2/yeet");
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} yeets ${target}`)
        .setImage(data.results[0].url)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Yeet Error:", err);
      await message.channel.send("❌ Failed to fetch yeet image.");
    }
  },
};

const { EmbedBuilder } = require("discord.js");
const { getRoleplayGIF } = require("../utils/roleplayAPI");
const { getRoleplayPrefix } = require("../utils/prefixHelper");
const logger = require("../utils/winstonLogger");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "tickle",
  description: "Tickle someone!",
  usage: "tickle <@user>",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: true,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}

    const target = message.mentions.users.first();
    const roleplayPrefix = await getRoleplayPrefix(message.guild?.id);
    
    if (!target) {
      const errorMsg = await message.channel.send(`Please mention someone to tickle! Usage: \`${roleplayPrefix}tickle @user\``);
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.id === message.author.id) {
      const errorMsg = await message.channel.send("You can't tickle yourself!");
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.bot) {
      const errorMsg = await message.channel.send("You can't tickle bots!");
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    try {
      const gifUrl = await getRoleplayGIF('tickle');

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} tickles ${target}`)
        .setImage(gifUrl)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
      
      logger.command('tickle', message.author.id, message.guild.id, true);
    } catch (err) {
      logger.error("Tickle command error:", err);
      await message.channel.send("Failed to fetch tickle image.");
    }
  },
};

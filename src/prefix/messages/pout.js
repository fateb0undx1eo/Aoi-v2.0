const { EmbedBuilder } = require("discord.js");
const { getRoleplayGIF } = require("../utils/roleplayAPI");
const { getRoleplayPrefix } = require("../utils/prefixHelper");
const logger = require("../utils/winstonLogger");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

module.exports = {
  name: "pout",
  description: "Pout",
  usage: "pout",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: false,

  async execute(message, args, client) {
    // Delete user's command
    try {
      await message.delete();
    } catch (err) {}


    try {
      const gifUrl = await getRoleplayGIF('pout');

      const embed = new EmbedBuilder()
        .setDescription(`${message.author} pouts`)
        .setImage(gifUrl)
        .setColor(getRandomColor());

      await message.channel.send({ embeds: [embed] });
      
      logger.command('pout', message.author.id, message.guild.id, true);
    } catch (err) {
      logger.error("Pout command error:", err);
      await message.channel.send("Failed to fetch pout image.");
    }
  },
};

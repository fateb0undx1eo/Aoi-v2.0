const { EmbedBuilder } = require("discord.js");
const { getRoleplayGIF } = require("./roleplayAPI");
const { getRoleplayPrefix } = require("./prefixHelper");
const logger = require("./winstonLogger");

const getRandomColor = () => Math.floor(Math.random() * 0xFFFFFF);

/**
 * Roleplay action configuration
 */
const ROLEPLAY_ACTIONS = {
  // Actions with target
  hug: {
    requiresTarget: true,
    message: (author, target) => `${author} hugs ${target}`,
    selfMessage: "You can't hug yourself!",
    botMessage: "You can't hug bots!"
  },
  kiss: {
    requiresTarget: true,
    message: (author, target) => `${author} kisses ${target}`,
    selfMessage: "You can't kiss yourself!",
    botMessage: "You can't kiss bots!"
  },
  pat: {
    requiresTarget: true,
    message: (author, target) => `${author} pats ${target}`,
    selfMessage: "You can't pat yourself!",
    botMessage: "You can't pat bots!"
  },
  wave: {
    requiresTarget: true,
    message: (author, target) => `${author} waves at ${target}`,
    selfMessage: "You can't wave at yourself!",
    botMessage: "You can't wave at bots!"
  },
  poke: {
    requiresTarget: true,
    message: (author, target) => `${author} pokes ${target}`,
    selfMessage: "You can't poke yourself!",
    botMessage: "You can't poke bots!"
  },
  cuddle: {
    requiresTarget: true,
    message: (author, target) => `${author} cuddles ${target}`,
    selfMessage: "You can't cuddle yourself!",
    botMessage: "You can't cuddle bots!"
  },
  slap: {
    requiresTarget: true,
    message: (author, target) => `${author} slaps ${target}`,
    selfMessage: "You can't slap yourself!",
    botMessage: "You can't slap bots!"
  },
  kick: {
    requiresTarget: true,
    message: (author, target) => `${author} kicks ${target}`,
    selfMessage: "You can't kick yourself!",
    botMessage: "You can't kick bots!"
  },
  punch: {
    requiresTarget: true,
    message: (author, target) => `${author} punches ${target}`,
    selfMessage: "You can't punch yourself!",
    botMessage: "You can't punch bots!"
  },
  feed: {
    requiresTarget: true,
    message: (author, target) => `${author} feeds ${target}`,
    selfMessage: "You can't feed yourself!",
    botMessage: "You can't feed bots!"
  },
  tickle: {
    requiresTarget: true,
    message: (author, target) => `${author} tickles ${target}`,
    selfMessage: "You can't tickle yourself!",
    botMessage: "You can't tickle bots!"
  },
  bite: {
    requiresTarget: true,
    message: (author, target) => `${author} bites ${target}`,
    selfMessage: "You can't bite yourself!",
    botMessage: "You can't bite bots!"
  },
  yeet: {
    requiresTarget: true,
    message: (author, target) => `${author} yeets ${target}`,
    selfMessage: "You can't yeet yourself!",
    botMessage: "You can't yeet bots!"
  },
  handhold: {
    requiresTarget: true,
    message: (author, target) => `${author} holds hands with ${target}`,
    selfMessage: "You can't hold hands with yourself!",
    botMessage: "You can't hold hands with bots!"
  },
  peck: {
    requiresTarget: true,
    message: (author, target) => `${author} pecks ${target}`,
    selfMessage: "You can't peck yourself!",
    botMessage: "You can't peck bots!"
  },
  lick: {
    requiresTarget: true,
    message: (author, target) => `${author} licks ${target}`,
    selfMessage: "You can't lick yourself!",
    botMessage: "You can't lick bots!"
  },
  highfive: {
    requiresTarget: true,
    message: (author, target) => `${author} high-fives ${target}`,
    selfMessage: "You can't high-five yourself!",
    botMessage: "You can't high-five bots!"
  },
  bonk: {
    requiresTarget: true,
    message: (author, target) => `${author} bonks ${target}`,
    selfMessage: "You can't bonk yourself!",
    botMessage: "You can't bonk bots!"
  },
  bully: {
    requiresTarget: true,
    message: (author, target) => `${author} bullies ${target}`,
    selfMessage: "You can't bully yourself!",
    botMessage: "You can't bully bots!"
  },
  shoot: {
    requiresTarget: true,
    message: (author, target) => `${author} shoots ${target}`,
    selfMessage: "You can't shoot yourself!",
    botMessage: "You can't shoot bots!"
  },
  handshake: {
    requiresTarget: true,
    message: (author, target) => `${author} shakes hands with ${target}`,
    selfMessage: "You can't shake hands with yourself!",
    botMessage: "You can't shake hands with bots!"
  },

  // Solo actions
  cry: {
    requiresTarget: false,
    message: (author) => `${author} is crying`
  },
  smile: {
    requiresTarget: false,
    message: (author) => `${author} is smiling`
  },
  dance: {
    requiresTarget: false,
    message: (author) => `${author} is dancing`
  },
  happy: {
    requiresTarget: false,
    message: (author) => `${author} is happy`
  },
  blush: {
    requiresTarget: false,
    message: (author) => `${author} is blushing`
  },
  wink: {
    requiresTarget: false,
    message: (author) => `${author} winks`
  },
  pout: {
    requiresTarget: false,
    message: (author) => `${author} is pouting`
  },
  shrug: {
    requiresTarget: false,
    message: (author) => `${author} shrugs`
  },
  yawn: {
    requiresTarget: false,
    message: (author) => `${author} yawns`
  },
  stare: {
    requiresTarget: false,
    message: (author) => `${author} is staring`
  },
  nom: {
    requiresTarget: false,
    message: (author) => `${author} is nomming`
  },
  nope: {
    requiresTarget: false,
    message: (author) => `${author} says nope`
  },
  baka: {
    requiresTarget: false,
    message: (author) => `${author} is being a baka`
  },
  think: {
    requiresTarget: false,
    message: (author) => `${author} is thinking`
  },
  sleep: {
    requiresTarget: false,
    message: (author) => `${author} is sleeping`
  },
  smug: {
    requiresTarget: false,
    message: (author) => `${author} looks smug`
  },
  nod: {
    requiresTarget: false,
    message: (author) => `${author} nods`
  },
  lurk: {
    requiresTarget: false,
    message: (author) => `${author} is lurking`
  },
  facepalm: {
    requiresTarget: false,
    message: (author) => `${author} facepalms`
  },
  laugh: {
    requiresTarget: false,
    message: (author) => `${author} is laughing`
  },
  tableflip: {
    requiresTarget: false,
    message: (author) => `${author} flips the table`
  },
  thumbsup: {
    requiresTarget: false,
    message: (author) => `${author} gives a thumbs up`
  },
  run: {
    requiresTarget: false,
    message: (author) => `${author} is running`
  },
  bored: {
    requiresTarget: false,
    message: (author) => `${author} is bored`
  },
  angry: {
    requiresTarget: false,
    message: (author) => `${author} is angry`
  },
  waifu: {
    requiresTarget: false,
    message: (author) => `${author} found a waifu!`
  },
  husbando: {
    requiresTarget: false,
    message: (author) => `${author} found a husbando!`
  }
};

/**
 * Execute a roleplay action
 * @param {Message} message - Discord message
 * @param {string} action - Action name
 * @param {Client} client - Discord client
 * @returns {Promise<void>}
 */
async function executeRoleplayAction(message, action, client) {
  // Delete user's command
  try {
    await message.delete();
  } catch (err) {}

  const config = ROLEPLAY_ACTIONS[action];
  if (!config) {
    logger.warn(`Unknown roleplay action: ${action}`);
    return;
  }

  const target = message.mentions.users.first();
  const roleplayPrefix = await getRoleplayPrefix(message.guild?.id);

  // Validation for target-required actions
  if (config.requiresTarget) {
    if (!target) {
      const errorMsg = await message.channel.send(
        `Please mention someone to ${action}! Usage: \`${roleplayPrefix}${action} @user\``
      );
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.id === message.author.id) {
      const errorMsg = await message.channel.send(config.selfMessage);
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    if (target.bot) {
      const errorMsg = await message.channel.send(config.botMessage);
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }
  }

  try {
    const gifUrl = await getRoleplayGIF(action);

    const embed = new EmbedBuilder()
      .setDescription(config.message(message.author, target))
      .setImage(gifUrl)
      .setColor(getRandomColor());

    await message.channel.send({ embeds: [embed] });

    logger.command(action, message.author.id, message.guild?.id, true);
  } catch (err) {
    logger.error(`Roleplay command error (${action}):`, err);
    await message.channel.send(`Failed to fetch ${action} image.`);
  }
}

/**
 * Get roleplay action configuration
 * @param {string} action - Action name
 * @returns {object|null} Action config or null
 */
function getRoleplayConfig(action) {
  return ROLEPLAY_ACTIONS[action] || null;
}

/**
 * Get all supported roleplay actions
 * @returns {string[]} Array of action names
 */
function getSupportedActions() {
  return Object.keys(ROLEPLAY_ACTIONS);
}

module.exports = {
  executeRoleplayAction,
  getRoleplayConfig,
  getSupportedActions,
  ROLEPLAY_ACTIONS
};

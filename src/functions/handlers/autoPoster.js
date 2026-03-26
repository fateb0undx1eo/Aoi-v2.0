const fetchMeme = require("./fetchMeme");
const { EmbedBuilder } = require("discord.js");

// Per-guild state storage
const guildStates = new Map();

/**
 * Get or create guild state
 * @param {string} guildId 
 * @returns {Object}
 */
function getGuildState(guildId) {
  if (!guildStates.has(guildId)) {
    guildStates.set(guildId, {
      interval: null,
      channelId: null,
      seconds: 3600,
      pingRoleId: null,
      totalPosts: 0,
      lastPostTime: null,
      startTime: null,
      autoReact: []
    });
  }
  return guildStates.get(guildId);
}

/**
 * Post a meme to the specified channel
 * @param {import('discord.js').Client} client 
 * @param {string} guildId
 */
async function post(client, guildId) {
  const state = getGuildState(guildId);
  
  if (!state.channelId) return;
  
  const channel = client.channels.cache.get(state.channelId);
  if (!channel) return;

  try {
    const meme = await fetchMeme();
    if (!meme || !meme.url) return;

    const embed = new EmbedBuilder()
      .setColor(Math.floor(Math.random() * 16777215))
      .setImage(meme.url)
      .setFooter({ text: `r/${meme.subreddit} • Post #${state.totalPosts + 1}` });

    const messageContent = state.pingRoleId ? `<@&${state.pingRoleId}>` : '';

    const message = await channel.send({ 
      content: messageContent,
      embeds: [embed] 
    });

    // Auto-react if configured
    if (state.autoReact && state.autoReact.length > 0) {
      for (const emoji of state.autoReact) {
        try {
          await message.react(emoji);
        } catch (err) {
          console.error(`Failed to react with ${emoji}:`, err.message);
        }
      }
    }

    state.totalPosts++;
    state.lastPostTime = Date.now();
  } catch (err) {
    console.error("AutoPoster Error:", err);
  }
}

/**
 * Start auto-poster for a guild
 * @param {import('discord.js').Client} client 
 * @param {string} channelId Channel ID
 * @param {number} sec Interval in seconds
 * @param {string} [roleId] Optional role ID to ping
 * @param {string[]} [reactions] Optional array of emojis to auto-react
 */
function startAutoPoster(client, channelId, sec = 3600, roleId = null, reactions = []) {
  if (!client || !channelId) return false;

  const channel = client.channels.cache.get(channelId);
  if (!channel) return false;
  
  const guildId = channel.guild.id;
  const state = getGuildState(guildId);

  state.channelId = channelId;
  state.seconds = sec;
  state.pingRoleId = roleId;
  state.autoReact = reactions || [];
  state.startTime = Date.now();

  if (state.interval) clearInterval(state.interval);

  post(client, guildId); // post immediately

  state.interval = setInterval(() => {
    post(client, guildId);
  }, state.seconds * 1000);

  console.log(`✅ Auto-poster started in guild ${guildId}, channel ${channelId} every ${sec} seconds`);
  return true;
}

/**
 * Update the interval of auto-poster
 * @param {import('discord.js').Client} client 
 * @param {number} ms Interval in milliseconds
 * @param {string} [channelId] Optional channel ID to update
 * @param {string} [roleId] Optional role ID to ping
 * @param {string[]} [reactions] Optional array of emojis to auto-react
 */
function updateInterval(client, ms, channelId, roleId, reactions) {
  if (ms < 10000) return false; // min 10s
  if (!channelId) return false;

  const channel = client.channels.cache.get(channelId);
  if (!channel) return false;
  
  const guildId = channel.guild.id;
  const state = getGuildState(guildId);

  state.channelId = channelId;
  if (roleId !== undefined) state.pingRoleId = roleId;
  if (reactions !== undefined) state.autoReact = reactions;

  const seconds = Math.floor(ms / 1000);
  return startAutoPoster(client, channelId, seconds, state.pingRoleId, state.autoReact);
}

/**
 * Stop the auto-poster for a guild
 * @param {string} guildId
 */
function stopAutoPoster(guildId) {
  if (!guildId) return false;
  
  const state = getGuildState(guildId);
  
  if (state.interval) {
    clearInterval(state.interval);
    state.interval = null;
    state.startTime = null;
    console.log(`✅ Auto-poster stopped for guild ${guildId}.`);
    return true;
  }
  return false;
}

/**
 * Get current state of the auto-poster for a guild
 * @param {string} guildId
 */
function getAutoPosterState(guildId) {
  if (!guildId) {
    return {
      running: false,
      channelId: null,
      intervalSeconds: 3600,
      pingRoleId: null,
      totalPosts: 0,
      lastPostTime: null,
      startTime: null,
      autoReact: [],
    };
  }
  
  const state = getGuildState(guildId);
  
  return {
    running: !!state.interval,
    channelId: state.channelId,
    intervalSeconds: state.seconds,
    pingRoleId: state.pingRoleId,
    totalPosts: state.totalPosts,
    lastPostTime: state.lastPostTime,
    startTime: state.startTime,
    autoReact: state.autoReact,
  };
}

module.exports = {
  startAutoPoster,
  stopAutoPoster,
  updateInterval,
  getAutoPosterState,
};

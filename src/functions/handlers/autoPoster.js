const fetchMeme = require("./fetchMeme");
const { EmbedBuilder } = require("discord.js");

let interval = null;
let channelId = null;
let seconds = 3600; // default 1 hour
let pingRoleId = null;
let totalPosts = 0;
let lastPostTime = null;
let startTime = null; // track when auto-posting started
let autoReact = []; // array of emojis to auto-react

/**
 * Post a meme to the specified channel
 * @param {import('discord.js').Client} client 
 */
async function post(client) {
  if (!channelId) return;
  const channel = client.channels.cache.get(channelId);
  if (!channel) return;

  try {
    const meme = await fetchMeme();
    if (!meme || !meme.url) return;

    const embed = new EmbedBuilder()
      .setColor(Math.floor(Math.random() * 16777215))
      .setImage(meme.url)
      .setFooter({ text: `r/${meme.subreddit} • Post #${totalPosts + 1}` });

    const messageContent = pingRoleId ? `<@&${pingRoleId}>` : '';

    const message = await channel.send({ 
      content: messageContent,
      embeds: [embed] 
    });

    // Auto-react if configured
    if (autoReact && autoReact.length > 0) {
      for (const emoji of autoReact) {
        try {
          await message.react(emoji);
        } catch (err) {
          console.error(`Failed to react with ${emoji}:`, err.message);
        }
      }
    }

    totalPosts++;
    lastPostTime = Date.now();
  } catch (err) {
    console.error("AutoPoster Error:", err);
  }
}

/**
 * Start auto-poster
 * @param {import('discord.js').Client} client 
 * @param {string} id Channel ID
 * @param {number} sec Interval in seconds
 * @param {string} [roleId] Optional role ID to ping
 * @param {string[]} [reactions] Optional array of emojis to auto-react
 */
function startAutoPoster(client, id, sec = 3600, roleId = null, reactions = []) {
  if (!client || !id) return false;

  channelId = id;
  seconds = sec;
  pingRoleId = roleId;
  autoReact = reactions || [];
  startTime = Date.now(); // track start time

  if (interval) clearInterval(interval);

  post(client); // post immediately

  interval = setInterval(() => {
    post(client);
  }, seconds * 1000);

  console.log(`✅ Auto-poster started in channel ${channelId} every ${seconds} seconds`);
  return true;
}

/**
 * Update the interval of auto-poster
 * @param {import('discord.js').Client} client 
 * @param {number} ms Interval in milliseconds
 * @param {string} [id] Optional channel ID to update
 * @param {string} [roleId] Optional role ID to ping
 * @param {string[]} [reactions] Optional array of emojis to auto-react
 */
function updateInterval(client, ms, id, roleId, reactions) {
  if (ms < 10000) return false; // min 10s

  if (id) channelId = id; // allow updating channel
  if (roleId !== undefined) pingRoleId = roleId; // allow updating role
  if (reactions !== undefined) autoReact = reactions; // allow updating reactions

  if (!channelId) return false;

  seconds = Math.floor(ms / 1000);
  startAutoPoster(client, channelId, seconds, pingRoleId, autoReact);
  return true;
}

/**
 * Stop the auto-poster
 */
function stopAutoPoster() {
  if (interval) {
    clearInterval(interval);
    interval = null;
    startTime = null; // reset start time
    console.log("✅ Auto-poster stopped.");
    return true;
  }
  return false;
}

/**
 * Get current state of the auto-poster
 */
function getAutoPosterState() {
  return {
    running: !!interval,
    channelId,
    intervalSeconds: seconds,
    pingRoleId,
    totalPosts,
    lastPostTime,
    startTime,
    autoReact,
  };
}

module.exports = {
  startAutoPoster,
  stopAutoPoster,
  updateInterval,
  getAutoPosterState,
};

const fetchMeme = require("./fetchMeme");
const { EmbedBuilder } = require("discord.js");

let interval = null;
let channelId = null;
let seconds = 3600; // default 1 hour
let pingRoleId = null;
let totalPosts = 0;
let lastPostTime = null;

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

    await channel.send({ 
      content: messageContent,
      embeds: [embed] 
    });

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
 */
function startAutoPoster(client, id, sec = 3600, roleId = null) {
  if (!client || !id) return false;

  channelId = id;
  seconds = sec;
  pingRoleId = roleId;

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
 */
function updateInterval(client, ms, id, roleId) {
  if (ms < 10000) return false; // min 10s

  if (id) channelId = id; // allow updating channel
  if (roleId !== undefined) pingRoleId = roleId; // allow updating role

  if (!channelId) return false;

  seconds = Math.floor(ms / 1000);
  startAutoPoster(client, channelId, seconds, pingRoleId);
  return true;
}

/**
 * Stop the auto-poster
 */
function stopAutoPoster() {
  if (interval) {
    clearInterval(interval);
    interval = null;
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
  };
}

module.exports = {
  startAutoPoster,
  stopAutoPoster,
  updateInterval,
  getAutoPosterState,
};

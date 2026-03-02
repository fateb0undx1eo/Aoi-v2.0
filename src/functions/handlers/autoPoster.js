const fetchMeme = require("./fetchMeme");
const { EmbedBuilder } = require("discord.js");

let interval = null;
let channelId = null;
let seconds = 3600; // default 1 hour

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
      .setFooter({ text: `r/${meme.subreddit}` });

    channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("AutoPoster Error:", err);
  }
}

/**
 * Start auto-poster
 * @param {import('discord.js').Client} client 
 * @param {string} id Channel ID
 * @param {number} sec Interval in seconds
 */
function startAutoPoster(client, id, sec = 3600) {
  if (!client || !id) return false;

  channelId = id;
  seconds = sec;

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
 */
function updateInterval(client, ms, id) {
  if (ms < 10000) return false; // min 10s

  if (id) channelId = id; // allow updating channel

  if (!channelId) return false;

  seconds = Math.floor(ms / 1000);
  startAutoPoster(client, channelId, seconds);
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
  };
}

module.exports = {
  startAutoPoster,
  stopAutoPoster,
  updateInterval,
  getAutoPosterState,
};

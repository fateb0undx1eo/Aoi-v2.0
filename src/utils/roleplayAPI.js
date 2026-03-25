const APIClient = require('./apiClient');
const logger = require('./winstonLogger');

// Waifu.it API - High quality anime GIFs with extensive collection
const waifuAPI = new APIClient('https://waifu.it/api/v4', {
  name: 'WaifuIt',
  retries: 3,
  timeout: 5000,
  cacheType: 'short', // Short cache since we want variety
  cacheTTL: 30 // 30 seconds
});

// Map our action names to waifu.it endpoints
const ACTION_ENDPOINTS = {
  // Actions with target
  hug: '/hug',
  kiss: '/kiss',
  pat: '/pat',
  wave: '/wave',
  poke: '/poke',
  cuddle: '/cuddle',
  slap: '/slap',
  kick: '/kick',
  punch: '/punch',
  feed: '/feed',
  tickle: '/tickle',
  bite: '/bite',
  highfive: '/highfive',
  bonk: '/bonk',
  lick: '/lick',
  bully: '/bully',
  kill: '/kill',
  love: '/love',
  nuzzle: '/nuzzle',
  
  // Solo actions
  cry: '/cry',
  smile: '/smile',
  dance: '/dance',
  happy: '/happy',
  blush: '/blush',
  wink: '/wink',
  bored: '/bored',
  run: '/run',
  facepalm: '/facepalm',
  yawn: '/yawn',
  baka: '/baka',
  laugh: '/laugh',
  dab: '/dab',
  cringe: '/cringe',
  angry: '/angry',
  chase: '/chase',
  cheer: '/cheer',
  
  // Greetings
  hi: '/hi',
  bye: '/bye',
  yes: '/yes',
  
  // Special
  waifu: '/waifu',
  husbando: '/husbando'
};

// Actions that don't have direct waifu.it endpoints - use alternatives
const FALLBACK_ACTIONS = {
  peck: '/kiss',  // Use kiss as fallback
  shoot: '/punch', // Use punch as fallback
  handshake: '/highfive', // Use highfive as fallback
  tableflip: '/angry', // Use angry as fallback
  thumbsup: '/happy', // Use happy as fallback
  yeet: '/kick', // Use kick as fallback
  handhold: '/cuddle', // Use cuddle as fallback
  pout: '/blush', // Use blush as fallback
  think: '/bored', // Use bored as fallback
  nope: '/facepalm', // Use facepalm as fallback
  nod: '/yes', // Use yes as fallback
  sleep: '/bored', // Use bored as fallback
  shrug: '/bored', // Use bored as fallback
  lurk: '/bored', // Use bored as fallback
  smug: '/smile', // Use smile as fallback
  stare: '/bored', // Use bored as fallback
  nom: '/happy' // Use happy as fallback
};

/**
 * Get roleplay GIF for an action
 * @param {string} action - Action name (hug, kiss, etc.)
 * @returns {Promise<string>} GIF URL
 */
async function getRoleplayGIF(action) {
  try {
    const endpoint = ACTION_ENDPOINTS[action] || FALLBACK_ACTIONS[action];
    
    if (!endpoint) {
      logger.warn(`No endpoint found for roleplay action: ${action}`);
      // Return a default cute anime GIF
      return 'https://waifu.it/api/v4/wave';
    }
    
    // Waifu.it returns data in format: { url: "gif_url" }
    const data = await waifuAPI.get(endpoint, { skipCache: true });
    
    if (!data || !data.url) {
      throw new Error('Invalid API response');
    }
    
    return data.url;
    
  } catch (error) {
    logger.error(`Failed to fetch roleplay GIF for ${action}:`, error);
    
    // Fallback to a default image
    return 'https://media.tenor.com/images/503c9c7bf7e4c5f0c5d8f5e5c5f0c5d8/tenor.gif';
  }
}

/**
 * Check if action is supported
 * @param {string} action - Action name
 * @returns {boolean} True if supported
 */
function isActionSupported(action) {
  return !!(ACTION_ENDPOINTS[action] || FALLBACK_ACTIONS[action]);
}

/**
 * Get all supported actions
 * @returns {string[]} Array of action names
 */
function getSupportedActions() {
  return Object.keys(ACTION_ENDPOINTS);
}

module.exports = {
  getRoleplayGIF,
  isActionSupported,
  getSupportedActions
};

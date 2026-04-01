const APIClient = require('./apiClient');
const logger = require('./winstonLogger');

// Waifu.pics API - Higher quality anime GIFs
const waifuAPI = new APIClient('https://api.waifu.pics', {
  name: 'WaifuPics',
  retries: 3,
  timeout: 5000,
  cacheType: 'short', // Short cache since we want variety
  cacheTTL: 30 // 30 seconds
});

// Map our action names to waifu.pics endpoints
const ACTION_ENDPOINTS = {
  // Actions with target
  hug: '/sfw/hug',
  kiss: '/sfw/kiss',
  pat: '/sfw/pat',
  wave: '/sfw/wave',
  poke: '/sfw/poke',
  cuddle: '/sfw/cuddle',
  slap: '/sfw/slap',
  kick: '/sfw/kick',
  punch: '/sfw/punch',
  feed: '/sfw/feed',
  tickle: '/sfw/tickle',
  bite: '/sfw/bite',
  yeet: '/sfw/yeet',
  highfive: '/sfw/highfive',
  handhold: '/sfw/handhold',
  bonk: '/sfw/bonk',
  
  // Solo actions
  cry: '/sfw/cry',
  smile: '/sfw/smile',
  dance: '/sfw/dance',
  happy: '/sfw/happy',
  blush: '/sfw/blush',
  wink: '/sfw/wink',
  pout: '/sfw/pout',
  think: '/sfw/think',
  nope: '/sfw/nope',
  bored: '/sfw/bored',
  nod: '/sfw/nod',
  sleep: '/sfw/sleep',
  shrug: '/sfw/shrug',
  laugh: '/sfw/laugh',
  lurk: '/sfw/lurk',
  run: '/sfw/run',
  facepalm: '/sfw/facepalm',
  smug: '/sfw/smug',
  yawn: '/sfw/yawn',
  baka: '/sfw/baka',
  stare: '/sfw/stare',
  nom: '/sfw/nom',
  
  // Special
  waifu: '/sfw/waifu',
  husbando: '/sfw/husbando'
};

// Actions that don't have direct waifu.pics endpoints - use alternatives
const FALLBACK_ACTIONS = {
  peck: '/sfw/kiss',  // Use kiss as fallback
  shoot: '/sfw/punch', // Use punch as fallback
  handshake: '/sfw/highfive', // Use highfive as fallback
  tableflip: '/sfw/angry', // Use angry as fallback
  thumbsup: '/sfw/happy', // Use happy as fallback
  angry: '/sfw/angry'
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
      return 'https://api.waifu.pics/sfw/wave';
    }
    
    // Add random query param to bypass cache for variety
    const randomParam = `?r=${Math.random().toString(36).substring(7)}`;
    const data = await waifuAPI.get(endpoint + randomParam, { skipCache: true });
    
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

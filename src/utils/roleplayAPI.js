const APIClient = require('./apiClient');
const logger = require('./winstonLogger');

// Nekos.best API - Free, high quality anime GIFs with no authentication required
const nekosAPI = new APIClient('https://nekos.best/api/v2', {
  name: 'NekosBest',
  retries: 3,
  timeout: 5000,
  cacheType: 'short', // Short cache since we want variety
  cacheTTL: 30 // 30 seconds
});

// Map our action names to nekos.best endpoints
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

// Actions that don't have direct nekos.best endpoints - use alternatives
const FALLBACK_ACTIONS = {
  peck: '/kiss',  // Use kiss as fallback
  shoot: '/punch', // Use punch as fallback
  handshake: '/highfive', // Use highfive as fallback
  tableflip: '/pout', // Use pout as fallback
  thumbsup: '/happy', // Use happy as fallback
  yeet: '/kick', // Use kick as fallback
  handhold: '/cuddle', // Use cuddle as fallback
  think: '/think', // Nekos.best has think
  nope: '/facepalm', // Use facepalm as fallback
  nod: '/nod', // Nekos.best has nod
  sleep: '/sleep', // Nekos.best has sleep
  lurk: '/lurk', // Nekos.best has lurk
  smug: '/smug', // Nekos.best has smug
  stare: '/stare', // Nekos.best has stare
  nom: '/nom' // Nekos.best has nom
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
      const data = await nekosAPI.get('/wave', { skipCache: true });
      return data.results[0].url;
    }
    
    // Nekos.best returns data in format: { results: [{ url: "gif_url", anime_name: "..." }] }
    const data = await nekosAPI.get(endpoint, { skipCache: true });
    
    if (!data || !data.results || !data.results[0] || !data.results[0].url) {
      throw new Error('Invalid API response');
    }
    
    return data.results[0].url;
    
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

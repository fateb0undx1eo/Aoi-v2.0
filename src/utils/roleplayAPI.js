const APIClient = require('./apiClient');
const logger = require('./winstonLogger');

// Waifu.pics API - Free, high quality anime GIFs with no authentication required
const waifuPicsAPI = new APIClient('https://api.waifu.pics/sfw', {
  name: 'WaifuPics',
  retries: 3,
  timeout: 5000,
  cacheType: 'short', // Short cache since we want variety
  cacheTTL: 30 // 30 seconds
});

// Map our action names to waifu.pics endpoints
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
  bite: '/bite',
  highfive: '/highfive',
  bonk: '/bonk',
  lick: '/lick',
  bully: '/bully',
  kill: '/kill',
  
  // Solo actions
  cry: '/cry',
  smile: '/smile',
  dance: '/dance',
  happy: '/happy',
  blush: '/blush',
  wink: '/wink',
  yawn: '/yawn',
  
  // Special
  waifu: '/waifu',
  nom: '/nom'
};
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

// Actions that don't have direct waifu.pics endpoints - use alternatives
const FALLBACK_ACTIONS = {
  peck: '/kiss',  // Use kiss as fallback
  shoot: '/kill', // Use kill as fallback
  handshake: '/highfive', // Use highfive as fallback
  tableflip: '/bonk', // Use bonk as fallback
  thumbsup: '/happy', // Use happy as fallback
  yeet: '/kick', // Use kick as fallback
  handhold: '/cuddle', // Use cuddle as fallback
  pout: '/blush', // Use blush as fallback
  think: '/smile', // Use smile as fallback
  nope: '/bonk', // Use bonk as fallback
  nod: '/wave', // Use wave as fallback
  sleep: '/yawn', // Use yawn as fallback
  shrug: '/smile', // Use smile as fallback
  lurk: '/smile', // Use smile as fallback
  smug: '/smile', // Use smile as fallback
  stare: '/smile', // Use smile as fallback
  husbando: '/waifu', // Use waifu for husbando
  tickle: '/poke', // Use poke as fallback
  feed: '/nom', // Use nom as fallback
  punch: '/slap', // Use slap as fallback
  run: '/dance', // Use dance as fallback
  facepalm: '/bonk', // Use bonk as fallback
  bored: '/yawn', // Use yawn as fallback
  angry: '/bonk', // Use bonk as fallback
  laugh: '/smile' // Use smile as fallback
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
      const data = await waifuPicsAPI.get('/wave', { skipCache: true });
      return data.url;
    }
    
    // Waifu.pics returns data in format: { url: "gif_url" }
    const data = await waifuPicsAPI.get(endpoint, { skipCache: true });
    
    if (!data || !data.url) {
      throw new Error('Invalid API response');
    }
    
    return data.url;
    
  } catch (error) {
    logger.error(`Failed to fetch roleplay GIF for ${action}:`, error);
    
    // Fallback to a default image
    return 'https://i.waifu.pics/A3ljLak.gif';
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

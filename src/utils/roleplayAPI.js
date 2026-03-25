const APIClient = require('./apiClient');
const logger = require('./winstonLogger');

// Multiple API clients for comprehensive coverage
const waifuPicsAPI = new APIClient('https://api.waifu.pics/sfw', {
  name: 'WaifuPics',
  retries: 3,
  timeout: 5000,
  cacheType: 'short',
  cacheTTL: 30
});

const nekosAPI = new APIClient('https://nekos.best/api/v2', {
  name: 'NekosBest',
  retries: 3,
  timeout: 5000,
  cacheType: 'short',
  cacheTTL: 30
});

// API endpoint mapping with source specification
const API_ENDPOINTS = {
  // Waifu.pics endpoints (high quality roleplay GIFs)
  hug: { api: 'waifupics', endpoint: '/hug' },
  kiss: { api: 'waifupics', endpoint: '/kiss' },
  pat: { api: 'waifupics', endpoint: '/pat' },
  wave: { api: 'waifupics', endpoint: '/wave' },
  poke: { api: 'waifupics', endpoint: '/poke' },
  cuddle: { api: 'waifupics', endpoint: '/cuddle' },
  slap: { api: 'waifupics', endpoint: '/slap' },
  kick: { api: 'waifupics', endpoint: '/kick' },
  bite: { api: 'waifupics', endpoint: '/bite' },
  highfive: { api: 'waifupics', endpoint: '/highfive' },
  bonk: { api: 'waifupics', endpoint: '/bonk' },
  lick: { api: 'waifupics', endpoint: '/lick' },
  bully: { api: 'waifupics', endpoint: '/bully' },
  kill: { api: 'waifupics', endpoint: '/kill' },
  cry: { api: 'waifupics', endpoint: '/cry' },
  smile: { api: 'waifupics', endpoint: '/smile' },
  dance: { api: 'waifupics', endpoint: '/dance' },
  happy: { api: 'waifupics', endpoint: '/happy' },
  blush: { api: 'waifupics', endpoint: '/blush' },
  wink: { api: 'waifupics', endpoint: '/wink' },
  yawn: { api: 'waifupics', endpoint: '/yawn' },
  nom: { api: 'waifupics', endpoint: '/nom' },
  waifu: { api: 'waifupics', endpoint: '/waifu' },
  
  // Nekos.best endpoints (additional actions)
  baka: { api: 'nekos', endpoint: '/baka' },
  think: { api: 'nekos', endpoint: '/think' },
  pout: { api: 'nekos', endpoint: '/pout' },
  shrug: { api: 'nekos', endpoint: '/shrug' },
  sleep: { api: 'nekos', endpoint: '/sleep' },
  stare: { api: 'nekos', endpoint: '/stare' },
  smug: { api: 'nekos', endpoint: '/smug' },
  nod: { api: 'nekos', endpoint: '/nod' },
  nope: { api: 'nekos', endpoint: '/nope' },
  handshake: { api: 'nekos', endpoint: '/handshake' },
  lurk: { api: 'nekos', endpoint: '/lurk' },
  facepalm: { api: 'nekos', endpoint: '/facepalm' },
  laugh: { api: 'nekos', endpoint: '/laugh' },
  feed: { api: 'nekos', endpoint: '/feed' },
  tickle: { api: 'nekos', endpoint: '/tickle' },
  punch: { api: 'nekos', endpoint: '/punch' },
  shoot: { api: 'nekos', endpoint: '/shoot' },
  husbando: { api: 'nekos', endpoint: '/husbando' }
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

// Fallback mappings for actions not in primary APIs
const FALLBACK_ACTIONS = {
  peck: { api: 'waifupics', endpoint: '/kiss' },
  yeet: { api: 'waifupics', endpoint: '/kick' },
  handhold: { api: 'waifupics', endpoint: '/cuddle' },
  tableflip: { api: 'nekos', endpoint: '/pout' },
  thumbsup: { api: 'waifupics', endpoint: '/happy' },
  run: { api: 'waifupics', endpoint: '/dance' },
  bored: { api: 'nekos', endpoint: '/sleep' },
  angry: { api: 'waifupics', endpoint: '/bonk' }
};

/**
 * Get roleplay GIF for an action
 * @param {string} action - Action name (hug, kiss, etc.)
 * @returns {Promise<string>} GIF URL
 */
async function getRoleplayGIF(action) {
  try {
    const config = API_ENDPOINTS[action] || FALLBACK_ACTIONS[action];
    
    if (!config) {
      logger.warn(`No endpoint found for roleplay action: ${action}`);
      // Return a default cute anime GIF
      const data = await waifuPicsAPI.get('/wave', { skipCache: true });
      return data.url;
    }
    
    // Route to appropriate API based on config
    if (config.api === 'waifupics') {
      const data = await waifuPicsAPI.get(config.endpoint, { skipCache: true });
      if (!data || !data.url) {
        throw new Error('Invalid API response from waifu.pics');
      }
      return data.url;
    } else if (config.api === 'nekos') {
      const data = await nekosAPI.get(config.endpoint, { skipCache: true });
      if (!data || !data.results || !data.results[0] || !data.results[0].url) {
        throw new Error('Invalid API response from nekos.best');
      }
      return data.results[0].url;
    }
    
    throw new Error('Unknown API source');
    
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
  return !!(API_ENDPOINTS[action] || FALLBACK_ACTIONS[action]);
}

/**
 * Get all supported actions
 * @returns {string[]} Array of action names
 */
function getSupportedActions() {
  return Object.keys(API_ENDPOINTS);
}

module.exports = {
  getRoleplayGIF,
  isActionSupported,
  getSupportedActions
};

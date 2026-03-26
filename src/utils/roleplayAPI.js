const APIClient = require('./apiClient');
const logger = require('./winstonLogger');

// Three API clients for comprehensive coverage
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

const purrBotAPI = new APIClient('https://api.purrbot.site/v2/img/sfw', {
  name: 'PurrBot',
  retries: 3,
  timeout: 5000,
  cacheType: 'short',
  cacheTTL: 30
});

// Complete API endpoint mapping - NO FALLBACKS, each command has its own real endpoint
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
  cry: { api: 'waifupics', endpoint: '/cry' },
  smile: { api: 'waifupics', endpoint: '/smile' },
  dance: { api: 'waifupics', endpoint: '/dance' },
  happy: { api: 'waifupics', endpoint: '/happy' },
  blush: { api: 'waifupics', endpoint: '/blush' },
  wink: { api: 'waifupics', endpoint: '/wink' },
  yawn: { api: 'waifupics', endpoint: '/yawn' },
  nom: { api: 'waifupics', endpoint: '/nom' },
  waifu: { api: 'waifupics', endpoint: '/waifu' },
  
  // Nekos.best GIF endpoints
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
  handhold: { api: 'nekos', endpoint: '/handhold' },
  lurk: { api: 'nekos', endpoint: '/lurk' },
  facepalm: { api: 'nekos', endpoint: '/facepalm' },
  laugh: { api: 'nekos', endpoint: '/laugh' },
  feed: { api: 'nekos', endpoint: '/feed' },
  tickle: { api: 'nekos', endpoint: '/tickle' },
  punch: { api: 'nekos', endpoint: '/punch' },
  shoot: { api: 'nekos', endpoint: '/shoot' },
  yeet: { api: 'nekos', endpoint: '/yeet' },
  peck: { api: 'nekos', endpoint: '/peck' },
  tableflip: { api: 'nekos', endpoint: '/tableflip' },
  thumbsup: { api: 'nekos', endpoint: '/thumbsup' },
  run: { api: 'nekos', endpoint: '/run' },
  bored: { api: 'nekos', endpoint: '/bored' },
  husbando: { api: 'nekos', endpoint: '/husbando' },
  
  // PurrBot endpoints (additional coverage)
  angry: { api: 'purrbot', endpoint: '/angry/gif' }
};

/**
 * Get roleplay GIF for an action
 * @param {string} action - Action name (hug, kiss, etc.)
 * @returns {Promise<string>} GIF URL
 */
async function getRoleplayGIF(action) {
  try {
    const config = API_ENDPOINTS[action];
    
    if (!config) {
      logger.warn(`No endpoint found for roleplay action: ${action}`);
      throw new Error(`Unsupported action: ${action}`);
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
      
    } else if (config.api === 'purrbot') {
      const data = await purrBotAPI.get(config.endpoint, { skipCache: true });
      if (!data || !data.link) {
        throw new Error('Invalid API response from PurrBot');
      }
      return data.link;
    }
    
    throw new Error('Unknown API source');
    
  } catch (error) {
    logger.error(`Failed to fetch roleplay GIF for ${action}:`, error);
    throw error;
  }
}

/**
 * Check if action is supported
 * @param {string} action - Action name
 * @returns {boolean} True if supported
 */
function isActionSupported(action) {
  return !!API_ENDPOINTS[action];
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

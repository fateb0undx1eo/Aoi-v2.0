const NodeCache = require('node-cache');
const logger = require('./winstonLogger');

// Create cache instances with different TTLs
const caches = {
  // Short-lived cache (1 minute) - for frequently changing data
  short: new NodeCache({ stdTTL: 60, checkperiod: 120 }),
  
  // Medium cache (5 minutes) - for API responses
  medium: new NodeCache({ stdTTL: 300, checkperiod: 600 }),
  
  // Long cache (1 hour) - for rarely changing data
  long: new NodeCache({ stdTTL: 3600, checkperiod: 7200 }),
  
  // User data cache (10 minutes)
  user: new NodeCache({ stdTTL: 600, checkperiod: 1200 })
};

// Cache statistics
let stats = {
  hits: 0,
  misses: 0,
  sets: 0
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @param {string} type - Cache type (short, medium, long, user)
 * @returns {any} Cached value or undefined
 */
function get(key, type = 'medium') {
  const cache = caches[type];
  if (!cache) {
    logger.warn(`Invalid cache type: ${type}`);
    return undefined;
  }
  
  const value = cache.get(key);
  if (value !== undefined) {
    stats.hits++;
    logger.debug(`Cache hit: ${key} (${type})`);
  } else {
    stats.misses++;
    logger.debug(`Cache miss: ${key} (${type})`);
  }
  
  return value;
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {string} type - Cache type
 * @param {number} ttl - Custom TTL in seconds (optional)
 * @returns {boolean} Success
 */
function set(key, value, type = 'medium', ttl = null) {
  const cache = caches[type];
  if (!cache) {
    logger.warn(`Invalid cache type: ${type}`);
    return false;
  }
  
  const success = ttl ? cache.set(key, value, ttl) : cache.set(key, value);
  if (success) {
    stats.sets++;
    logger.debug(`Cache set: ${key} (${type})`);
  }
  
  return success;
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @param {string} type - Cache type
 * @returns {number} Number of deleted entries
 */
function del(key, type = 'medium') {
  const cache = caches[type];
  if (!cache) {
    logger.warn(`Invalid cache type: ${type}`);
    return 0;
  }
  
  return cache.del(key);
}

/**
 * Get or fetch value (cache-aside pattern)
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch value if not cached
 * @param {string} type - Cache type
 * @param {number} ttl - Custom TTL
 * @returns {Promise<any>} Cached or fetched value
 */
async function getOrFetch(key, fetchFn, type = 'medium', ttl = null) {
  const cached = get(key, type);
  if (cached !== undefined) {
    return cached;
  }
  
  try {
    const value = await fetchFn();
    set(key, value, type, ttl);
    return value;
  } catch (error) {
    logger.error(`Error fetching value for key ${key}:`, error);
    throw error;
  }
}

/**
 * Clear all caches
 */
function clearAll() {
  Object.values(caches).forEach(cache => cache.flushAll());
  logger.info('All caches cleared');
}

/**
 * Clear specific cache type
 * @param {string} type - Cache type to clear
 */
function clear(type = 'medium') {
  const cache = caches[type];
  if (cache) {
    cache.flushAll();
    logger.info(`Cache cleared: ${type}`);
  }
}

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
function getStats() {
  const cacheStats = {};
  Object.entries(caches).forEach(([type, cache]) => {
    cacheStats[type] = cache.getStats();
  });
  
  return {
    ...stats,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    caches: cacheStats
  };
}

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @param {string} type - Cache type
 * @returns {boolean} True if key exists
 */
function has(key, type = 'medium') {
  const cache = caches[type];
  return cache ? cache.has(key) : false;
}

module.exports = {
  get,
  set,
  del,
  getOrFetch,
  clearAll,
  clear,
  getStats,
  has,
  caches
};

const logger = require('./winstonLogger');

/**
 * Command cache for lazy loading
 */
const commandCache = new Map();

/**
 * Lazy load command file
 * @param {string} category - Command category
 * @param {string} name - Command name
 * @returns {Promise<object>} Command module
 */
async function lazyLoadCommand(category, name) {
  const cacheKey = `${category}:${name}`;
  
  if (commandCache.has(cacheKey)) {
    return commandCache.get(cacheKey);
  }
  
  try {
    const command = require(`../commands/${category}/${name}`);
    commandCache.set(cacheKey, command);
    logger.debug(`Lazy loaded command: ${cacheKey}`);
    return command;
  } catch (error) {
    logger.error(`Failed to lazy load command ${cacheKey}:`, error);
    throw error;
  }
}

/**
 * Clear command cache (useful for hot reload)
 * @param {string} category - Optional category to clear
 * @param {string} name - Optional command name to clear
 */
function clearCommandCache(category = null, name = null) {
  if (category && name) {
    const cacheKey = `${category}:${name}`;
    commandCache.delete(cacheKey);
    logger.debug(`Cleared command cache: ${cacheKey}`);
  } else if (category) {
    for (const key of commandCache.keys()) {
      if (key.startsWith(`${category}:`)) {
        commandCache.delete(key);
      }
    }
    logger.debug(`Cleared command cache for category: ${category}`);
  } else {
    commandCache.clear();
    logger.debug('Cleared all command cache');
  }
}

/**
 * Get command cache statistics
 * @returns {object} Cache stats
 */
function getCommandCacheStats() {
  return {
    size: commandCache.size,
    commands: Array.from(commandCache.keys())
  };
}

/**
 * Database query optimization helpers
 */
const dbOptimization = {
  /**
   * Execute lean query (returns plain objects, faster)
   * @param {Query} query - Mongoose query
   * @returns {Promise<any>} Query result
   */
  async lean(query) {
    return query.lean().exec();
  },

  /**
   * Execute query with selected fields only
   * @param {Query} query - Mongoose query
   * @param {string|object} fields - Fields to select
   * @returns {Promise<any>} Query result
   */
  async select(query, fields) {
    return query.select(fields).lean().exec();
  },

  /**
   * Batch find by IDs
   * @param {Model} model - Mongoose model
   * @param {string[]} ids - Array of IDs
   * @param {string|object} fields - Optional fields to select
   * @returns {Promise<any[]>} Array of documents
   */
  async batchFindByIds(model, ids, fields = null) {
    const query = model.find({ _id: { $in: ids } });
    if (fields) query.select(fields);
    return query.lean().exec();
  },

  /**
   * Batch update
   * @param {Model} model - Mongoose model
   * @param {object[]} updates - Array of {filter, update} objects
   * @returns {Promise<void>}
   */
  async batchUpdate(model, updates) {
    const bulkOps = updates.map(({ filter, update }) => ({
      updateOne: {
        filter,
        update,
        upsert: false
      }
    }));
    
    if (bulkOps.length === 0) return;
    
    await model.bulkWrite(bulkOps);
    logger.debug(`Batch updated ${bulkOps.length} documents in ${model.modelName}`);
  },

  /**
   * Batch upsert
   * @param {Model} model - Mongoose model
   * @param {object[]} operations - Array of {filter, update} objects
   * @returns {Promise<void>}
   */
  async batchUpsert(model, operations) {
    const bulkOps = operations.map(({ filter, update }) => ({
      updateOne: {
        filter,
        update,
        upsert: true
      }
    }));
    
    if (bulkOps.length === 0) return;
    
    await model.bulkWrite(bulkOps);
    logger.debug(`Batch upserted ${bulkOps.length} documents in ${model.modelName}`);
  },

  /**
   * Count with cache
   * @param {Model} model - Mongoose model
   * @param {object} filter - Query filter
   * @param {number} cacheTTL - Cache TTL in seconds
   * @returns {Promise<number>} Document count
   */
  async cachedCount(model, filter = {}, cacheTTL = 60) {
    const cache = require('./cache');
    const cacheKey = `count:${model.modelName}:${JSON.stringify(filter)}`;
    
    return cache.getOrFetch(
      cacheKey,
      () => model.countDocuments(filter).exec(),
      'medium',
      cacheTTL
    );
  }
};

/**
 * Memory optimization helpers
 */
const memoryOptimization = {
  /**
   * Chunk array for batch processing
   * @param {Array} array - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array[]} Array of chunks
   */
  chunkArray(array, size = 100) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Process array in batches
   * @param {Array} array - Array to process
   * @param {Function} processor - Async function to process each item
   * @param {number} batchSize - Batch size
   * @returns {Promise<any[]>} Results
   */
  async processBatches(array, processor, batchSize = 100) {
    const results = [];
    const chunks = this.chunkArray(array, batchSize);
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(chunk.map(processor));
      results.push(...chunkResults);
    }
    
    return results;
  },

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in ms
   * @returns {Function} Throttled function
   */
  throttle(func, limit = 1000) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

/**
 * Get performance metrics
 * @returns {object} Performance metrics
 */
function getPerformanceMetrics() {
  const used = process.memoryUsage();
  return {
    memory: {
      rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(used.external / 1024 / 1024)} MB`
    },
    uptime: `${Math.floor(process.uptime())} seconds`,
    commandCache: getCommandCacheStats()
  };
}

module.exports = {
  lazyLoadCommand,
  clearCommandCache,
  getCommandCacheStats,
  dbOptimization,
  memoryOptimization,
  getPerformanceMetrics
};

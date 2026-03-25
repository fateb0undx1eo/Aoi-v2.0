const fetch = require('node-fetch');
const logger = require('./winstonLogger');
const cache = require('./cache');

class APIClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.retries = options.retries || 3;
    this.timeout = options.timeout || 5000;
    this.cacheType = options.cacheType || 'medium';
    this.cacheTTL = options.cacheTTL || null;
    this.name = options.name || 'API';
  }

  /**
   * Make GET request with retry and caching
   * @param {string} endpoint - API endpoint
   * @param {object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `api:${this.name}:${endpoint}`;
    
    // Check cache first
    if (!options.skipCache) {
      const cached = cache.get(cacheKey, this.cacheType);
      if (cached) {
        logger.debug(`API cache hit: ${this.name} ${endpoint}`);
        return cached;
      }
    }
    
    // Fetch with retry logic
    const startTime = Date.now();
    let lastError;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'User-Agent': 'Discord Bot',
            ...options.headers
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const duration = Date.now() - startTime;
        
        // Log successful API call
        logger.api(this.name, endpoint, response.status, duration);
        
        // Cache successful response
        if (!options.skipCache) {
          cache.set(cacheKey, data, this.cacheType, this.cacheTTL);
        }
        
        return data;
        
      } catch (error) {
        lastError = error;
        
        if (error.name === 'AbortError') {
          logger.warn(`API timeout: ${this.name} ${endpoint} (attempt ${attempt}/${this.retries})`);
        } else {
          logger.warn(`API error: ${this.name} ${endpoint} - ${error.message} (attempt ${attempt}/${this.retries})`);
        }
        
        // Don't retry on last attempt
        if (attempt === this.retries) break;
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All retries failed
    const duration = Date.now() - startTime;
    logger.error(`API failed after ${this.retries} attempts: ${this.name} ${endpoint}`, {
      error: lastError.message,
      duration
    });
    
    throw lastError;
  }

  /**
   * Make POST request
   * @param {string} endpoint - API endpoint
   * @param {object} body - Request body
   * @param {object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, body, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Discord Bot',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      logger.api(this.name, endpoint, response.status, duration);
      
      return data;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`API POST failed: ${this.name} ${endpoint}`, {
        error: error.message,
        duration
      });
      throw error;
    }
  }

  /**
   * Clear cache for this API
   */
  clearCache() {
    // Clear all keys starting with this API's prefix
    const prefix = `api:${this.name}:`;
    // Note: node-cache doesn't have prefix deletion, so we clear the entire cache type
    cache.clear(this.cacheType);
    logger.info(`Cache cleared for ${this.name}`);
  }
}

module.exports = APIClient;

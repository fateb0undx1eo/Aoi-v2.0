const BotConfigSchema = require('../schemas/botConfigSchema');

/**
 * Rate limiter for Discord API operations
 * Enforces Discord's rate limits: username (2/hour), avatar (2/hour), banner (2/hour), presence (5/minute)
 */
class RateLimiter {
    constructor() {
        // In-memory cache for fast access
        this.cache = new Map();
        
        // Rate limit configurations (per Discord API limits)
        this.limits = {
            username: { max: 2, window: 3600000 }, // 2 per hour
            avatar: { max: 2, window: 3600000 },   // 2 per hour
            banner: { max: 2, window: 3600000 },   // 2 per hour
            presence: { max: 5, window: 60000 }    // 5 per minute
        };

        // Sync cache to database every 5 minutes
        setInterval(() => this.syncToDatabase(), 300000);
    }

    /**
     * Check if operation is allowed under rate limit
     * @param {string} operation - Operation type (username, avatar, banner, presence)
     * @param {string} botId - Bot ID
     * @returns {Promise<Object>} - { allowed: boolean, retryAfter: number, remaining: number }
     */
    async checkLimit(operation, botId) {
        const limit = this.limits[operation];
        if (!limit) {
            return { allowed: true, retryAfter: 0, remaining: Infinity };
        }

        // Get operation history from cache or database
        const history = await this.getHistory(operation, botId);
        
        // Filter operations within the time window
        const now = Date.now();
        const recentOps = history.filter(timestamp => now - timestamp < limit.window);

        // Check if limit exceeded
        if (recentOps.length >= limit.max) {
            const oldestOp = Math.min(...recentOps);
            const retryAfter = Math.ceil((oldestOp + limit.window - now) / 1000);
            return {
                allowed: false,
                retryAfter: retryAfter,
                remaining: 0
            };
        }

        return {
            allowed: true,
            retryAfter: 0,
            remaining: limit.max - recentOps.length
        };
    }

    /**
     * Record an operation for rate limiting
     * @param {string} operation - Operation type
     * @param {string} botId - Bot ID
     */
    async recordOperation(operation, botId) {
        const key = `${botId}:${operation}`;
        const history = this.cache.get(key) || [];
        history.push(Date.now());
        this.cache.set(key, history);

        // Update database
        try {
            const config = await BotConfigSchema.findOne({ botId });
            if (config && config.rateLimits[operation]) {
                config.rateLimits[operation].lastChanged = new Date();
                config.rateLimits[operation].changesRemaining = 
                    this.limits[operation].max - history.filter(t => Date.now() - t < this.limits[operation].window).length;
                await config.save();
            }
        } catch (error) {
            console.error('Failed to update rate limit in database:', error);
        }
    }

    /**
     * Get remaining attempts for an operation
     * @param {string} operation - Operation type
     * @param {string} botId - Bot ID
     * @returns {Promise<number>} - Remaining attempts
     */
    async getRemainingAttempts(operation, botId) {
        const result = await this.checkLimit(operation, botId);
        return result.remaining;
    }

    /**
     * Reset rate limits (for testing or manual reset)
     * @param {string} botId - Bot ID
     */
    async resetLimits(botId) {
        // Clear cache
        for (const key of this.cache.keys()) {
            if (key.startsWith(botId)) {
                this.cache.delete(key);
            }
        }

        // Reset database
        try {
            const config = await BotConfigSchema.findOne({ botId });
            if (config) {
                config.rateLimits = {
                    username: { changesRemaining: 2 },
                    avatar: { changesRemaining: 2 },
                    banner: { changesRemaining: 2 }
                };
                await config.save();
            }
        } catch (error) {
            console.error('Failed to reset rate limits in database:', error);
        }
    }

    /**
     * Get operation history from cache or database
     * @param {string} operation - Operation type
     * @param {string} botId - Bot ID
     * @returns {Promise<Array<number>>} - Array of timestamps
     */
    async getHistory(operation, botId) {
        const key = `${botId}:${operation}`;
        
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        // Load from database
        try {
            const config = await BotConfigSchema.findOne({ botId });
            if (config && config.rateLimits[operation] && config.rateLimits[operation].lastChanged) {
                const lastChanged = config.rateLimits[operation].lastChanged.getTime();
                const now = Date.now();
                const limit = this.limits[operation];
                
                // If within window, reconstruct history based on remaining changes
                if (now - lastChanged < limit.window) {
                    const used = limit.max - (config.rateLimits[operation].changesRemaining || 0);
                    const history = Array(used).fill(lastChanged);
                    this.cache.set(key, history);
                    return history;
                }
            }
        } catch (error) {
            console.error('Failed to load rate limit history from database:', error);
        }

        return [];
    }

    /**
     * Sync cache to database periodically
     */
    async syncToDatabase() {
        for (const [key, history] of this.cache.entries()) {
            const [botId, operation] = key.split(':');
            const limit = this.limits[operation];
            if (!limit) continue;

            try {
                const config = await BotConfigSchema.findOne({ botId });
                if (config && config.rateLimits[operation]) {
                    const now = Date.now();
                    const recentOps = history.filter(t => now - t < limit.window);
                    
                    if (recentOps.length > 0) {
                        config.rateLimits[operation].lastChanged = new Date(Math.max(...recentOps));
                        config.rateLimits[operation].changesRemaining = limit.max - recentOps.length;
                        await config.save();
                    }
                }
            } catch (error) {
                console.error(`Failed to sync rate limit for ${key}:`, error);
            }
        }
    }
}

module.exports = RateLimiter;

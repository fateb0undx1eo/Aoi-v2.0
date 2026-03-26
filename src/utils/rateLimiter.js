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
    }

    /**
     * Get operation history from cache
     * @param {string} operation - Operation type
     * @param {string} botId - Bot ID
     * @returns {Promise<Array<number>>} - Array of timestamps
     */
    async getHistory(operation, botId) {
        const key = `${botId}:${operation}`;
        
        // Check cache
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        return [];
    }

    /**
     * Sync cache to database periodically (no-op now that botConfig is removed)
     */
    async syncToDatabase() {
        // No database sync needed anymore
    }
}

module.exports = RateLimiter;

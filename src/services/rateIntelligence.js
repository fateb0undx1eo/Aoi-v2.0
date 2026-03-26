const logger = require('../utils/winstonLogger');

class RateIntelligence {
    constructor() {
        // In-memory tracking: Map<guildId_userId, UserBehavior>
        this.userBehavior = new Map();
        
        // Cleanup interval: remove stale entries every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
        
        // Configuration
        this.config = {
            windowSize: 60000, // 1 minute window
            normalThreshold: 5, // commands per window for normal users
            spamThreshold: 10, // commands per window for spam detection
            baseDelay: 1000, // 1 second base delay
            maxDelay: 30000, // 30 seconds max delay
            decayRate: 0.1, // reputation recovery rate
            blockDuration: 60000 // 1 minute temporary block
        };
    }

    /**
     * Get user key for tracking
     */
    getUserKey(guildId, userId) {
        return `${guildId}_${userId}`;
    }

    /**
     * Get or create user behavior data
     */
    getUserBehavior(guildId, userId) {
        const key = this.getUserKey(guildId, userId);
        
        if (!this.userBehavior.has(key)) {
            this.userBehavior.set(key, {
                commandHistory: [],
                reputation: 1.0, // 1.0 = good, 0.0 = bad
                totalCommands: 0,
                lastCommand: 0,
                blockedUntil: 0,
                lastCleanup: Date.now()
            });
        }
        
        return this.userBehavior.get(key);
    }

    /**
     * Check if user should be rate limited
     * Returns: { allowed: boolean, delay: number, reason: string }
     */
    async checkRateLimit(guildId, userId, commandName) {
        const behavior = this.getUserBehavior(guildId, userId);
        const now = Date.now();

        // Check if user is temporarily blocked
        if (behavior.blockedUntil > now) {
            const remainingTime = Math.ceil((behavior.blockedUntil - now) / 1000);
            return {
                allowed: false,
                delay: behavior.blockedUntil - now,
                reason: `Temporarily blocked. Try again in ${remainingTime}s`
            };
        }

        // Clean old command history (outside window)
        const windowStart = now - this.config.windowSize;
        behavior.commandHistory = behavior.commandHistory.filter(
            cmd => cmd.timestamp > windowStart
        );

        // Add current command to history
        behavior.commandHistory.push({
            command: commandName,
            timestamp: now
        });
        behavior.totalCommands++;
        behavior.lastCommand = now;

        // Calculate command frequency
        const commandsInWindow = behavior.commandHistory.length;
        
        // Detect spam patterns
        const isSpamming = this.detectSpam(behavior);
        
        // Update reputation
        this.updateReputation(behavior, commandsInWindow, isSpamming);

        // Calculate delay based on behavior
        let delay = 0;
        let allowed = true;
        let reason = '';

        if (isSpamming) {
            // Severe spam: temporary block
            if (commandsInWindow > this.config.spamThreshold * 2) {
                behavior.blockedUntil = now + this.config.blockDuration;
                allowed = false;
                delay = this.config.blockDuration;
                reason = 'Spam detected. Temporarily blocked';
                
                logger.warn(`Rate limit: User ${userId} in guild ${guildId} temporarily blocked for spam`);
            }
            // Moderate spam: significant delay
            else if (commandsInWindow > this.config.spamThreshold) {
                delay = this.calculateDelay(behavior.reputation, commandsInWindow);
                reason = 'High command frequency detected';
                
                logger.info(`Rate limit: User ${userId} in guild ${guildId} delayed ${delay}ms`);
            }
            // Light spam: small delay
            else {
                delay = this.config.baseDelay;
                reason = 'Please slow down';
            }
        }
        // Normal usage: no delay
        else if (commandsInWindow <= this.config.normalThreshold) {
            delay = 0;
        }
        // Slightly elevated usage: minimal delay
        else {
            delay = Math.min(500, (commandsInWindow - this.config.normalThreshold) * 100);
        }

        return { allowed, delay, reason };
    }

    /**
     * Detect spam patterns
     */
    detectSpam(behavior) {
        const now = Date.now();
        const recentCommands = behavior.commandHistory.filter(
            cmd => cmd.timestamp > now - 10000 // Last 10 seconds
        );

        // Check for rapid repeated commands
        if (recentCommands.length >= 5) {
            const commands = recentCommands.map(c => c.command);
            const uniqueCommands = new Set(commands);
            
            // Same command repeated rapidly
            if (uniqueCommands.size === 1) {
                return true;
            }
        }

        // Check overall frequency
        if (behavior.commandHistory.length > this.config.spamThreshold) {
            return true;
        }

        return false;
    }

    /**
     * Update user reputation
     */
    updateReputation(behavior, commandsInWindow, isSpamming) {
        if (isSpamming) {
            // Decrease reputation for spam
            behavior.reputation = Math.max(0, behavior.reputation - 0.2);
        } else if (commandsInWindow <= this.config.normalThreshold) {
            // Slowly recover reputation for normal usage
            behavior.reputation = Math.min(1.0, behavior.reputation + this.config.decayRate);
        }
    }

    /**
     * Calculate delay based on reputation and frequency
     */
    calculateDelay(reputation, commandsInWindow) {
        // Lower reputation = longer delay
        const reputationMultiplier = 2 - reputation; // 1.0 to 2.0
        
        // More commands = longer delay
        const frequencyMultiplier = Math.min(
            commandsInWindow / this.config.normalThreshold,
            5
        );

        const delay = this.config.baseDelay * reputationMultiplier * frequencyMultiplier;
        
        return Math.min(delay, this.config.maxDelay);
    }

    /**
     * Apply delay if needed
     */
    async applyDelay(delay) {
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    /**
     * Cleanup stale entries
     */
    cleanup() {
        const now = Date.now();
        const staleThreshold = 10 * 60 * 1000; // 10 minutes

        for (const [key, behavior] of this.userBehavior.entries()) {
            if (now - behavior.lastCommand > staleThreshold) {
                this.userBehavior.delete(key);
            }
        }

        logger.info(`Rate intelligence cleanup: ${this.userBehavior.size} users tracked`);
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            trackedUsers: this.userBehavior.size,
            config: this.config
        };
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.userBehavior.clear();
    }
}

module.exports = new RateIntelligence();

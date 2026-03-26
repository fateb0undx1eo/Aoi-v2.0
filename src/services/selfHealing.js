const logger = require('../utils/winstonLogger');

class SelfHealing {
    constructor() {
        this.failedModules = new Map();
        this.retryQueue = [];
        this.stats = {
            totalFailures: 0,
            totalRetries: 0,
            totalRecoveries: 0,
            moduleRestarts: 0
        };
        
        // Configuration
        this.config = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            exponentialBase: 2
        };
    }

    /**
     * Wrap a risky operation with retry logic
     */
    async executeWithRetry(operation, options = {}) {
        const {
            maxRetries = this.config.maxRetries,
            operationName = 'unknown',
            fallback = null,
            silent = true
        } = options;

        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                
                if (attempt > 0) {
                    this.stats.totalRecoveries++;
                    logger.info(`Self-healing: ${operationName} recovered after ${attempt} retries`);
                }
                
                return result;
            } catch (error) {
                lastError = error;
                this.stats.totalFailures++;
                
                if (attempt < maxRetries) {
                    const delay = this.calculateBackoff(attempt);
                    this.stats.totalRetries++;
                    
                    logger.warn(`Self-healing: ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`, {
                        error: error.message
                    });
                    
                    await this.delay(delay);
                } else {
                    logger.error(`Self-healing: ${operationName} failed after ${maxRetries + 1} attempts`, {
                        error: error.message,
                        stack: error.stack
                    });
                }
            }
        }

        // All retries failed
        if (fallback) {
            logger.info(`Self-healing: Using fallback for ${operationName}`);
            return typeof fallback === 'function' ? fallback(lastError) : fallback;
        }

        if (silent) {
            return null;
        }

        throw lastError;
    }

    /**
     * Wrap database operations
     */
    async wrapDatabaseOperation(operation, options = {}) {
        return this.executeWithRetry(operation, {
            ...options,
            operationName: options.operationName || 'database operation',
            fallback: options.fallback || (() => {
                logger.warn('Database operation failed, using cache or default');
                return null;
            })
        });
    }

    /**
     * Wrap API calls
     */
    async wrapApiCall(operation, options = {}) {
        return this.executeWithRetry(operation, {
            ...options,
            operationName: options.operationName || 'API call',
            maxRetries: options.maxRetries || 5,
            fallback: options.fallback || (() => {
                logger.warn('API call failed, using cached data or default');
                return null;
            })
        });
    }

    /**
     * Wrap command execution
     */
    async wrapCommandExecution(command, interaction, options = {}) {
        try {
            await command.execute(interaction, interaction.client);
        } catch (error) {
            this.stats.totalFailures++;
            
            logger.error(`Self-healing: Command ${command.data?.name || 'unknown'} failed`, {
                error: error.message,
                stack: error.stack,
                userId: interaction.user?.id,
                guildId: interaction.guild?.id
            });

            // Try to respond to user gracefully
            const errorMessage = options.userMessage || 'An error occurred while processing your command. Please try again later.';
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: errorMessage,
                        ephemeral: true
                    });
                } else {
                    await interaction.followUp({
                        content: errorMessage,
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                logger.error('Self-healing: Failed to send error message to user', {
                    error: replyError.message
                });
            }

            // Track failed module
            this.trackFailedModule(command.data?.name || 'unknown', error);
        }
    }

    /**
     * Track failed modules for potential restart
     */
    trackFailedModule(moduleName, error) {
        if (!this.failedModules.has(moduleName)) {
            this.failedModules.set(moduleName, {
                failures: 0,
                lastFailure: Date.now(),
                errors: []
            });
        }

        const moduleData = this.failedModules.get(moduleName);
        moduleData.failures++;
        moduleData.lastFailure = Date.now();
        moduleData.errors.push({
            message: error.message,
            timestamp: Date.now()
        });

        // Keep only last 10 errors
        if (moduleData.errors.length > 10) {
            moduleData.errors.shift();
        }

        // If module fails too many times, log for manual intervention
        if (moduleData.failures >= 5) {
            logger.error(`Self-healing: Module ${moduleName} has failed ${moduleData.failures} times`, {
                recentErrors: moduleData.errors
            });
        }
    }

    /**
     * Calculate exponential backoff delay
     */
    calculateBackoff(attempt) {
        const delay = this.config.baseDelay * Math.pow(this.config.exponentialBase, attempt);
        return Math.min(delay, this.config.maxDelay);
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get health status
     */
    getHealthStatus() {
        const failedModulesList = Array.from(this.failedModules.entries()).map(([name, data]) => ({
            name,
            failures: data.failures,
            lastFailure: new Date(data.lastFailure).toISOString()
        }));

        return {
            stats: this.stats,
            failedModules: failedModulesList,
            healthy: failedModulesList.length === 0
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            totalFailures: 0,
            totalRetries: 0,
            totalRecoveries: 0,
            moduleRestarts: 0
        };
        this.failedModules.clear();
        logger.info('Self-healing: Statistics reset');
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            failedModulesCount: this.failedModules.size
        };
    }
}

module.exports = new SelfHealing();

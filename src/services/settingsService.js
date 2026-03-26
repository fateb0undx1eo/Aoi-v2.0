const GuildSettings = require('../schemas/guildSettingsSchema');
const logger = require('../utils/winstonLogger');

class SettingsService {
    constructor() {
        // In-memory cache for fast access
        this.cache = new Map();
        
        // Global override (optional)
        this.globalOverride = {
            rateIntelligence: null, // null = use guild settings
            selfHealing: null
        };
    }

    /**
     * Get settings for a guild
     */
    async getSettings(guildId) {
        // Check cache first
        if (this.cache.has(guildId)) {
            return this.cache.get(guildId);
        }

        try {
            let settings = await GuildSettings.findOne({ guildId });
            
            if (!settings) {
                // Create default settings
                settings = await GuildSettings.create({
                    guildId,
                    rateIntelligence: true,
                    selfHealing: true
                });
                
                logger.info(`Settings: Created default settings for guild ${guildId}`);
            }

            // Apply global overrides if set
            const finalSettings = {
                rateIntelligence: this.globalOverride.rateIntelligence !== null 
                    ? this.globalOverride.rateIntelligence 
                    : settings.rateIntelligence,
                selfHealing: this.globalOverride.selfHealing !== null 
                    ? this.globalOverride.selfHealing 
                    : settings.selfHealing
            };

            // Cache the settings
            this.cache.set(guildId, finalSettings);
            
            return finalSettings;
        } catch (error) {
            logger.error('Settings: Failed to get settings', { error: error.message, guildId });
            
            // Return defaults on error
            return {
                rateIntelligence: true,
                selfHealing: true
            };
        }
    }

    /**
     * Update settings for a guild
     */
    async updateSettings(guildId, updates) {
        try {
            const settings = await GuildSettings.findOneAndUpdate(
                { guildId },
                { 
                    ...updates,
                    updatedAt: Date.now()
                },
                { 
                    new: true, 
                    upsert: true 
                }
            );

            // Update cache
            this.cache.set(guildId, {
                rateIntelligence: settings.rateIntelligence,
                selfHealing: settings.selfHealing
            });

            logger.info(`Settings: Updated settings for guild ${guildId}`, updates);

            return settings;
        } catch (error) {
            logger.error('Settings: Failed to update settings', { 
                error: error.message, 
                guildId, 
                updates 
            });
            throw error;
        }
    }

    /**
     * Toggle a specific setting
     */
    async toggleSetting(guildId, settingName) {
        const currentSettings = await this.getSettings(guildId);
        const newValue = !currentSettings[settingName];
        
        await this.updateSettings(guildId, {
            [settingName]: newValue
        });

        return newValue;
    }

    /**
     * Check if rate intelligence is enabled
     */
    async isRateIntelligenceEnabled(guildId) {
        const settings = await this.getSettings(guildId);
        return settings.rateIntelligence;
    }

    /**
     * Check if self-healing is enabled
     */
    async isSelfHealingEnabled(guildId) {
        const settings = await this.getSettings(guildId);
        return settings.selfHealing;
    }

    /**
     * Set global override
     */
    setGlobalOverride(settingName, value) {
        if (this.globalOverride.hasOwnProperty(settingName)) {
            this.globalOverride[settingName] = value;
            
            // Clear cache to force reload
            this.cache.clear();
            
            logger.info(`Settings: Set global override ${settingName} = ${value}`);
        }
    }

    /**
     * Clear cache for a guild
     */
    clearCache(guildId) {
        if (guildId) {
            this.cache.delete(guildId);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Get all settings (for admin purposes)
     */
    async getAllSettings() {
        try {
            const allSettings = await GuildSettings.find({});
            return allSettings;
        } catch (error) {
            logger.error('Settings: Failed to get all settings', { error: error.message });
            return [];
        }
    }
}

module.exports = new SettingsService();

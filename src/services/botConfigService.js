const BotConfigSchema = require('../schemas/botConfigSchema');
const ConfigChangeLogSchema = require('../schemas/configChangeLogSchema');
const RateLimiter = require('../utils/rateLimiter');
const ImageValidator = require('../utils/imageValidator');

class BotConfigService {
    constructor(client) {
        this.client = client;
        this.rateLimiter = new RateLimiter();
        this.imageValidator = new ImageValidator();
        this.rotationInterval = null;
    }

    validatePermissions(userId) {
        const ownerId = process.env.BOT_OWNER_ID;
        if (!ownerId) throw new Error('BOT_OWNER_ID not configured');
        return userId === ownerId;
    }

    async getConfig() {
        let config = await BotConfigSchema.findOne({ botId: this.client.user.id });
        if (!config) {
            config = await BotConfigSchema.create({
                botId: this.client.user.id,
                presence: { status: 'online', activities: [], rotation: { enabled: false, interval: 10000, currentIndex: 0 } },
                appearance: {},
                rateLimits: { username: { changesRemaining: 2 }, avatar: { changesRemaining: 2 }, banner: { changesRemaining: 2 } }
            });
        }
        return config;
    }

    async logConfigChange(changeType, oldValue, newValue, userId, source, success, errorMessage) {
        try {
            await ConfigChangeLogSchema.create({ botId: this.client.user.id, changeType, oldValue, newValue, changedBy: userId, source, success, errorMessage });
        } catch (error) {
            console.error('Failed to log config change:', error);
        }
    }

    async restorePresenceRotation() {
        try {
            const config = await this.getConfig();
            if (config.presence.rotation.enabled) {
                this.startPresenceRotation(config);
            }
        } catch (error) {
            console.error('Error restoring presence rotation:', error);
        }
    }
}

module.exports = BotConfigService;

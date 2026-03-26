const BotConfigSchema = require('../schemas/botConfigSchema');
const ConfigChangeLogSchema = require('../schemas/configChangeLogSchema');
const RateLimiter = require('../utils/rateLimiter');
const ImageValidator = require('../utils/imageValidator');
const fetch = require('node-fetch');

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

    async getRateLimits() {
        const config = await this.getConfig();
        return {
            username: { remaining: config.rateLimits.username.changesRemaining, resetAt: config.rateLimits.username.resetAt },
            avatar: { remaining: config.rateLimits.avatar.changesRemaining, resetAt: config.rateLimits.avatar.resetAt },
            banner: { remaining: config.rateLimits.banner.changesRemaining, resetAt: config.rateLimits.banner.resetAt }
        };
    }

    async updatePresence(presenceConfig, userId, source = 'command') {
        try {
            if (!this.validatePermissions(userId)) {
                return { success: false, error: 'Insufficient permissions' };
            }
            const oldPresence = this.client.user.presence;
            this.client.user.setPresence({ status: presenceConfig.status, activities: presenceConfig.activities });
            const config = await this.getConfig();
            config.presence = presenceConfig;
            await config.save();
            await this.logConfigChange('presence', JSON.stringify(oldPresence), JSON.stringify(presenceConfig), userId, source, true);
            return { success: true, message: 'Presence updated successfully' };
        } catch (error) {
            console.error('Error updating presence:', error);
            await this.logConfigChange('presence', null, null, userId, source, false, error.message);
            return { success: false, error: error.message };
        }
    }

    async updateAvatar(imageUrl, userId, source = 'command') {
        try {
            if (!this.validatePermissions(userId)) {
                return { success: false, error: 'Insufficient permissions' };
            }
            const config = await this.getConfig();
            if (config.rateLimits.avatar.changesRemaining <= 0) {
                const resetAt = config.rateLimits.avatar.resetAt;
                const now = Date.now();
                if (resetAt && now < resetAt) {
                    const minutesLeft = Math.ceil((resetAt - now) / 60000);
                    return { success: false, error: `Avatar rate limit exceeded. Try again in ${minutesLeft} minutes.`, retryAfter: minutesLeft };
                } else {
                    config.rateLimits.avatar.changesRemaining = 2;
                    config.rateLimits.avatar.resetAt = null;
                }
            }
            const validation = await this.imageValidator.validate(imageUrl, {
                maxSize: 8 * 1024 * 1024,
                allowedFormats: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
                minDimensions: { width: 128, height: 128 }
            });
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }
            const oldAvatar = this.client.user.avatarURL();
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const buffer = await response.buffer();
            await this.client.user.setAvatar(buffer);
            config.rateLimits.avatar.changesRemaining -= 1;
            if (config.rateLimits.avatar.changesRemaining === 0) {
                config.rateLimits.avatar.resetAt = Date.now() + (60 * 60 * 1000);
            }
            config.appearance.avatarUrl = this.client.user.avatarURL();
            await config.save();
            await this.logConfigChange('avatar', oldAvatar, config.appearance.avatarUrl, userId, source, true);
            return { success: true, message: 'Avatar updated successfully', avatarUrl: config.appearance.avatarUrl };
        } catch (error) {
            console.error('Error updating avatar:', error);
            await this.logConfigChange('avatar', null, null, userId, source, false, error.message);
            return { success: false, error: error.message };
        }
    }

    async updateUsername(newName, userId, source = 'command') {
        try {
            if (!this.validatePermissions(userId)) {
                return { success: false, error: 'Insufficient permissions' };
            }
            const config = await this.getConfig();
            if (config.rateLimits.username.changesRemaining <= 0) {
                const resetAt = config.rateLimits.username.resetAt;
                const now = Date.now();
                if (resetAt && now < resetAt) {
                    const minutesLeft = Math.ceil((resetAt - now) / 60000);
                    return { success: false, error: `Username rate limit exceeded. Try again in ${minutesLeft} minutes.`, retryAfter: minutesLeft };
                } else {
                    config.rateLimits.username.changesRemaining = 2;
                    config.rateLimits.username.resetAt = null;
                }
            }
            const oldUsername = this.client.user.username;
            await this.client.user.setUsername(newName);
            config.rateLimits.username.changesRemaining -= 1;
            if (config.rateLimits.username.changesRemaining === 0) {
                config.rateLimits.username.resetAt = Date.now() + (60 * 60 * 1000);
            }
            await config.save();
            await this.logConfigChange('username', oldUsername, newName, userId, source, true);
            return { success: true, message: 'Username updated successfully' };
        } catch (error) {
            console.error('Error updating username:', error);
            await this.logConfigChange('username', null, null, userId, source, false, error.message);
            return { success: false, error: error.message };
        }
    }

    async updateBanner(imageUrl, userId, source = 'command') {
        try {
            if (!this.validatePermissions(userId)) {
                return { success: false, error: 'Insufficient permissions' };
            }
            const config = await this.getConfig();
            if (config.rateLimits.banner.changesRemaining <= 0) {
                const resetAt = config.rateLimits.banner.resetAt;
                const now = Date.now();
                if (resetAt && now < resetAt) {
                    const minutesLeft = Math.ceil((resetAt - now) / 60000);
                    return { success: false, error: `Banner rate limit exceeded. Try again in ${minutesLeft} minutes.`, retryAfter: minutesLeft };
                } else {
                    config.rateLimits.banner.changesRemaining = 2;
                    config.rateLimits.banner.resetAt = null;
                }
            }
            const validation = await this.imageValidator.validate(imageUrl, {
                maxSize: 8 * 1024 * 1024,
                allowedFormats: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
                minDimensions: { width: 600, height: 240 }
            });
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }
            const oldBanner = config.appearance.bannerUrl;
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const buffer = await response.buffer();
            await this.client.user.setBanner(buffer);
            config.rateLimits.banner.changesRemaining -= 1;
            if (config.rateLimits.banner.changesRemaining === 0) {
                config.rateLimits.banner.resetAt = Date.now() + (60 * 60 * 1000);
            }
            const fetchedUser = await this.client.users.fetch(this.client.user.id, { force: true });
            config.appearance.bannerUrl = fetchedUser.banner 
                ? `https://cdn.discordapp.com/banners/${this.client.user.id}/${fetchedUser.banner}.${fetchedUser.banner.startsWith('a_') ? 'gif' : 'png'}?size=1024`
                : null;
            await config.save();
            await this.logConfigChange('banner', oldBanner, config.appearance.bannerUrl, userId, source, true);
            return { success: true, message: 'Banner updated successfully', bannerUrl: config.appearance.bannerUrl };
        } catch (error) {
            console.error('Error updating banner:', error);
            await this.logConfigChange('banner', null, null, userId, source, false, error.message);
            return { success: false, error: error.message };
        }
    }

    startPresenceRotation(config) {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
        if (!config.presence.rotation.enabled || config.presence.activities.length === 0) {
            return;
        }
        let currentIndex = config.presence.rotation.currentIndex || 0;
        this.rotationInterval = setInterval(() => {
            const activity = config.presence.activities[currentIndex];
            this.client.user.setPresence({ status: config.presence.status, activities: [activity] });
            currentIndex = (currentIndex + 1) % config.presence.activities.length;
        }, config.presence.rotation.interval);
    }

    stopPresenceRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
            this.rotationInterval = null;
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

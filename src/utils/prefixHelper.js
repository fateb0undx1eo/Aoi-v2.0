const PrefixSchema = require('../schemas/prefixSchema');
const config = require('../config');

/**
 * Get the regular prefix for a guild
 * @param {string} guildId - Guild ID
 * @returns {Promise<string>} Prefix string
 */
async function getPrefix(guildId) {
    try {
        const prefixDoc = await PrefixSchema.findOne({ guildId: guildId || 'global' });
        return prefixDoc?.prefix || config.prefix.value || '!';
    } catch (error) {
        console.error('Failed to fetch prefix from database:', error);
        return config.prefix.value || '!';
    }
}

/**
 * Get the roleplay prefix for a guild
 * @param {string} guildId - Guild ID
 * @returns {Promise<string>} Roleplay prefix string
 */
async function getRoleplayPrefix(guildId) {
    try {
        const prefixDoc = await PrefixSchema.findOne({ guildId: guildId || 'global' });
        return prefixDoc?.roleplayPrefix || 'r!';
    } catch (error) {
        console.error('Failed to fetch roleplay prefix from database:', error);
        return 'r!';
    }
}

/**
 * Get both prefixes for a guild
 * @param {string} guildId - Guild ID
 * @returns {Promise<{prefix: string, roleplayPrefix: string}>} Both prefixes
 */
async function getBothPrefixes(guildId) {
    try {
        const prefixDoc = await PrefixSchema.findOne({ guildId: guildId || 'global' });
        return {
            prefix: prefixDoc?.prefix || config.prefix.value || '!',
            roleplayPrefix: prefixDoc?.roleplayPrefix || 'r!'
        };
    } catch (error) {
        console.error('Failed to fetch prefixes from database:', error);
        return {
            prefix: config.prefix.value || '!',
            roleplayPrefix: 'r!'
        };
    }
}

module.exports = {
    getPrefix,
    getRoleplayPrefix,
    getBothPrefixes
};

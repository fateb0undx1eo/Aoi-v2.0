const PrefixSchema = require('../schemas/prefixSchema');

/**
 * Get the regular prefix for a guild
 * @param {string} guildId - Guild ID
 * @returns {Promise<string>} Prefix string
 */
async function getPrefix(guildId) {
    try {
        const prefixDoc = await PrefixSchema.findOne({ guildId: guildId || 'global' });
        return prefixDoc?.prefix || '!';
    } catch (error) {
        console.error('Failed to fetch prefix from database:', error);
        return '!';
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
            prefix: prefixDoc?.prefix || '!',
            roleplayPrefix: prefixDoc?.roleplayPrefix || 'r!'
        };
    } catch (error) {
        console.error('Failed to fetch prefixes from database:', error);
        return {
            prefix: '!',
            roleplayPrefix: 'r!'
        };
    }
}

module.exports = {
    getPrefix,
    getRoleplayPrefix,
    getBothPrefixes
};

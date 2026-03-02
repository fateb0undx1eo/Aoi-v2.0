const { EmbedBuilder } = require('discord.js');
const AutoResponder = require('../../schemas/autoResponderSchema');
const config = require('../../config');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignore bots, system messages, and DMs
        if (message.author.bot || message.system || !message.guild) return;

        // Get prefix and check if message is a command - if so, skip autoresponder
        let prefix = config.prefix.value;
        try {
            const PrefixSchema = require('../../schemas/prefixSchema');
            const prefixDoc = await PrefixSchema.findOne({ guildId: message.guild.id });
            if (prefixDoc) prefix = prefixDoc.prefix;
        } catch (err) {
            // Use default prefix
        }
        
        // Skip if message starts with prefix (it's a command)
        if (prefix && message.content.startsWith(prefix)) return;

        try {
            // Get autoresponder config for this guild
            const autoConfig = await AutoResponder.findOne({ guildId: message.guild.id });
            
            // If no config or no triggers, skip
            if (!autoConfig || !autoConfig.triggers || autoConfig.triggers.length === 0) return;

            // Initialize cooldowns if not exists
            if (!client.autoResponderCooldowns) {
                client.autoResponderCooldowns = new Map();
            }

            // Check each trigger
            for (const trigger of autoConfig.triggers) {
                // Skip if disabled
                if (!trigger.enabled) continue;

                // Check cooldown
                const cooldownKey = `${message.guild.id}-${trigger.id}-${message.author.id}`;
                if (client.autoResponderCooldowns.has(cooldownKey)) {
                    const expirationTime = client.autoResponderCooldowns.get(cooldownKey) + (trigger.cooldown * 1000);
                    if (Date.now() < expirationTime) continue;
                }

                // Channel filters
                if (trigger.channelWhitelist && trigger.channelWhitelist.length > 0) {
                    if (!trigger.channelWhitelist.includes(message.channel.id)) continue;
                }
                if (trigger.channelBlacklist && trigger.channelBlacklist.length > 0) {
                    if (trigger.channelBlacklist.includes(message.channel.id)) continue;
                }

                // Role filters
                if (trigger.roleWhitelist && trigger.roleWhitelist.length > 0) {
                    const hasRole = message.member.roles.cache.some(role => 
                        trigger.roleWhitelist.includes(role.id)
                    );
                    if (!hasRole) continue;
                }
                if (trigger.roleBlacklist && trigger.roleBlacklist.length > 0) {
                    const hasRole = message.member.roles.cache.some(role => 
                        trigger.roleBlacklist.includes(role.id)
                    );
                    if (hasRole) continue;
                }

                // Check if message matches trigger
                let matched = false;
                const content = trigger.caseSensitive ? message.content : message.content.toLowerCase();
                const pattern = trigger.caseSensitive ? trigger.pattern : trigger.pattern.toLowerCase();

                switch (trigger.type) {
                    case 'keyword':
                        matched = content.includes(pattern);
                        break;
                    case 'exact':
                        matched = content === pattern;
                        break;
                    case 'mention':
                        matched = message.mentions.users.has(client.user.id) || 
                                 message.mentions.roles.size > 0 ||
                                 message.mentions.everyone;
                        break;
                    case 'regex':
                        try {
                            const regex = new RegExp(pattern, trigger.caseSensitive ? '' : 'i');
                            matched = regex.test(message.content);
                        } catch (err) {
                            console.error('[AutoResponder] Invalid regex:', pattern, err);
                        }
                        break;
                    case 'startsWith':
                        matched = content.startsWith(pattern);
                        break;
                    case 'endsWith':
                        matched = content.endsWith(pattern);
                        break;
                }

                if (matched) {
                    console.log(`[AutoResponder] ✓ Trigger matched: "${trigger.pattern}" in ${message.guild.name}`);

                    // Delete original message if configured
                    if (trigger.deleteOriginal) {
                        try {
                            await message.delete();
                        } catch (err) {
                            console.error('[AutoResponder] Failed to delete message:', err.message);
                        }
                    }

                    // Parse response with variables
                    let response = trigger.response
                        .replace(/{user}/g, message.author.toString())
                        .replace(/{username}/g, message.author.username)
                        .replace(/{server}/g, message.guild.name)
                        .replace(/{channel}/g, message.channel.toString())
                        .replace(/{membercount}/g, message.guild.memberCount.toString());

                    // Send response
                    try {
                        let sentMessage;
                        
                        if (trigger.embed && trigger.embed.enabled) {
                            const embed = new EmbedBuilder()
                                .setColor(trigger.embed.color || '#dc2626')
                                .setDescription(response);

                            if (trigger.embed.title) embed.setTitle(trigger.embed.title);
                            if (trigger.embed.footer) embed.setFooter({ text: trigger.embed.footer });
                            if (trigger.embed.thumbnail) embed.setThumbnail(trigger.embed.thumbnail);
                            if (trigger.embed.image) embed.setImage(trigger.embed.image);

                            sentMessage = await message.channel.send({ embeds: [embed] });
                        } else {
                            sentMessage = await message.channel.send(response);
                        }

                        // Auto-delete bot response if configured
                        if (trigger.deleteResponse && trigger.deleteResponseAfter > 0) {
                            setTimeout(async () => {
                                try {
                                    await sentMessage.delete();
                                    console.log(`[AutoResponder] ✓ Response auto-deleted after ${trigger.deleteResponseAfter}s`);
                                } catch (err) {
                                    console.error('[AutoResponder] Failed to auto-delete response:', err.message);
                                }
                            }, trigger.deleteResponseAfter * 1000);
                        }

                        // Update statistics
                        trigger.lastTriggered = new Date();
                        trigger.triggerCount = (trigger.triggerCount || 0) + 1;
                        await autoConfig.save();

                        console.log(`[AutoResponder] ✓ Response sent successfully`);
                    } catch (err) {
                        console.error('[AutoResponder] Failed to send message:', err.message);
                    }

                    // Set cooldown
                    if (trigger.cooldown > 0) {
                        client.autoResponderCooldowns.set(cooldownKey, Date.now());
                        setTimeout(() => {
                            client.autoResponderCooldowns.delete(cooldownKey);
                        }, trigger.cooldown * 1000);
                    }

                    // Only trigger once per message
                    break;
                }
            }
        } catch (error) {
            console.error('[AutoResponder] Error:', error);
        }
    }
};
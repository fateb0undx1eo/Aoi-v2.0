const PrefixSchema = require('../schemas/prefixSchema');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;
        
        // Get prefix from database
        let prefix = '!';
        let roleplayPrefix = 'r!';
        
        try {
            const guildId = message.guild?.id || 'global';
            const prefixDoc = await PrefixSchema.findOne({ guildId });
            if (prefixDoc) {
                prefix = prefixDoc.prefix;
                roleplayPrefix = prefixDoc.roleplayPrefix || 'r!';
            }
        } catch (error) {
            console.error('Error fetching prefix:', error);
        }
        
        // Determine which prefix is used
        let usedPrefix = null;
        if (message.content.startsWith(roleplayPrefix)) {
            usedPrefix = roleplayPrefix;
        } else if (message.content.startsWith(prefix)) {
            usedPrefix = prefix;
        } else {
            return;
        }
        
        // Parse command
        const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Get command
        const command = client.prefixCommands.get(commandName) ||
                       Array.from(client.prefixCommands.values()).find(cmd => 
                           cmd.aliases && cmd.aliases.includes(commandName)
                       );
        
        if (!command) return;
        
        // Cooldown handling
        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Map());
        }
        
        const now = Date.now();
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;
        
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            
            if (now < expirationTime) {
                const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                return message.reply(`⏱️ Please wait ${timeLeft} more second(s) before using this command again.`);
            }
        }
        
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        
        // Execute command
        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`Error executing prefix command ${command.name}:`, error);
            message.reply('❌ There was an error executing this command!').catch(() => {});
        }
    }
};

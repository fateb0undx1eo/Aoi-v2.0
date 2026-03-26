const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    
    // Recursively load all command files
    function loadCommands(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                loadCommands(filePath);
            } else if (file.endsWith('.js')) {
                try {
                    const command = require(filePath);
                    if (command.data && command.execute) {
                        client.commands.set(command.data.name, command);
                        commands.push(command.data.toJSON());
                        console.log(`✅ Loaded command: ${command.data.name}`);
                    } else {
                        console.log(`⚠️  Skipping ${file}: missing data or execute`);
                    }
                } catch (error) {
                    console.error(`❌ Error loading ${file}:`, error.message);
                }
            }
        }
    }
    
    loadCommands(commandsPath);
    
    // Register commands with Discord
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    
    (async () => {
        try {
            console.log(`🔄 Registering ${commands.length} slash commands...`);
            
            await rest.put(
                Routes.applicationCommands(process.env.BOT_ID),
                { body: commands }
            );
            
            console.log(`✅ Successfully registered ${commands.length} slash commands`);
        } catch (error) {
            console.error('❌ Error registering commands:', error);
        }
    })();
};

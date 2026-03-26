const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const prefixPath = path.join(__dirname, '../prefix');
    
    // Check if prefix directory exists
    if (!fs.existsSync(prefixPath)) {
        console.log('⚠️  No prefix commands directory found');
        return;
    }
    
    // Recursively load all prefix command files
    function loadPrefixCommands(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                loadPrefixCommands(filePath);
            } else if (file.endsWith('.js')) {
                try {
                    const command = require(filePath);
                    if (command.name && command.execute) {
                        client.prefixCommands.set(command.name, command);
                        console.log(`✅ Loaded prefix command: ${command.name}`);
                    } else {
                        console.log(`⚠️  Skipping ${file}: missing name or execute`);
                    }
                } catch (error) {
                    console.error(`❌ Error loading prefix command ${file}:`, error.message);
                }
            }
        }
    }
    
    loadPrefixCommands(prefixPath);
    console.log(`✅ Loaded ${client.prefixCommands.size} prefix commands`);
};

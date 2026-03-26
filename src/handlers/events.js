const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    
    for (const file of eventFiles) {
        try {
            const event = require(path.join(eventsPath, file));
            
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
            
            console.log(`✅ Loaded event: ${event.name}`);
        } catch (error) {
            console.error(`❌ Error loading event ${file}:`, error.message);
        }
    }
};

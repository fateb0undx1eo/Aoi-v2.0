module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅ Bot logged in as ${client.user.tag}`);
        console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
        console.log(`👥 Serving ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} users`);
        
        // Load dashboard after bot is ready
        try {
            require('../../admin/dashboard');
            console.log('✅ Admin dashboard loaded');
        } catch (error) {
            console.error('❌ Error loading dashboard:', error);
        }
        
        console.log('🚀 Bot is ready!');
    }
};

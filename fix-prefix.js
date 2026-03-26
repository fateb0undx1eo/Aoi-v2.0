require('dotenv').config();
const mongoose = require('mongoose');
const PrefixSchema = require('./src/schemas/prefixSchema');

async function fixPrefix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        const guildId = '1457403601080287294';
        const newPrefix = '!'; // Change this to whatever prefix you want
        
        console.log(`\n🔄 Updating prefix for guild ${guildId}...`);
        console.log(`   Old prefix: "#"`);
        console.log(`   New prefix: "${newPrefix}"`);
        
        const result = await PrefixSchema.findOneAndUpdate(
            { guildId },
            { 
                prefix: newPrefix,
                updatedAt: new Date()
            },
            { new: true }
        );
        
        if (result) {
            console.log('\n✅ Prefix updated successfully!');
            console.log(`   Regular Prefix: "${result.prefix}"`);
            console.log(`   Roleplay Prefix: "${result.roleplayPrefix}"`);
        } else {
            console.log('\n❌ Guild not found in database');
        }
        
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixPrefix();

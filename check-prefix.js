require('dotenv').config();
const mongoose = require('mongoose');
const PrefixSchema = require('./src/schemas/prefixSchema');

async function checkPrefixes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        const allPrefixes = await PrefixSchema.find({});
        
        console.log('\n📋 All Prefix Configurations:');
        console.log('================================');
        
        if (allPrefixes.length === 0) {
            console.log('No prefix configurations found in database');
        } else {
            allPrefixes.forEach((doc, index) => {
                console.log(`\n${index + 1}. Guild ID: ${doc.guildId}`);
                console.log(`   Regular Prefix: "${doc.prefix}"`);
                console.log(`   Roleplay Prefix: "${doc.roleplayPrefix}"`);
                console.log(`   Created: ${doc.createdAt}`);
                console.log(`   Updated: ${doc.updatedAt}`);
            });
        }
        
        console.log('\n================================\n');
        
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkPrefixes();

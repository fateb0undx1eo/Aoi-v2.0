const mongoose = require('mongoose');
const PrefixSchema = require('./src/schemas/prefixSchema');
require('dotenv').config();

async function migrateRoleplayPrefix() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('Fetching all prefix documents...');
        const allDocs = await PrefixSchema.find({});
        console.log(`Found ${allDocs.length} documents\n`);

        let updated = 0;
        let skipped = 0;

        for (const doc of allDocs) {
            if (!doc.roleplayPrefix) {
                doc.roleplayPrefix = 'r!'; // Set default
                await doc.save();
                console.log(`✅ Updated guild ${doc.guildId} - added roleplayPrefix: 'r!'`);
                updated++;
            } else {
                console.log(`⏭️  Skipped guild ${doc.guildId} - already has roleplayPrefix: '${doc.roleplayPrefix}'`);
                skipped++;
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`Updated: ${updated} documents`);
        console.log(`Skipped: ${skipped} documents`);
        console.log(`Total: ${allDocs.length} documents`);

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

migrateRoleplayPrefix();

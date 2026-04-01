const { Schema, model, models } = require('mongoose');

const prefixSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    prefix: {
        type: String,
        required: true,
        default: '!'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = models.Prefix || model('Prefix', prefixSchema);

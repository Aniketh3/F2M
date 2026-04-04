const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: false
    },
    imageUrl: {
        type: String,
        required: false
    },
    audioUrl: {
        type: String,
        required: false
    },
    location: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null }
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        default: 'seller'
    }
});

module.exports = mongoose.model('Message', MessageSchema);

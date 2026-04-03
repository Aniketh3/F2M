const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
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

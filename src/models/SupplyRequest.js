
const mongoose = require('mongoose');

const supplyRequestSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ''
    },

    quantity: {
        type: Number,
        required: true,
        min: 1
    },

    unit: {
        type: String,
        enum: ['kg', 'ton', 'piece', 'box'],
        required: true
    },

    region: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Region',
        required: true
    },

    status: {
        type: String,
        enum: ['open', 'closed', 'cancelled'],
        default: 'open'
    }

}, { timestamps: true });

module.exports = mongoose.model('SupplyRequest', supplyRequestSchema);

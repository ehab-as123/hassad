
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    supplyRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupplyRequest',
        required: true
    },

    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    crop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop',
        required: true
    },

    quantity: {
        type: Number,
        required: true,
        min: 1
    },

    pricePerUnit: {
        type: Number,
        required: true,
        min: 0
    },

    message: {
        type: String,
        default: ''
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
        default: 'pending'
    }

}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);

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
        min: 0.01
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

// Only one accepted offer per supply request.
offerSchema.index(
    { supplyRequest: 1 },
    { unique: true, partialFilterExpression: { status: 'accepted' } }
);

// A seller may have only one active offer (pending or accepted) per request.
offerSchema.index(
    { supplyRequest: 1, seller: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ['pending', 'accepted'] } },
        name: 'one_active_offer_per_seller_request'
    }
);

module.exports = mongoose.model('Offer', offerSchema);
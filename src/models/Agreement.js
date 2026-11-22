const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
    sourceType: {
        type: String,
        enum: ['directCrop', 'requestOffer'],
        required: true
    },

    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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

    supplyRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupplyRequest',
        default: null
    },

    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
        default: null
    },

    quantity: {
        type: Number,
        required: true,
        min: 0.01
    },

    unit: {
        type: String,
        enum: ['kg', 'ton', 'piece', 'box'],
        required: true
    },

    pricePerUnit: {
        type: Number,
        required: true,
        min: 0
    },

    buyerConfirmed: {
        type: Boolean,
        default: false
    },

    sellerConfirmed: {
        type: Boolean,
        default: false
    },

    status: {
        type: String,
        enum: [
            'pendingConfirmation',
            'confirmed',
            'inProgress',
            'completed',
            'cancelled',
            'disputed'
        ],
        default: 'pendingConfirmation'
    },

    stockReserved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

agreementSchema.pre('validate', function () {
    if (this.sourceType === 'directCrop' && (this.supplyRequest || this.offer)) {
        throw new Error('Direct crop agreement cannot have a request or offer');
    }

    if (this.sourceType === 'requestOffer' && (!this.supplyRequest || !this.offer)) {
        throw new Error('Request and offer are required');
    }
});

// Only one pending agreement per offer (enforced by the database).
agreementSchema.index(
    { offer: 1 },
    {
        unique: true,
        partialFilterExpression: { offer: { $type: 'objectId' }, status: 'pendingConfirmation' }
    }
);

module.exports = mongoose.model('Agreement', agreementSchema);
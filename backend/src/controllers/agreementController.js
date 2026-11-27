const Agreement = require('../models/Agreement');
const Crop = require('../models/Crop');
const SupplyRequest = require('../models/SupplyRequest');
const Offer = require('../models/Offer');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const { reserveStock, releaseStock, sellReservedStock } = require('../utils/stock');

const isParty = (agreement, userId) =>
    agreement.buyer.toString() === userId || agreement.seller.toString() === userId;

const cancelAgreementById = async (agreementId) => {
    const previous = await Agreement.findOneAndUpdate(
        { _id: agreementId, status: { $nin: ['completed', 'cancelled'] } },
        { $set: { status: 'cancelled' } },
        { new: false }
    );

    if (!previous) {
        return null;
    }

    if (previous.stockReserved) {
        const crop = await releaseStock(previous.crop, previous.quantity);

        if (!crop) {
            await Agreement.updateOne(
                { _id: agreementId, status: 'cancelled' },
                { $set: { status: previous.status } }
            );
            throw new AppError('Could not release reserved quantity', 400);
        }

        await Agreement.updateOne(
            { _id: agreementId },
            { $set: { stockReserved: false } }
        );
    }

    if (previous.offer) {
        const offer = await Offer.findOneAndUpdate(
            { _id: previous.offer, status: 'accepted' },
            { $set: { status: 'pending' } },
            { new: true }
        );

        if (!offer) {
            const currentOffer = await Offer.findById(previous.offer);
            if (!currentOffer || currentOffer.status === 'accepted') {
                throw new AppError('Agreement cancelled, but its offer could not be released', 500);
            }
        }
    }

    return previous;
};


const createAgreement = asyncHandler(async (req, res) => {
    const { crop: cropId, quantity, unit } = req.body;

    const crop = await Crop.findById(cropId);

    if (!crop || crop.status !== 'active') {
        throw new AppError('Crop not found or unavailable', 404);
    }

    if (crop.seller.toString() === req.user._id.toString()) {
        throw new AppError('You cannot buy your own crop', 400);
    }

    if (crop.unit !== unit) {
        throw new AppError('Crop unit does not match agreement unit', 400);
    }

    if (Number(quantity) > crop.availableQuantity) {
        throw new AppError('Requested quantity exceeds available quantity', 400);
    }

    const agreement = await Agreement.create({
        sourceType: 'directCrop',
        buyer: req.user._id,
        seller: crop.seller,
        crop: crop._id,
        quantity,
        unit,
        pricePerUnit: crop.pricePerUnit
    });

    res.status(201).json({
        status: 'success',
        message: 'Agreement created and waiting for confirmation',
        data: agreement
    });
});


const getMyAgreements = asyncHandler(async (req, res) => {
    const agreements = await Agreement.find({
        $or: [
            { buyer: req.user._id },
            { seller: req.user._id }
        ]
    })
        .populate('buyer', 'name role')
        .populate('seller', 'name role')
        .populate('crop', 'name pricePerUnit unit')
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        count: agreements.length,
        data: agreements
    });
});

const confirmAgreement = asyncHandler(async (req, res) => {
    const agreement = await Agreement.findById(req.params.id);

    if (!agreement) {
        throw new AppError('Agreement not found', 404);
    }

    const userId = req.user._id.toString();

    if (!isParty(agreement, userId)) {
        throw new AppError('You are not part of this agreement', 403);
    }

    if (agreement.status !== 'pendingConfirmation') {
        throw new AppError('Agreement is not awaiting confirmation', 400);
    }

    const field = agreement.buyer.toString() === userId
        ? 'buyerConfirmed'
        : 'sellerConfirmed';

    const updated = await Agreement.findOneAndUpdate(
        { _id: agreement._id, status: 'pendingConfirmation', [field]: false },
        { $set: { [field]: true } },
        { new: true }
    );

    if (!updated) {
        throw new AppError('You already confirmed this agreement or it is no longer pending', 400);
    }

    if (!(updated.buyerConfirmed && updated.sellerConfirmed)) {
        return res.status(200).json({
            status: 'success',
            message: 'Your confirmation has been recorded',
            data: updated
        });
    }

    const claimed = await Agreement.findOneAndUpdate(
        {
            _id: agreement._id,
            status: 'pendingConfirmation',
            buyerConfirmed: true,
            sellerConfirmed: true,
            stockReserved: false
        },
        { $set: { status: 'confirmed' } },
        { new: true }
    );

    if (!claimed) {
        const current = await Agreement.findById(agreement._id);

        if (!current || current.status === 'cancelled') {
            throw new AppError('Agreement was cancelled', 409);
        }

        return res.status(200).json({
            status: 'success',
            message: 'Your confirmation has been recorded',
            data: current
        });
    }

    const crop = await reserveStock(claimed.crop, claimed.quantity);

    if (!crop) {
        await Agreement.findOneAndUpdate(
            { _id: agreement._id, status: 'confirmed', stockReserved: false },
            { $set: { status: 'pendingConfirmation', [field]: false } }
        );

        throw new AppError('Not enough available crop quantity', 400);
    }

    const reserved = await Agreement.findOneAndUpdate(
        { _id: agreement._id, status: 'confirmed', stockReserved: false },
        { $set: { stockReserved: true } },
        { new: true }
    );

    if (!reserved) {
        await releaseStock(claimed.crop, claimed.quantity);
        throw new AppError('Agreement was cancelled', 409);
    }

    res.status(200).json({
        status: 'success',
        message: 'Agreement confirmed and quantity reserved',
        data: reserved
    });
});

const createAgreementFromOffer = asyncHandler(async (req, res) => {
    const offer = await Offer.findById(req.params.offerId);

    if (!offer) {
        throw new AppError('Offer not found', 404);
    }

    if (offer.status !== 'accepted') {
        throw new AppError('Offer must be accepted first', 400);
    }

    const supplyRequest = await SupplyRequest.findById(offer.supplyRequest);

    if (!supplyRequest) {
        throw new AppError('Supply request not found', 404);
    }

    if (supplyRequest.buyer.toString() !== req.user._id.toString()) {
        throw new AppError('Only the request owner can create an agreement', 403);
    }

    if (supplyRequest.status !== 'open') {
        throw new AppError('Supply request is not open', 400);
    }

    const existingAgreement = await Agreement.findOne({
        offer: offer._id,
        status: { $ne: 'cancelled' }
    });

    if (existingAgreement) {
        throw new AppError('Agreement already exists for this offer', 400);
    }

    const crop = await Crop.findById(offer.crop);

    if (!crop || crop.status !== 'active') {
        throw new AppError('Crop is unavailable', 400);
    }

    if (crop.seller.toString() !== offer.seller.toString()) {
        throw new AppError('Offer seller does not own this crop', 400);
    }

    if (offer.quantity > crop.availableQuantity) {
        throw new AppError('Offer quantity exceeds available crop quantity', 400);
    }

    let agreement;

    try {
        agreement = await Agreement.create({
            sourceType: 'requestOffer',
            buyer: supplyRequest.buyer,
            seller: offer.seller,
            crop: crop._id,
            supplyRequest: supplyRequest._id,
            offer: offer._id,
            quantity: offer.quantity,
            unit: crop.unit,
            pricePerUnit: offer.pricePerUnit
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('Agreement already exists for this offer', 409);
        }
        throw error;
    }

    const others = await Agreement.countDocuments({
        offer: offer._id,
        status: { $ne: 'cancelled' },
        _id: { $ne: agreement._id }
    });

    if (others > 0) {
        await cancelAgreementById(agreement._id);
        throw new AppError('Agreement already exists for this offer', 409);
    }

    res.status(201).json({
        status: 'success',
        message: 'Agreement created successfully',
        data: agreement
    });
});


const cancelAgreement = asyncHandler(async (req, res) => {
    const agreement = await Agreement.findById(req.params.id);

    if (!agreement) {
        throw new AppError('Agreement not found', 404);
    }

    if (!isParty(agreement, req.user._id.toString())) {
        throw new AppError('You are not part of this agreement', 403);
    }

    const previous = await cancelAgreementById(agreement._id);

    if (!previous) {
        throw new AppError('Agreement cannot be cancelled', 400);
    }

    const current = await Agreement.findById(agreement._id);

    res.status(200).json({
        status: 'success',
        message: 'Agreement cancelled successfully',
        data: current
    });
});


const completeAgreement = asyncHandler(async (req, res) => {
    const agreement = await Agreement.findById(req.params.id);

    if (!agreement) {
        throw new AppError('Agreement not found', 404);
    }

    const userId = req.user._id.toString();

    if (!isParty(agreement, userId)) {
        throw new AppError('You are not part of this agreement', 403);
    }

    if (agreement.buyer.toString() !== userId) {
        throw new AppError('Only the buyer can complete the agreement', 403);
    }

    const previous = await Agreement.findOneAndUpdate(
        {
            _id: agreement._id,
            status: { $in: ['confirmed', 'inProgress'] },
            stockReserved: true
        },
        { $set: { status: 'completed' } },
        { new: false }
    );

    if (!previous) {
        throw new AppError('Agreement is not ready for completion', 400);
    }

    const crop = await sellReservedStock(previous.crop, previous.quantity);

    if (!crop) {
        await Agreement.updateOne(
            { _id: agreement._id, status: 'completed' },
            { $set: { status: previous.status } }
        );
        throw new AppError('Could not complete stock update', 400);
    }

    const completed = await Agreement.findOneAndUpdate(
        { _id: agreement._id },
        { $set: { stockReserved: false } },
        { new: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'Agreement completed successfully',
        data: completed
    });
});


module.exports = {
    createAgreement,
    getMyAgreements,
    confirmAgreement,
    createAgreementFromOffer,
    cancelAgreement,
    completeAgreement
};

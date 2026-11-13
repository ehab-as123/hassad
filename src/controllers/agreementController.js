const Agreement = require('../models/Agreement');
const Crop = require('../models/Crop');
const SupplyRequest = require('../models/SupplyRequest');
const Offer = require('../models/Offer');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const isParty = (agreement, userId) =>
    agreement.buyer.toString() === userId || agreement.seller.toString() === userId;

// Direct purchase from a crop listing. Price comes from the crop, never from the client.
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


// Each side confirms atomically. Stock is reserved when the second side confirms;
// if reservation fails, that confirmation is rolled back so the agreement is not stuck.
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

    let updated = await Agreement.findOneAndUpdate(
        { _id: agreement._id, status: 'pendingConfirmation', [field]: false },
        { $set: { [field]: true } },
        { new: true }
    );

    if (!updated) {
        throw new AppError('You already confirmed this agreement', 400);
    }

    if (updated.buyerConfirmed && updated.sellerConfirmed) {
        const crop = await Crop.findOneAndUpdate(
            {
                _id: updated.crop,
                status: 'active',
                availableQuantity: { $gte: updated.quantity }
            },
            {
                $inc: {
                    availableQuantity: -updated.quantity,
                    reservedQuantity: updated.quantity
                }
            },
            { new: true }
        );

        if (!crop) {
            await Agreement.updateOne(
                { _id: updated._id },
                { $set: { [field]: false } }
            );
            throw new AppError('Not enough available crop quantity', 400);
        }

        updated = await Agreement.findByIdAndUpdate(
            updated._id,
            { $set: { stockReserved: true, status: 'confirmed' } },
            { new: true }
        );
    }

    res.status(200).json({
        status: 'success',
        message: updated.stockReserved
            ? 'Agreement confirmed and quantity reserved'
            : 'Your confirmation has been recorded',
        data: updated
    });
});


// Agreement from an accepted offer. Quantity, price and unit come from the offer and crop.
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

    const agreement = await Agreement.create({
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

    supplyRequest.status = 'closed';
    await supplyRequest.save();

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

    if (['completed', 'cancelled'].includes(agreement.status)) {
        throw new AppError('Agreement cannot be cancelled', 400);
    }

    if (agreement.stockReserved) {
        const crop = await Crop.findOneAndUpdate(
            {
                _id: agreement.crop,
                reservedQuantity: { $gte: agreement.quantity }
            },
            {
                $inc: {
                    availableQuantity: agreement.quantity,
                    reservedQuantity: -agreement.quantity
                }
            },
            { new: true }
        );

        if (!crop) {
            throw new AppError('Could not release reserved quantity', 400);
        }

        agreement.stockReserved = false;
    }

    agreement.status = 'cancelled';

    await agreement.save();

    // Re-open the request so the buyer can create a new agreement from the accepted offer.
    if (agreement.supplyRequest) {
        await SupplyRequest.updateOne(
            { _id: agreement.supplyRequest, status: 'closed' },
            { $set: { status: 'open' } }
        );
    }

    res.status(200).json({
        status: 'success',
        message: 'Agreement cancelled successfully',
        data: agreement
    });
});


// Only the buyer completes the agreement (confirms receipt).
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

    if (agreement.status !== 'confirmed' && agreement.status !== 'inProgress') {
        throw new AppError('Agreement is not ready for completion', 400);
    }

    if (!agreement.stockReserved) {
        throw new AppError('Agreement has no reserved stock', 400);
    }

    const crop = await Crop.findOneAndUpdate(
        {
            _id: agreement.crop,
            reservedQuantity: { $gte: agreement.quantity }
        },
        {
            $inc: {
                reservedQuantity: -agreement.quantity,
                soldQuantity: agreement.quantity
            }
        },
        { new: true }
    );

    if (!crop) {
        throw new AppError('Could not complete stock update', 400);
    }

    agreement.status = 'completed';
    agreement.stockReserved = false;

    await agreement.save();

    res.status(200).json({
        status: 'success',
        message: 'Agreement completed successfully',
        data: agreement
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
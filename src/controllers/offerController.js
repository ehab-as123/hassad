const Offer = require('../models/Offer');
const SupplyRequest = require('../models/SupplyRequest');
const Crop = require('../models/Crop');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const createOffer = asyncHandler(async (req, res) => {
    const supplyRequest = await SupplyRequest.findById(req.body.supplyRequest);

    if (!supplyRequest) {
        throw new AppError('Supply request not found', 404);
    }

    if (supplyRequest.status !== 'open') {
        throw new AppError('Supply request is not open', 400);
    }

    if (supplyRequest.buyer.toString() === req.user._id.toString()) {
        throw new AppError('You cannot offer on your own request', 400);
    }

    const { crop: cropId, quantity, pricePerUnit, message } = req.body;

    const crop = await Crop.findById(cropId);

    if (!crop || crop.status !== 'active') {
        throw new AppError('Crop not found or unavailable', 404);
    }

    if (crop.seller.toString() !== req.user._id.toString()) {
        throw new AppError('You can only offer your own crops', 403);
    }

    if (crop.unit !== supplyRequest.unit) {
        throw new AppError('Crop unit does not match the requested unit', 400);
    }

    if (Number(quantity) > crop.availableQuantity) {
        throw new AppError('Offer quantity exceeds available crop quantity', 400);
    }

    const existingOffer = await Offer.findOne({
        supplyRequest: supplyRequest._id,
        seller: req.user._id,
        status: { $in: ['pending', 'accepted'] }
    });

    if (existingOffer) {
        throw new AppError('You already have an active offer on this request', 409);
    }

    const offer = await Offer.create({
        supplyRequest: supplyRequest._id,
        seller: req.user._id,
        crop: crop._id,
        quantity,
        pricePerUnit,
        message
    });

    res.status(201).json({
        message: 'Offer created successfully',
        offer
    });
});

const getOffersByRequest = asyncHandler(async (req, res) => {
    const supplyRequest = await SupplyRequest.findById(req.params.id);

    if (!supplyRequest) {
        throw new AppError('Supply request not found', 404);
    }

    if (supplyRequest.buyer.toString() !== req.user._id.toString()) {
        throw new AppError('Access denied', 403);
    }

    const offers = await Offer.find({
        supplyRequest: req.params.id
    })
        .populate('seller', 'name role')
        .sort({ createdAt: -1 });

    res.status(200).json({
        count: offers.length,
        offers
    });
});


const acceptOffer = asyncHandler(async (req, res) => {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
        throw new AppError('Offer not found', 404);
    }

    const supplyRequest = await SupplyRequest.findById(offer.supplyRequest);

    if (!supplyRequest) {
        throw new AppError('Supply request not found', 404);
    }

    if (supplyRequest.buyer.toString() !== req.user._id.toString()) {
        throw new AppError('Only the request owner can accept this offer', 403);
    }

    if (supplyRequest.status !== 'open') {
        throw new AppError('Supply request is not open', 400);
    }

    if (offer.status !== 'pending') {
        throw new AppError('Offer is not pending', 400);
    }

    const alreadyAccepted = await Offer.exists({
        supplyRequest: offer.supplyRequest,
        status: 'accepted'
    });

    if (alreadyAccepted) {
        throw new AppError('Another offer was already accepted for this request', 400);
    }

    offer.status = 'accepted';

    await offer.save();

    await Offer.updateMany(
        {
            supplyRequest: offer.supplyRequest,
            _id: { $ne: offer._id },
            status: 'pending'
        },
        { $set: { status: 'rejected' } }
    );

    res.status(200).json({
        status: 'success',
        message: 'Offer accepted successfully',
        data: offer
    });
});


const rejectOffer = asyncHandler(async (req, res) => {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
        throw new AppError('Offer not found', 404);
    }

    const supplyRequest = await SupplyRequest.findById(offer.supplyRequest);

    if (!supplyRequest) {
        throw new AppError('Supply request not found', 404);
    }

    if (supplyRequest.buyer.toString() !== req.user._id.toString()) {
        throw new AppError('Only the request owner can reject this offer', 403);
    }

    if (offer.status !== 'pending') {
        throw new AppError('Offer is not pending', 400);
    }

    offer.status = 'rejected';

    await offer.save();

    res.status(200).json({
        status: 'success',
        message: 'Offer rejected successfully',
        data: offer
    });
});


module.exports = {
    createOffer,
    getOffersByRequest,
    acceptOffer,
    rejectOffer
};
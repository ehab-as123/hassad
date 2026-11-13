
const Offer = require('../models/Offer');
const SupplyRequest = require('../models/SupplyRequest');
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

    const offer = await Offer.create({
        ...req.body,
        seller: req.user._id
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

    offer.status = 'accepted';

    await offer.save();

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

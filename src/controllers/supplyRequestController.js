
const SupplyRequest = require('../models/SupplyRequest');
const Category = require('../models/Category');
const Region = require('../models/Region');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const createSupplyRequest = asyncHandler(async (req, res) => {
    const category = await Category.findOne({
        _id: req.body.category,
        isActive: true
    });

    if (!category) {
        throw new AppError('Category not found', 404);
    }

    const region = await Region.findOne({
        _id: req.body.region,
        isActive: true
    });

    if (!region) {
        throw new AppError('Region not found', 404);
    }

    const supplyRequest = await SupplyRequest.create({
        ...req.body,
        buyer: req.user._id
    });

    res.status(201).json({
        message: 'Supply request created successfully',
        supplyRequest
    });
});

const getSupplyRequests = asyncHandler(async (req, res) => {
    const supplyRequests = await SupplyRequest.find({ status: 'open' })
        .populate('buyer', 'name role')
        .populate('category', 'name')
        .populate('region', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json({
        count: supplyRequests.length,
        supplyRequests
    });
});

module.exports = {
    createSupplyRequest,
    getSupplyRequests
};

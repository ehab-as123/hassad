
const Crop = require('../models/Crop');
const Category = require('../models/Category');
const Region = require('../models/Region');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const createCrop = asyncHandler(async (req, res) => {
  const {
    category,
    name,
    description,
    totalQuantity,
    unit,
    pricePerUnit,
    region
  } = req.body;

  const categoryExists = await Category.findOne({
    _id: category,
    isActive: true
  });

  if (!categoryExists) {
    throw new AppError('Category not found', 404);
  }

  const regionExists = await Region.findOne({
    _id: region,
    isActive: true
  });

  if (!regionExists) {
    throw new AppError('Region not found', 404);
  }

  const crop = await Crop.create({
    seller: req.user._id,
    category,
    name,
    description,
    totalQuantity,
    availableQuantity: totalQuantity,
    reservedQuantity: 0,
    soldQuantity: 0,
    unit,
    pricePerUnit,
    region
  });

  res.status(201).json({
    message: 'Crop created successfully',
    crop
  });
});

const getCrops = asyncHandler(async (req, res) => {
  const crops = await Crop.find({
    status: 'active',
    availableQuantity: { $gt: 0 }
  })
    .populate('seller', 'name role')
    .populate('category', 'name')
    .populate('region', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    count: crops.length,
    crops
  });
});

module.exports = { createCrop, getCrops };

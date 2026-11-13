
const Region = require('../models/Region');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const createRegion = asyncHandler(async (req, res) => {
  const { name, parentRegion } = req.body;

  if (parentRegion) {
    const parent = await Region.findById(parentRegion);

    if (!parent || !parent.isActive) {
      throw new AppError('Parent region not found', 404);
    }
  }

  const region = await Region.create({ name, parentRegion });

  res.status(201).json({
    message: 'Region created successfully',
    region
  });
});

const getRegions = asyncHandler(async (req, res) => {
  const regions = await Region.find({ isActive: true })
    .populate('parentRegion', 'name')
    .sort({ name: 1 });

  res.status(200).json({ regions });
});

module.exports = { createRegion, getRegions };

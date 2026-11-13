
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');

const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);

  res.status(201).json({
    message: 'Category created successfully',
    category
  });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ name: 1 });

  res.status(200).json({ categories });
});

module.exports = { createCategory, getCategories };

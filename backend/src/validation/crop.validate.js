
const { body } = require('express-validator');

const createCropValidation = [
    body('category')
        .isMongoId()
        .withMessage('Invalid category ID'),

    body('name')
        .trim()
        .notEmpty()
        .withMessage('Crop name is required'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string'),

    body('totalQuantity')
        .isFloat({ min: 0.01 })
        .withMessage('Quantity must be greater than 0'),

    body('unit')
        .isIn(['kg', 'ton', 'piece', 'box'])
        .withMessage('Invalid unit'),

    body('pricePerUnit')
        .isFloat({ min: 0 })
        .withMessage('Price must be 0 or greater'),

    body('region')
        .isMongoId()
        .withMessage('Invalid region ID')
];

module.exports = { createCropValidation };

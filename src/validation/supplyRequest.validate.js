
const { body } = require('express-validator');

const createSupplyRequestValidation = [
    body('category')
        .notEmpty()
        .withMessage('Category is required'),

    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string'),

    body('quantity')
        .isFloat({ min: 1 })
        .withMessage('Quantity must be greater than 0'),

    body('unit')
        .isIn(['kg', 'ton', 'piece', 'box'])
        .withMessage('Invalid unit'),

    body('region')
        .notEmpty()
        .withMessage('Region is required')
];

module.exports = {
    createSupplyRequestValidation
};

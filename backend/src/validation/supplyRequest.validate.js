const { body } = require('express-validator');

const createSupplyRequestValidation = [
    body('category')
        .isMongoId()
        .withMessage('Invalid category ID'),

    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string'),

    body('quantity')
        .isFloat({ min: 0.01 })
        .withMessage('Quantity must be greater than 0'),

    body('unit')
        .isIn(['kg', 'ton', 'piece', 'box'])
        .withMessage('Invalid unit'),

    body('region')
        .isMongoId()
        .withMessage('Invalid region ID')
];

module.exports = {
    createSupplyRequestValidation
};
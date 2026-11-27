const { body } = require('express-validator');

const createAgreementValidation = [
    body('crop')
        .isMongoId()
        .withMessage('Invalid crop ID'),

    body('quantity')
        .isFloat({ min: 0.01 })
        .withMessage('Quantity must be greater than 0'),

    body('unit')
        .isIn(['kg', 'ton', 'piece', 'box'])
        .withMessage('Invalid unit')
];

module.exports = { createAgreementValidation };

const { body } = require('express-validator');

const createAgreementValidation = [
    body('sourceType')
        .isIn(['directCrop', 'requestOffer'])
        .withMessage('Invalid agreement source'),

    body('crop')
        .optional()
        .isMongoId()
        .withMessage('Invalid crop ID'),

    body('supplyRequest')
        .optional()
        .isMongoId()
        .withMessage('Invalid supply request ID'),

    body('offer')
        .optional()
        .isMongoId()
        .withMessage('Invalid offer ID'),

    body('quantity')
        .isFloat({ min: 1 })
        .withMessage('Quantity must be greater than 0'),

    body('unit')
        .isIn(['kg', 'ton', 'piece', 'box'])
        .withMessage('Invalid unit'),

    body('pricePerUnit')
        .isFloat({ min: 0 })
        .withMessage('Price must be 0 or greater'),

    body().custom((value) => {
        if (value.sourceType === 'directCrop') {
            if (!value.crop || value.supplyRequest || value.offer) {
                throw new Error('Direct agreement requires crop only');
            }
        }

        if (value.sourceType === 'requestOffer') {
            if (!value.supplyRequest || !value.offer) {
                throw new Error('Request and offer are required');
            }
        }

        return true;
    })
];

module.exports = { createAgreementValidation };

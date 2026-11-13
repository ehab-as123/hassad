const { body } = require('express-validator');

// Direct purchase from a crop listing. Price is taken from the crop on the
// server, and agreements from offers go through POST /from-offer/:offerId.
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
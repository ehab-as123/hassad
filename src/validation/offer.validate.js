
const { body } = require('express-validator');

const createOfferValidation = [
    body('supplyRequest')
        .notEmpty()
        .withMessage('Supply request is required'),

    body('quantity')
        .isFloat({ min: 1 })
        .withMessage('Quantity must be greater than 0'),

    body('pricePerUnit')
        .isFloat({ min: 0 })
        .withMessage('Price must be 0 or greater'),

    body('message')
        .optional()
        .isString()
        .withMessage('Message must be a string'),
        
    body('crop')
        .isMongoId()
        .withMessage('Invalid crop ID')

];

module.exports = {
    createOfferValidation
};

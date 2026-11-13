const { body } = require('express-validator');

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),

  body('phone')
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('Invalid phone number'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  body('role')
    .optional()
    .isIn(['farmer', 'trader'])
    .withMessage('Invalid role')
];

const loginValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

module.exports = { registerValidation, loginValidation };
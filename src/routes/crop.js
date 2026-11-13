
const express = require('express');

const {
    createCrop,
    getCrops
} = require('../controllers/cropController');

const auth = require('../middlewares/auth');
const validation = require('../middlewares/validation');
const { createCropValidation } = require('../validation/crop.validate');

const router = express.Router();

router.get('/', getCrops);

router.post(
    '/',
    auth,
    createCropValidation,
    validation,
    createCrop
);

module.exports = router;

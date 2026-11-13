const express = require('express');

const {
    createCrop,
    getCrops
} = require('../controllers/cropController');

const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const validation = require('../middlewares/validation');
const { createCropValidation } = require('../validation/crop.validate');

const router = express.Router();

router.get('/', getCrops);

router.post(
    '/',
    auth,
    role('farmer'),
    createCropValidation,
    validation,
    createCrop
);

module.exports = router;
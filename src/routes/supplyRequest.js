const express = require('express');

const {
    createSupplyRequest,
    getSupplyRequests
} = require('../controllers/supplyRequestController');

const {
    createSupplyRequestValidation
} = require('../validation/supplyRequest.validate');

const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const validation = require('../middlewares/validation');

const router = express.Router();

router.get('/', getSupplyRequests);

router.post(
    '/',
    auth,
    role('trader'),
    createSupplyRequestValidation,
    validation,
    createSupplyRequest
);

module.exports = router;
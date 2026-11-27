const express = require('express');

const {
    createAgreement,
    getMyAgreements,
    confirmAgreement,
    createAgreementFromOffer,
    cancelAgreement,
    completeAgreement
} = require('../controllers/agreementController');

const { createAgreementValidation } = require('../validation/agreement.validate');

const auth = require('../middlewares/auth');
const validation = require('../middlewares/validation');
const id = require('../middlewares/id');

const router = express.Router();

router.use(auth);

router.post('/', createAgreementValidation, validation, createAgreement);

router.get('/my', getMyAgreements);

router.patch('/:id/confirm', id(), confirmAgreement);

router.post('/from-offer/:offerId', id('offerId'), createAgreementFromOffer);

router.patch('/:id/cancel', id(), cancelAgreement);

router.patch('/:id/complete', id(), completeAgreement);

module.exports = router;
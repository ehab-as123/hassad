
const express = require('express');

const {
    createOffer,
    getOffersByRequest,
    acceptOffer,
    rejectOffer
} = require('../controllers/offerController');

const {
    createOfferValidation
} = require('../validation/offer.validate');

const auth = require('../middlewares/auth');
const validation = require('../middlewares/validation');
const id = require('../middlewares/id');


const router = express.Router();

router.post('/', auth, createOfferValidation, validation, createOffer);

router.get('/request/:id', auth, id, getOffersByRequest);

router.patch('/:id/accept', auth, id, acceptOffer);

router.patch('/:id/reject', auth, id, rejectOffer);

module.exports = router;

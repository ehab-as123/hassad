
const express = require('express');
const {
  createRegion,
  getRegions
} = require('../controllers/regionController');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');

const router = express.Router();

router.get('/', getRegions);
router.post('/', auth, role('admin'), createRegion);

module.exports = router;

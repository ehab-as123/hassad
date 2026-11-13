
const express = require('express');
const {
  createCategory,
  getCategories
} = require('../controllers/categoryController');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');

const router = express.Router();

router.get('/', getCategories);
router.post('/', auth, role('admin'), createCategory);

module.exports = router;

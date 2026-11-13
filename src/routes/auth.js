const express = require('express');
const { register, login } = require('../controllers/authController');
const {
  registerValidation,
  loginValidation
} = require('../validation/user.validation');
const validation = require('../middlewares/validation');
const auth = require('../middlewares/auth');
const {getMe}= require('../controllers/authController');

const router = express.Router();

router.post('/register', registerValidation, validation, register);
router.post('/login', loginValidation, validation, login);
router.get("/me",auth,getMe);

module.exports = router;
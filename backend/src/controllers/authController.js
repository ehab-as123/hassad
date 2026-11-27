const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { hashPassword, comparePassword } = require('../utils/hashService');
const { generateToken } = require('../utils/jwtService');

const register = asyncHandler(async (req, res) => {
  const { name, phone, password, role } = req.body;

  const existingUser = await User.findOne({ phone });

  if (existingUser) {
    throw new AppError('Phone number already registered', 409);
  }

  const user = await User.create({
    name,
    phone,
    password: await hashPassword(password),
    role: role || 'farmer'
  });

  res.status(201).json({
    message: 'Account created successfully',
    token: generateToken(user),
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  const user = await User.findOne({ phone });

  if (!user || !(await comparePassword(password, user.password))) {
    throw new AppError('Invalid phone number or password', 401);
  }

  if (user.isBlocked) {
    throw new AppError('Your account is blocked', 403);
  }

  res.status(200).json({
    message: 'Login successful',
    token: generateToken(user),
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role
    }
  });
});

const getMe = asyncHandler(async (req,res)=>{
    res.status(200).json({
        user:{
            id : req.user._id,
            name : req.user.name,
            phone: req.user.phone,
            role: req.user.role
        }
    });
});

module.exports = { register, login ,getMe };
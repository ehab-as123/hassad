
const JWT = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const auth = asyncHandler(async (req, res, next) => {
    const token = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null;

    if (!token) {
        throw new AppError('Authentication required', 401);
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
        throw new AppError('User not found', 401);
    }

    if (user.isBlocked) {
        throw new AppError('Account is blocked', 403);
    }

    req.user = user;
    next();
});

module.exports = auth;

const AppError = require('../utils/appError');

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const id = (param = 'id') => (req, res, next) => {
  if (!OBJECT_ID.test(String(req.params[param]))) {
    return next(new AppError('Invalid ID', 400));
  }
  next();
};

module.exports = id;
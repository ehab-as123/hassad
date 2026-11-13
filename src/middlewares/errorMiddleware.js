const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'قيمة غير صالحة';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'القيمة المدخلة موجودة مسبقًا';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'انتهت صلاحية الرمز، سجّل الدخول من جديد';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'رمز غير صالح';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'صيغة JSON غير صحيحة';
  }

  if (statusCode === 500) {
    console.error(err);
    message = 'حدث خطأ في الخادم';
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorMiddleware;

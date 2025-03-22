const winston = require('winston');

// إعداد Winston للتسجيل
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log' })
  ]
});

// إضافة تسجيل في وحدة التحكم في بيئة التطوير
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// تصنيف أنواع الأخطاء
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// معالج الأخطاء المركزي
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // تسجيل الخطأ
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // التعامل مع أخطاء JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'رمز المصادقة غير صالح'
    });
  }

  // التعامل مع انتهاء صلاحية JWT
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'انتهت صلاحية رمز المصادقة'
    });
  }

  // التعامل مع أخطاء قاعدة البيانات
  if (err.code === '23505') { // خطأ التكرار في PostgreSQL
    return res.status(409).json({
      success: false,
      message: 'هذا البريد الإلكتروني مسجل مسبقاً'
    });
  }

  // التعامل مع أخطاء التحقق من صحة البيانات
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'خطأ في البيانات المدخلة',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // في بيئة التطوير، إرسال التفاصيل الكاملة
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }

  // في بيئة الإنتاج، إرسال رسالة خطأ عامة
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // للأخطاء غير المتوقعة
  return res.status(500).json({
    success: false,
    message: 'حدث خطأ في الخادم'
  });
};

// معالج الطلبات غير الموجودة
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود'
  });
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  logger
};
const rateLimit = require('express-rate-limit');
const config = require('../config/config');

// قيود عامة لجميع الطلبات
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح به من الطلبات. يرجى المحاولة لاحقاً'
  }
});

// قيود مشددة لمحاولات تسجيل الدخول
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات فقط
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح به من محاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة'
  }
});

// قيود لتحليل الأعراض
const symptomAnalysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 10, // 10 تحليلات في الساعة
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح به من تحليلات الأعراض. يرجى المحاولة لاحقاً'
  }
});

// قيود لإعادة تعيين كلمة المرور
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 3, // 3 محاولات في الساعة
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح به من طلبات إعادة تعيين كلمة المرور. يرجى المحاولة لاحقاً'
  }
});

// قيود لإرسال رمز التحقق
const verificationCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 5, // 5 محاولات في الساعة
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح به من طلبات إرسال رمز التحقق. يرجى المحاولة لاحقاً'
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  symptomAnalysisLimiter,
  passwordResetLimiter,
  verificationCodeLimiter
};
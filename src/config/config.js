require('dotenv').config();

module.exports = {
  // إعدادات الخادم
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // إعدادات JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // إعدادات Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },

  // إعدادات SendGrid
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
  },

  // إعدادات AI API
  ai: {
    apiKey: process.env.AI_API_KEY,
    endpoint: process.env.AI_API_ENDPOINT,
  },

  // إعدادات Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // الحد الأقصى للطلبات لكل IP
  },

  // إعدادات التحقق من كلمة المرور
  password: {
    saltRounds: 10, // عدد جولات التشفير لـ bcrypt
    minLength: 8, // الحد الأدنى لطول كلمة المرور
  },

  // إعدادات التحقق من البريد الإلكتروني
  email: {
    verificationTokenExpiry: 24 * 60 * 60 * 1000, // 24 ساعة
    resetPasswordTokenExpiry: 1 * 60 * 60 * 1000, // ساعة واحدة
  },

  // رسائل الخطأ
  errors: {
    auth: {
      invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      emailNotVerified: 'يرجى تأكيد بريدك الإلكتروني أولاً',
      tokenExpired: 'انتهت صلاحية الرمز',
      unauthorized: 'غير مصرح بالوصول',
    },
    validation: {
      invalidEmail: 'البريد الإلكتروني غير صالح',
      weakPassword: 'كلمة المرور ضعيفة جداً',
      required: 'هذا الحقل مطلوب',
    },
  },
};
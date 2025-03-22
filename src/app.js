const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { errorHandler, notFoundHandler, logger } = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');
const { testConnection, createTables } = require('./config/database');

// استيراد المسارات
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const symptomRoutes = require('./routes/symptomRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// إعداد الـ Middleware الأساسي
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// تسجيل المسارات
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/admin', adminRoutes);

// نقطة نهاية للتحقق من حالة الخدمة
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// التعامل مع المسارات غير الموجودة
app.use(notFoundHandler);
app.use(errorHandler);

// دالة بدء التشغيل
const startServer = async () => {
  try {
    // اختبار الاتصال بقاعدة البيانات
    console.log('⏳ جاري الاتصال بقاعدة البيانات...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('❌ فشل الاتصال بقاعدة البيانات');
    }
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // إنشاء جداول قاعدة البيانات وحساب المسؤول
    console.log('⏳ جاري إنشاء جداول قاعدة البيانات...');
    await createTables();
    console.log('✅ تم إنشاء جداول قاعدة البيانات بنجاح');
    console.log(`✅ تم إنشاء/التحقق من حساب المسؤول: ${process.env.DEFAULT_ADMIN_EMAIL}`);

    // بدء تشغيل الخادم
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`
🚀 تم تشغيل الخادم بنجاح!
📡 الخادم يعمل على المنفذ: ${PORT}
🌍 البيئة: ${process.env.NODE_ENV}
🔗 رابط API: ${process.env.API_URL}
      `);
    });

  } catch (error) {
    console.error('❌ خطأ في بدء تشغيل الخادم:', error.message);
    process.exit(1);
  }
};

// معالجة إغلاق التطبيق بشكل آمن
process.on('SIGTERM', () => {
  console.log('⏳ جاري إغلاق التطبيق بشكل آمن...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⏳ جاري إغلاق التطبيق بشكل آمن...');
  process.exit(0);
});

// بدء التطبيق
if (require.main === module) {
  console.log(`
=======================================
🏥 نظام تحليل الأعراض الصحية
=======================================
  `);
  startServer().catch((error) => {
    console.error('❌ خطأ غير متوقع:', error);
    process.exit(1);
  });
}

module.exports = app;
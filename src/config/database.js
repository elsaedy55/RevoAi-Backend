const { Pool } = require('pg');
require('dotenv').config();
const { logger } = require('../middleware/errorHandler');

// إعدادات الاتصال بقاعدة البيانات Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// التحقق من الاتصال بقاعدة البيانات
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info('Connected to Neon PostgreSQL database successfully', {
      timestamp: result.rows[0].now
    });
    client.release();
    return true;
  } catch (error) {
    logger.error('Database connection error:', error.message);
    return false;
  }
};

// إنشاء حساب المسؤول الافتراضي
const createDefaultAdmin = async () => {
  const client = await pool.connect();
  try {
    // التحقق من وجود المسؤول
    const { rows } = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [process.env.DEFAULT_ADMIN_EMAIL]
    );

    if (rows.length === 0) {
      // إنشاء حساب المسؤول إذا لم يكن موجوداً
      await client.query(
        `INSERT INTO users (
          firebase_uid,
          full_name,
          email,
          is_verified,
          is_admin,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          'admin-default-uid',
          process.env.DEFAULT_ADMIN_NAME || 'Admin',
          process.env.DEFAULT_ADMIN_EMAIL,
          true,
          true
        ]
      );
      logger.info('Default admin account created successfully', {
        email: process.env.DEFAULT_ADMIN_EMAIL
      });
    } else {
      logger.info('Default admin account already exists', {
        email: process.env.DEFAULT_ADMIN_EMAIL
      });
    }
  } catch (error) {
    logger.error('Error creating default admin:', error);
    throw error;
  } finally {
    client.release();
  }
};

// إنشاء الجداول الأساسية في قاعدة البيانات
const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      -- جدول المستخدمين
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(128) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        birth_date DATE,
        address TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- جدول الأمراض المزمنة
      CREATE TABLE IF NOT EXISTS user_conditions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        condition_name VARCHAR(100) NOT NULL,
        start_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- جدول الأدوية
      CREATE TABLE IF NOT EXISTS user_medications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        medication_name VARCHAR(100) NOT NULL,
        dosage VARCHAR(50),
        frequency VARCHAR(50),
        start_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- جدول العمليات الجراحية
      CREATE TABLE IF NOT EXISTS user_surgeries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        surgery_name VARCHAR(100) NOT NULL,
        surgery_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- جدول الأعراض
      CREATE TABLE IF NOT EXISTS symptoms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- جدول تحليل الأعراض
      CREATE TABLE IF NOT EXISTS symptom_analysis (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        symptoms TEXT[] NOT NULL,
        analysis_result JSONB NOT NULL,
        severity_level VARCHAR(20),
        is_urgent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- جدول الإشعارات
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- إنشاء Indexes
      CREATE INDEX IF NOT EXISTS idx_firebase_uid ON users(firebase_uid);
      CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_user_conditions ON user_conditions(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_user_medications ON user_medications(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_user_surgeries ON user_surgeries(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_symptom_analysis ON symptom_analysis(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications ON notifications(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_symptom_analysis_date ON symptom_analysis(created_at DESC);

      -- Function لتحديث updated_at تلقائياً
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Trigger لتحديث updated_at في جدول المستخدمين
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query('COMMIT');
    logger.info('Database tables created successfully');

    // إنشاء حساب المسؤول الافتراضي بعد إنشاء الجداول
    await createDefaultAdmin();
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating database tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// دالة لإغلاق جميع اتصالات قاعدة البيانات
const closePool = async () => {
  try {
    await pool.end();
    logger.info('Database pool has been closed');
  } catch (error) {
    logger.error('Error closing database pool:', error);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  createTables,
  closePool,
  createDefaultAdmin
};
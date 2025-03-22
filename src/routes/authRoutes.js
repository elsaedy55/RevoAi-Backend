const express = require('express');
const router = express.Router();
const firebaseAdmin = require('../config/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { pool } = require('../config/database');
const { logger } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');

// تسجيل دخول المشرفين
router.post('/admin/login', async (req, res) => {
  const { idToken } = req.body;

  try {
    // التحقق من رمز Firebase
    const decodedToken = await firebaseAdmin.verifyToken(idToken);
    const { email, uid: firebase_uid } = decodedToken;

    // التحقق من وجود المستخدم وأنه مشرف
    const { rows } = await pool.query(
      'SELECT id, full_name, email, is_admin FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );

    if (rows.length === 0 || !rows[0].is_admin) {
      throw new AppError('غير مصرح لك بالدخول كمشرف', 403);
    }

    // إنشاء رمز JWT للمشرف
    const token = await firebaseAdmin.createCustomToken(firebase_uid, {
      is_admin: true
    });

    res.json({
      success: true,
      message: 'تم تسجيل الدخول كمشرف بنجاح',
      data: {
        token,
        user: {
          id: rows[0].id,
          full_name: rows[0].full_name,
          email: rows[0].email,
          is_admin: rows[0].is_admin
        }
      }
    });

  } catch (error) {
    logger.error('Admin Login Error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'حدث خطأ أثناء تسجيل الدخول'
    });
  }
});


// تسجيل معلومات المستخدم في قاعدة البيانات بعد إنشاء حساب Firebase
router.post('/register', async (req, res) => {
  const { full_name, email, phone, birth_date, address, firebase_uid } = req.body;

  try {
    // التحقق من وجود المستخدم في قاعدة البيانات
    const { rows: existingUser } = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR firebase_uid = $2',
      [email, firebase_uid]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مسجل مسبقاً'
      });
    }

    // إنشاء المستخدم في قاعدة البيانات
    const { rows } = await pool.query(
      `INSERT INTO users (
        firebase_uid,
        full_name,
        email,
        phone,
        birth_date,
        address,
        is_verified,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING id, full_name, email, is_admin`,
      [
        firebase_uid,
        full_name,
        email,
        phone || null,
        birth_date || null,
        address || null,
        true // حساب Firebase تم التحقق منه بالفعل
      ]
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        user: rows[0]
      }
    });

  } catch (error) {
    logger.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الحساب'
    });
  }
});

// تحديث معلومات المستخدم
router.put('/profile', authenticateToken, async (req, res) => {
  const { full_name, phone, birth_date, address } = req.body;
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `UPDATE users 
       SET 
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        birth_date = COALESCE($3, birth_date),
        address = COALESCE($4, address),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, full_name, email, phone, birth_date, address`,
      [full_name, phone, birth_date, address, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث المعلومات بنجاح',
      data: {
        user: rows[0]
      }
    });

  } catch (error) {
    logger.error('Profile Update Error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المعلومات'
    });
  }
});

// الحصول على معلومات المستخدم
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, phone, birth_date, address, is_admin
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      data: {
        user: rows[0]
      }
    });

  } catch (error) {
    logger.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المعلومات'
    });
  }
});

// ترقية مستخدم إلى مسؤول
router.put('/admin/:userId', authenticateToken, requireAdmin, async (req, res) => {
  const targetUserId = req.params.userId;
  const { is_admin } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE users 
       SET is_admin = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, is_admin`,
      [is_admin, targetUserId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: is_admin ? 'تمت ترقية المستخدم إلى مسؤول' : 'تم إلغاء صلاحيات المسؤول',
      data: {
        user: rows[0]
      }
    });

  } catch (error) {
    logger.error('Admin Status Update Error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث صلاحيات المسؤول'
    });
  }
});

module.exports = router;
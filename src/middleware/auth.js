const firebaseAdmin = require('../config/firebase');
const { pool } = require('../config/database');
const { logger } = require('./errorHandler');

// التحقق من صحة رمز Firebase
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'لم يتم توفير رمز المصادقة'
      });
    }

    const idToken = authHeader.split(' ')[1];
    
    // التحقق من صحة الرمز باستخدام Firebase
    const decodedToken = await firebaseAdmin.verifyToken(idToken);
    
    // البحث عن المستخدم في قاعدة البيانات
    const { rows } = await pool.query(
      'SELECT id, email, is_admin FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    if (rows.length === 0) {
      // إنشاء مستخدم جديد في قاعدة البيانات إذا لم يكن موجوداً
      const { rows: newUser } = await pool.query(
        `INSERT INTO users (
          firebase_uid, 
          full_name, 
          email, 
          is_verified
        ) VALUES ($1, $2, $3, $4) 
        RETURNING id, email, is_admin`,
        [
          decodedToken.uid,
          decodedToken.name || '',
          decodedToken.email,
          decodedToken.email_verified || false
        ]
      );
      req.user = {
        id: newUser[0].id,
        email: newUser[0].email,
        isAdmin: newUser[0].is_admin,
        firebaseUid: decodedToken.uid
      };
    } else {
      req.user = {
        id: rows[0].id,
        email: rows[0].email,
        isAdmin: rows[0].is_admin,
        firebaseUid: decodedToken.uid
      };
    }

    next();
  } catch (error) {
    logger.error('Authentication Error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية رمز المصادقة'
      });
    }
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        message: 'رمز المصادقة غير صالح'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في المصادقة'
    });
  }
};

// التحقق من صلاحيات المسؤول
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح بالوصول - مطلوب صلاحيات المسؤول'
    });
  }
  next();
};

// التحقق من ملكية المورد
const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params.id;
      
      let query;
      switch (resourceType) {
        case 'condition':
          query = 'SELECT user_id FROM user_conditions WHERE id = $1';
          break;
        case 'medication':
          query = 'SELECT user_id FROM user_medications WHERE id = $1';
          break;
        case 'surgery':
          query = 'SELECT user_id FROM user_surgeries WHERE id = $1';
          break;
        case 'symptom_analysis':
          query = 'SELECT user_id FROM symptom_analysis WHERE id = $1';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'نوع المورد غير صالح'
          });
      }

      const { rows } = await pool.query(query, [resourceId]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المورد غير موجود'
        });
      }

      if (rows[0].user_id !== userId && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح بالوصول إلى هذا المورد'
        });
      }

      next();
    } catch (error) {
      logger.error('Resource Ownership Check Error:', error);
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ في التحقق من ملكية المورد'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  checkResourceOwnership
};
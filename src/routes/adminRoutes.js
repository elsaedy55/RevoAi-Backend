const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const symptomController = require('../controllers/symptomController');
const { validate, validationSchemas } = require('../utils/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// تطبيق middleware المصادقة والتحقق من صلاحيات المسؤول على جميع المسارات
router.use(authenticateToken);
router.use(requireAdmin);

// إدارة المستخدمين
router.get('/users',
  adminController.getUsers
);

router.get('/users/:id',
  adminController.getUserDetails
);

router.put('/users/:id/status',
  adminController.toggleUserStatus
);

router.put('/users/:id/admin',
  adminController.toggleAdminPrivileges
);

router.delete('/users/:id',
  adminController.deleteUser
);

// إحصائيات وتحليلات
router.get('/analytics/symptoms',
  symptomController.getAnalyticsStats
);

// إرسال إشعارات
router.post('/notifications',
  validate(validationSchemas.notification),
  adminController.sendNotification
);

module.exports = router;
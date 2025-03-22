const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validate, validationSchemas } = require('../utils/validation');
const { authenticateToken, checkResourceOwnership } = require('../middleware/auth');

// تطبيق middleware المصادقة على جميع المسارات
router.use(authenticateToken);

// الملف الشخصي
router.get('/profile', userController.getProfile);
router.put('/profile',
  validate(validationSchemas.registration),
  userController.updateProfile
);

// الأمراض المزمنة
router.post('/conditions',
  validate(validationSchemas.condition),
  userController.addCondition
);

router.put('/conditions/:id',
  checkResourceOwnership('condition'),
  validate(validationSchemas.condition),
  userController.updateCondition
);

router.delete('/conditions/:id',
  checkResourceOwnership('condition'),
  userController.deleteCondition
);

// الأدوية
router.post('/medications',
  validate(validationSchemas.medication),
  userController.addMedication
);

router.put('/medications/:id',
  checkResourceOwnership('medication'),
  validate(validationSchemas.medication),
  userController.updateMedication
);

router.delete('/medications/:id',
  checkResourceOwnership('medication'),
  userController.deleteMedication
);

// العمليات الجراحية
router.post('/surgeries',
  validate(validationSchemas.surgery),
  userController.addSurgery
);

router.put('/surgeries/:id',
  checkResourceOwnership('surgery'),
  validate(validationSchemas.surgery),
  userController.updateSurgery
);

router.delete('/surgeries/:id',
  checkResourceOwnership('surgery'),
  userController.deleteSurgery
);

module.exports = router;
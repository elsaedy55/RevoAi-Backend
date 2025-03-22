const express = require('express');
const router = express.Router();
const symptomController = require('../controllers/symptomController');
const { validate, validationSchemas } = require('../utils/validation');
const { authenticateToken, checkResourceOwnership } = require('../middleware/auth');
const { symptomAnalysisLimiter } = require('../middleware/rateLimiter');

// تطبيق middleware المصادقة على جميع المسارات
router.use(authenticateToken);

// تحليل الأعراض
router.post('/analyze',
  symptomAnalysisLimiter,
  validate(validationSchemas.symptomAnalysis),
  symptomController.analyzeSymptoms
);

// سجل التحليلات
router.get('/history',
  symptomController.getAnalysisHistory
);

// تحليل محدد
router.get('/:id',
  checkResourceOwnership('symptom_analysis'),
  symptomController.getAnalysisById
);

// تحديث التوصيات
router.put('/:id/recommendations',
  checkResourceOwnership('symptom_analysis'),
  symptomController.updateRecommendations
);

// حذف تحليل
router.delete('/:id',
  checkResourceOwnership('symptom_analysis'),
  symptomController.deleteAnalysis
);

module.exports = router;
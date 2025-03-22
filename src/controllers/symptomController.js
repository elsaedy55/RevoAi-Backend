const symptomAnalysisModel = require('../models/symptomAnalysis');
const emailService = require('../utils/email');
const { AppError } = require('../middleware/errorHandler');

class SymptomController {
  // تحليل الأعراض
  async analyzeSymptoms(req, res, next) {
    try {
      const userId = req.user.id;
      const { symptoms, additional_notes } = req.body;

      // تحليل الأعراض وحفظ النتائج
      const result = await symptomAnalysisModel.analyzeAndSave(
        userId,
        symptoms,
        additional_notes
      );

      // إرسال النتائج عبر البريد الإلكتروني
      await emailService.sendSymptomAnalysisResult(req.user.email, result.analysis);

      res.json({
        success: true,
        message: 'تم تحليل الأعراض بنجاح وإرسال النتائج إلى بريدك الإلكتروني',
        data: {
          analysis: result.analysis,
          severity: result.severity,
          recommendations: result.analysis.recommendations
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // الحصول على سجل التحليلات
  async getAnalysisHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const history = await symptomAnalysisModel.getUserAnalysisHistory(userId, page, limit);

      res.json({
        success: true,
        data: {
          analyses: history.analyses,
          pagination: {
            current_page: page,
            total_pages: history.pages,
            total_items: history.total,
            items_per_page: limit
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // الحصول على تحليل محدد
  async getAnalysisById(req, res, next) {
    try {
      const userId = req.user.id;
      const analysisId = req.params.id;

      const analysis = await symptomAnalysisModel.getAnalysisById(userId, analysisId);

      if (!analysis) {
        throw new AppError('التحليل غير موجود', 404);
      }

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  }

  // تحديث توصيات التحليل
  async updateRecommendations(req, res, next) {
    try {
      const userId = req.user.id;
      const analysisId = req.params.id;
      const { recommendations } = req.body;

      const updatedAnalysis = await symptomAnalysisModel.updateRecommendations(
        userId,
        analysisId,
        recommendations
      );

      if (!updatedAnalysis) {
        throw new AppError('التحليل غير موجود', 404);
      }

      res.json({
        success: true,
        message: 'تم تحديث التوصيات بنجاح',
        data: updatedAnalysis
      });
    } catch (error) {
      next(error);
    }
  }

  // حذف تحليل
  async deleteAnalysis(req, res, next) {
    try {
      const userId = req.user.id;
      const analysisId = req.params.id;

      const result = await symptomAnalysisModel.deleteAnalysis(userId, analysisId);

      if (!result) {
        throw new AppError('التحليل غير موجود', 404);
      }

      res.json({
        success: true,
        message: 'تم حذف التحليل بنجاح'
      });
    } catch (error) {
      next(error);
    }
  }

  // الحصول على إحصائيات التحليلات (للمسؤولين)
  async getAnalyticsStats(req, res, next) {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // آخر 30 يوم
      const endDate = req.query.end_date ? new Date(req.query.end_date) : new Date();

      const stats = await symptomAnalysisModel.getAnalyticsStats(startDate, endDate);

      res.json({
        success: true,
        data: {
          general_stats: stats.generalStats,
          common_symptoms: stats.commonSymptoms,
          date_range: {
            start: startDate,
            end: endDate
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SymptomController();
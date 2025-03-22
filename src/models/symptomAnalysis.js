const { pool } = require('../config/database');
const redisUtils = require('../utils/redis');
const aiService = require('../utils/ai');
const medicalDataModel = require('./medicalData');

class SymptomAnalysisModel {
  // تحليل الأعراض وحفظ النتائج
  async analyzeAndSave(userId, symptoms, additionalNotes = '') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // الحصول على البيانات الطبية للمستخدم
      const userMedicalData = await medicalDataModel.getAllMedicalData(userId);

      // الحصول على نتائج التحليل من الذاكرة المؤقتة أو تحليل جديد
      let analysisResult = await redisUtils.getCachedSymptomAnalysis(userId, symptoms);
      
      if (!analysisResult) {
        // تحليل الأعراض باستخدام خدمة الذكاء الاصطناعي
        analysisResult = await aiService.analyzeSymptoms(userId, symptoms, userMedicalData);
        
        // تخزين النتائج في الذاكرة المؤقتة
        await redisUtils.cacheSymptomAnalysis(userId, symptoms, analysisResult);
      }

      // حفظ نتائج التحليل في قاعدة البيانات
      const { rows } = await client.query(
        `INSERT INTO symptom_analysis (
          user_id,
          symptoms,
          diagnosis,
          confidence_score,
          recommendations
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          userId,
          symptoms,
          analysisResult.diagnosis,
          analysisResult.confidence_score,
          analysisResult.recommendations
        ]
      );

      await client.query('COMMIT');
      return {
        analysis: rows[0],
        severity: aiService.evaluateSeverity(symptoms, analysisResult.diagnosis)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // الحصول على سجل تحليلات المستخدم
  async getUserAnalysisHistory(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // الحصول على التحليلات مع الترقيم
    const { rows } = await pool.query(
      `SELECT * FROM symptom_analysis 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // الحصول على العدد الإجمالي للتحليلات
    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*) FROM symptom_analysis WHERE user_id = $1',
      [userId]
    );

    return {
      analyses: rows,
      total: parseInt(countRows[0].count),
      pages: Math.ceil(countRows[0].count / limit)
    };
  }

  // الحصول على تحليل محدد
  async getAnalysisById(userId, analysisId) {
    const { rows } = await pool.query(
      'SELECT * FROM symptom_analysis WHERE id = $1 AND user_id = $2',
      [analysisId, userId]
    );
    return rows[0];
  }

  // الحصول على إحصائيات التحليلات (للمسؤولين)
  async getAnalyticsStats(startDate, endDate) {
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_analyses,
        AVG(confidence_score) as avg_confidence,
        COUNT(DISTINCT user_id) as unique_users,
        MODE() WITHIN GROUP (ORDER BY diagnosis) as common_diagnosis
       FROM symptom_analysis
       WHERE created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    const symptoms = await pool.query(
      `SELECT unnest(symptoms) as symptom, COUNT(*) as frequency
       FROM symptom_analysis
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY symptom
       ORDER BY frequency DESC
       LIMIT 10`,
      [startDate, endDate]
    );

    return {
      generalStats: stats.rows[0],
      commonSymptoms: symptoms.rows
    };
  }

  // حذف تحليل (للمستخدم أو المسؤول)
  async deleteAnalysis(userId, analysisId) {
    const { rows } = await pool.query(
      'DELETE FROM symptom_analysis WHERE id = $1 AND user_id = $2 RETURNING id',
      [analysisId, userId]
    );
    return rows[0];
  }

  // تحديث توصيات التحليل
  async updateRecommendations(userId, analysisId, newRecommendations) {
    const { rows } = await pool.query(
      `UPDATE symptom_analysis 
       SET recommendations = $1 
       WHERE id = $2 AND user_id = $3 
       RETURNING *`,
      [newRecommendations, analysisId, userId]
    );
    return rows[0];
  }
}

module.exports = new SymptomAnalysisModel();
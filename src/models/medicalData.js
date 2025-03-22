const { pool } = require('../config/database');

class MedicalDataModel {
  // إضافة مرض مزمن
  async addCondition(userId, conditionData) {
    const { rows } = await pool.query(
      `INSERT INTO user_conditions (
        user_id, 
        condition_name, 
        start_date, 
        notes
      ) VALUES ($1, $2, $3, $4) 
      RETURNING id, condition_name, start_date, notes, created_at`,
      [userId, conditionData.condition_name, conditionData.start_date, conditionData.notes]
    );
    return rows[0];
  }

  // إضافة دواء
  async addMedication(userId, medicationData) {
    const { rows } = await pool.query(
      `INSERT INTO user_medications (
        user_id, 
        medication_name, 
        dosage, 
        frequency, 
        start_date
      ) VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, medication_name, dosage, frequency, start_date, created_at`,
      [
        userId,
        medicationData.medication_name,
        medicationData.dosage,
        medicationData.frequency,
        medicationData.start_date
      ]
    );
    return rows[0];
  }

  // إضافة عملية جراحية
  async addSurgery(userId, surgeryData) {
    const { rows } = await pool.query(
      `INSERT INTO user_surgeries (
        user_id, 
        surgery_name, 
        surgery_date, 
        notes
      ) VALUES ($1, $2, $3, $4) 
      RETURNING id, surgery_name, surgery_date, notes, created_at`,
      [userId, surgeryData.surgery_name, surgeryData.surgery_date, surgeryData.notes]
    );
    return rows[0];
  }

  // الحصول على جميع الأمراض المزمنة للمستخدم
  async getUserConditions(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM user_conditions WHERE user_id = $1 ORDER BY start_date DESC',
      [userId]
    );
    return rows;
  }

  // الحصول على جميع الأدوية للمستخدم
  async getUserMedications(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM user_medications WHERE user_id = $1 ORDER BY start_date DESC',
      [userId]
    );
    return rows;
  }

  // الحصول على جميع العمليات الجراحية للمستخدم
  async getUserSurgeries(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM user_surgeries WHERE user_id = $1 ORDER BY surgery_date DESC',
      [userId]
    );
    return rows;
  }

  // الحصول على جميع البيانات الطبية للمستخدم
  async getAllMedicalData(userId) {
    const client = await pool.connect();
    try {
      const conditions = await this.getUserConditions(userId);
      const medications = await this.getUserMedications(userId);
      const surgeries = await this.getUserSurgeries(userId);

      return {
        conditions,
        medications,
        surgeries
      };
    } finally {
      client.release();
    }
  }

  // تحديث مرض مزمن
  async updateCondition(userId, conditionId, updateData) {
    const { rows } = await pool.query(
      `UPDATE user_conditions 
       SET condition_name = $1, 
           start_date = $2, 
           notes = $3 
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
      [
        updateData.condition_name,
        updateData.start_date,
        updateData.notes,
        conditionId,
        userId
      ]
    );
    return rows[0];
  }

  // تحديث دواء
  async updateMedication(userId, medicationId, updateData) {
    const { rows } = await pool.query(
      `UPDATE user_medications 
       SET medication_name = $1, 
           dosage = $2, 
           frequency = $3, 
           start_date = $4 
       WHERE id = $5 AND user_id = $6 
       RETURNING *`,
      [
        updateData.medication_name,
        updateData.dosage,
        updateData.frequency,
        updateData.start_date,
        medicationId,
        userId
      ]
    );
    return rows[0];
  }

  // تحديث عملية جراحية
  async updateSurgery(userId, surgeryId, updateData) {
    const { rows } = await pool.query(
      `UPDATE user_surgeries 
       SET surgery_name = $1, 
           surgery_date = $2, 
           notes = $3 
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
      [
        updateData.surgery_name,
        updateData.surgery_date,
        updateData.notes,
        surgeryId,
        userId
      ]
    );
    return rows[0];
  }

  // حذف مرض مزمن
  async deleteCondition(userId, conditionId) {
    const { rows } = await pool.query(
      'DELETE FROM user_conditions WHERE id = $1 AND user_id = $2 RETURNING id',
      [conditionId, userId]
    );
    return rows[0];
  }

  // حذف دواء
  async deleteMedication(userId, medicationId) {
    const { rows } = await pool.query(
      'DELETE FROM user_medications WHERE id = $1 AND user_id = $2 RETURNING id',
      [medicationId, userId]
    );
    return rows[0];
  }

  // حذف عملية جراحية
  async deleteSurgery(userId, surgeryId) {
    const { rows } = await pool.query(
      'DELETE FROM user_surgeries WHERE id = $1 AND user_id = $2 RETURNING id',
      [surgeryId, userId]
    );
    return rows[0];
  }
}

module.exports = new MedicalDataModel();
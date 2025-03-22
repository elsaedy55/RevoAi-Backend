const { pool } = require('../config/database');

class UserModel {
  // البحث عن مستخدم بواسطة Firebase UID
  async findByFirebaseUid(firebaseUid) {
    const { rows } = await pool.query(
      'SELECT id, firebase_uid, full_name, email, phone, birth_date, address, is_verified, is_admin FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    return rows[0];
  }

  // البحث عن مستخدم بواسطة المعرف
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, firebase_uid, full_name, email, phone, birth_date, address, is_verified, is_admin FROM users WHERE id = $1',
      [id]
    );
    return rows[0];
  }

  // البحث عن مستخدم بواسطة البريد الإلكتروني
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT id, firebase_uid, full_name, email, phone, birth_date, address, is_verified, is_admin FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return rows[0];
  }

  // تحديث بيانات المستخدم
  async update(id, updateData) {
    const validFields = ['full_name', 'phone', 'birth_date', 'address'];
    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (validFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${paramCount} 
      RETURNING id, firebase_uid, full_name, email, phone, birth_date, address, is_verified, is_admin
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // الحصول على قائمة المستخدمين (للمسؤولين)
  async listUsers(page = 1, limit = 10, searchQuery = '') {
    const offset = (page - 1) * limit;
    const values = [];
    let paramCount = 1;
    
    let query = `
      SELECT 
        id, firebase_uid, full_name, email, phone, is_verified, is_admin, created_at 
      FROM users
      WHERE 1=1
    `;

    if (searchQuery) {
      query += ` AND (
        full_name ILIKE $${paramCount} OR 
        email ILIKE $${paramCount} OR 
        phone ILIKE $${paramCount}
      )`;
      values.push(`%${searchQuery}%`);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    
    // الحصول على العدد الإجمالي للمستخدمين
    const countQuery = 'SELECT COUNT(*) FROM users';
    const { rows: countRows } = await pool.query(countQuery);
    
    return {
      users: rows,
      total: parseInt(countRows[0].count),
      pages: Math.ceil(countRows[0].count / limit)
    };
  }

  // حذف مستخدم (للمسؤولين)
  async deleteUser(id) {
    const { rows } = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return rows[0];
  }

  // تعيين حالة المسؤول
  async setAdminStatus(id, isAdmin) {
    const { rows } = await pool.query(
      'UPDATE users SET is_admin = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [isAdmin, id]
    );
    return rows[0];
  }

  // تحديث حالة التحقق من البريد الإلكتروني
  async updateEmailVerificationStatus(id, isVerified) {
    const { rows } = await pool.query(
      'UPDATE users SET is_verified = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [isVerified, id]
    );
    return rows[0];
  }
}

module.exports = new UserModel();
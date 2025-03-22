const userModel = require('../models/user');
const emailService = require('../utils/email');
const { AppError } = require('../middleware/errorHandler');

class AdminController {
  // الحصول على قائمة المستخدمين
  async getUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';

      const result = await userModel.listUsers(page, limit, search);

      res.json({
        success: true,
        data: {
          users: result.users,
          pagination: {
            current_page: page,
            total_pages: result.pages,
            total_items: result.total,
            items_per_page: limit
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // الحصول على تفاصيل مستخدم محدد
  async getUserDetails(req, res, next) {
    try {
      const userId = req.params.id;
      const user = await userModel.findById(userId);

      if (!user) {
        throw new AppError('المستخدم غير موجود', 404);
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          birth_date: user.birth_date,
          address: user.address,
          is_verified: user.is_verified,
          is_admin: user.is_admin,
          created_at: user.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // تعديل حالة المستخدم (تفعيل/تعطيل)
  async toggleUserStatus(req, res, next) {
    try {
      const userId = req.params.id;
      const { is_active } = req.body;

      // تحديث حالة المستخدم
      const { rows } = await pool.query(
        'UPDATE users SET is_verified = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
        [is_active, userId]
      );

      if (rows.length === 0) {
        throw new AppError('المستخدم غير موجود', 404);
      }

      // إرسال إشعار للمستخدم
      const user = await userModel.findById(userId);
      if (user) {
        const notificationTitle = is_active ? 'تم تفعيل حسابك' : 'تم تعطيل حسابك';
        const notificationMessage = is_active
          ? 'تم تفعيل حسابك من قبل المسؤول. يمكنك الآن استخدام جميع ميزات التطبيق.'
          : 'تم تعطيل حسابك من قبل المسؤول. يرجى التواصل مع الدعم الفني للمزيد من المعلومات.';

        await emailService.sendEmail(user.email, {
          subject: notificationTitle,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif;">
              <h2>${notificationTitle}</h2>
              <p>${notificationMessage}</p>
            </div>
          `
        });
      }

      res.json({
        success: true,
        message: is_active ? 'تم تفعيل حساب المستخدم بنجاح' : 'تم تعطيل حساب المستخدم بنجاح'
      });
    } catch (error) {
      next(error);
    }
  }

  // منح أو إلغاء صلاحيات المسؤول
  async toggleAdminPrivileges(req, res, next) {
    try {
      const userId = req.params.id;
      const { is_admin } = req.body;

      // التحقق من أن المستخدم ليس نفسه
      if (userId === req.user.id) {
        throw new AppError('لا يمكنك تغيير صلاحياتك بنفسك', 400);
      }

      const { rows } = await pool.query(
        'UPDATE users SET is_admin = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
        [is_admin, userId]
      );

      if (rows.length === 0) {
        throw new AppError('المستخدم غير موجود', 404);
      }

      res.json({
        success: true,
        message: is_admin 
          ? 'تم منح صلاحيات المسؤول بنجاح' 
          : 'تم إلغاء صلاحيات المسؤول بنجاح'
      });
    } catch (error) {
      next(error);
    }
  }

  // حذف مستخدم
  async deleteUser(req, res, next) {
    try {
      const userId = req.params.id;

      // التحقق من أن المستخدم ليس نفسه
      if (userId === req.user.id) {
        throw new AppError('لا يمكنك حذف حسابك بهذه الطريقة', 400);
      }

      const result = await userModel.deleteUser(userId);

      if (!result) {
        throw new AppError('المستخدم غير موجود', 404);
      }

      res.json({
        success: true,
        message: 'تم حذف المستخدم بنجاح'
      });
    } catch (error) {
      next(error);
    }
  }

  // إرسال إشعار للمستخدمين
  async sendNotification(req, res, next) {
    try {
      const { user_ids, title, message } = req.body;

      // إذا لم يتم تحديد مستخدمين، سيتم إرسال الإشعار لجميع المستخدمين
      const query = user_ids && user_ids.length > 0
        ? 'SELECT email FROM users WHERE id = ANY($1)'
        : 'SELECT email FROM users WHERE is_verified = true';
      
      const values = user_ids && user_ids.length > 0 ? [user_ids] : [];
      
      const { rows } = await pool.query(query, values);
      const emails = rows.map(row => row.email);

      // إرسال الإشعارات
      const emailPromises = emails.map(email =>
        emailService.sendEmail(email, {
          subject: title,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif;">
              <h2>${title}</h2>
              <p>${message}</p>
            </div>
          `
        })
      );

      await Promise.all(emailPromises);

      res.json({
        success: true,
        message: `تم إرسال الإشعار بنجاح إلى ${emails.length} مستخدم`,
        data: {
          recipients_count: emails.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
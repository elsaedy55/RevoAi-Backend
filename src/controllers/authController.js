const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/config');
const userModel = require('../models/user');
const emailService = require('../utils/email');
const { AppError } = require('../middleware/errorHandler');
const redisUtils = require('../utils/redis');

class AuthController {
  // إنشاء رمز JWT
  #generateToken(userId) {
    return jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  // إنشاء رمز تحقق
  #generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // تسجيل مستخدم جديد
  async register(req, res, next) {
    try {
      // إنشاء المستخدم في قاعدة البيانات
      const user = await userModel.create(req.body);

      // إنشاء رمز التحقق
      const verificationToken = this.#generateVerificationToken();
      await redisUtils.set(
        `verification:${user.id}`,
        verificationToken,
        config.email.verificationTokenExpiry
      );

      // إرسال بريد التحقق
      await emailService.sendVerificationEmail(user.email, verificationToken);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب',
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // تسجيل الدخول
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // البحث عن المستخدم
      const user = await userModel.findByEmail(email);
      if (!user) {
        throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
      }

      // التحقق من كلمة المرور
      const isValidPassword = await userModel.verifyPassword(password, user.password);
      if (!isValidPassword) {
        throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
      }

      // التحقق من تفعيل الحساب
      if (!user.is_verified) {
        throw new AppError('يرجى تفعيل حسابك من خلال البريد الإلكتروني أولاً', 403);
      }

      // إنشاء وإرسال رمز JWT
      const token = this.#generateToken(user.id);

      res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        data: {
          token,
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            is_admin: user.is_admin
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // تأكيد البريد الإلكتروني
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      const { userId } = req.params;

      // التحقق من صحة الرمز
      const storedToken = await redisUtils.get(`verification:${userId}`);
      if (!storedToken || storedToken !== token) {
        throw new AppError('رمز التحقق غير صالح أو منتهي الصلاحية', 400);
      }

      // تفعيل الحساب
      await userModel.verifyEmail(userId);
      
      // حذف رمز التحقق
      await redisUtils.del(`verification:${userId}`);

      res.json({
        success: true,
        message: 'تم تفعيل الحساب بنجاح'
      });
    } catch (error) {
      next(error);
    }
  }

  // طلب إعادة تعيين كلمة المرور
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const user = await userModel.findByEmail(email);

      if (user) {
        // إنشاء رمز إعادة التعيين
        const resetToken = this.#generateVerificationToken();
        await redisUtils.set(
          `reset:${user.id}`,
          resetToken,
          config.email.resetPasswordTokenExpiry
        );

        // إرسال بريد إعادة التعيين
        await emailService.sendPasswordResetEmail(email, resetToken);
      }

      // نرسل نفس الرسالة سواء وجد المستخدم أم لا لأسباب أمنية
      res.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة تعيين كلمة المرور'
      });
    } catch (error) {
      next(error);
    }
  }

  // إعادة تعيين كلمة المرور
  async resetPassword(req, res, next) {
    try {
      const { token } = req.query;
      const { userId } = req.params;
      const { password } = req.body;

      // التحقق من صحة الرمز
      const storedToken = await redisUtils.get(`reset:${userId}`);
      if (!storedToken || storedToken !== token) {
        throw new AppError('رمز إعادة التعيين غير صالح أو منتهي الصلاحية', 400);
      }

      // تحديث كلمة المرور
      await userModel.updatePassword(userId, password);
      
      // حذف رمز إعادة التعيين
      await redisUtils.del(`reset:${userId}`);

      res.json({
        success: true,
        message: 'تم إعادة تعيين كلمة المرور بنجاح'
      });
    } catch (error) {
      next(error);
    }
  }

  // تغيير كلمة المرور
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { current_password, new_password } = req.body;

      // التحقق من كلمة المرور الحالية
      const user = await userModel.findById(userId);
      const isValidPassword = await userModel.verifyPassword(current_password, user.password);
      
      if (!isValidPassword) {
        throw new AppError('كلمة المرور الحالية غير صحيحة', 401);
      }

      // تحديث كلمة المرور
      await userModel.updatePassword(userId, new_password);

      res.json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
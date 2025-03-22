const userModel = require('../models/user');
const medicalDataModel = require('../models/medicalData');
const { AppError } = require('../middleware/errorHandler');

class UserController {
  // الحصول على الملف الشخصي للمستخدم
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await userModel.findById(userId);

      if (!user) {
        throw new AppError('المستخدم غير موجود', 404);
      }

      // جلب البيانات الطبية للمستخدم
      const medicalData = await medicalDataModel.getAllMedicalData(userId);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            birth_date: user.birth_date,
            address: user.address,
            is_verified: user.is_verified
          },
          medical_data: medicalData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // تحديث الملف الشخصي
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updatedUser = await userModel.update(userId, req.body);

      if (!updatedUser) {
        throw new AppError('فشل تحديث البيانات', 400);
      }

      res.json({
        success: true,
        message: 'تم تحديث البيانات بنجاح',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  // إضافة مرض مزمن
  async addCondition(req, res, next) {
    try {
      const userId = req.user.id;
      const condition = await medicalDataModel.addCondition(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'تمت إضافة المرض بنجاح',
        data: condition
      });
    } catch (error) {
      next(error);
    }
  }

  // إضافة دواء
  async addMedication(req, res, next) {
    try {
      const userId = req.user.id;
      const medication = await medicalDataModel.addMedication(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'تمت إضافة الدواء بنجاح',
        data: medication
      });
    } catch (error) {
      next(error);
    }
  }

  // إضافة عملية جراحية
  async addSurgery(req, res, next) {
    try {
      const userId = req.user.id;
      const surgery = await medicalDataModel.addSurgery(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'تمت إضافة العملية الجراحية بنجاح',
        data: surgery
      });
    } catch (error) {
      next(error);
    }
  }

  // تحديث مرض مزمن
  async updateCondition(req, res, next) {
    try {
      const userId = req.user.id;
      const conditionId = req.params.id;
      const condition = await medicalDataModel.updateCondition(userId, conditionId, req.body);

      if (!condition) {
        throw new AppError('المرض غير موجود', 404);
      }

      res.json({
        success: true,
        message: 'تم تحديث بيانات المرض بنجاح',
        data: condition
      });
    } catch (error) {
      next(error);
    }
  }

  // تحديث دواء
  async updateMedication(req, res, next) {
    try {
      const userId = req.user.id;
      const medicationId = req.params.id;
      const medication = await medicalDataModel.updateMedication(userId, medicationId, req.body);

      if (!medication) {
        throw new AppError('الدواء غير موجود', 404);
      }

      res.json({
        success: true,
        message: 'تم تحديث بيانات الدواء بنجاح',
        data: medication
      });
    } catch (error) {
      next(error);
    }
  }

  // تحديث عملية جراحية
  async updateSurgery(req, res, next) {
    try {
      const userId = req.user.id;
      const surgeryId = req.params.id;
      const surgery = await medicalDataModel.updateSurgery(userId, surgeryId, req.body);

      if (!surgery) {
        throw new AppError('العملية الجراحية غير موجودة', 404);
      }

      res.json({
        success: true,
        message: 'تم تحديث بيانات العملية الجراحية بنجاح',
        data: surgery
      });
    } catch (error) {
      next(error);
    }
  }

  // حذف مرض مزمن
  async deleteCondition(req, res, next) {
    try {
      const userId = req.user.id;
      const conditionId = req.params.id;
      const result = await medicalDataModel.deleteCondition(userId, conditionId);

      if (!result) {
        throw new AppError('المرض غير موجود', 404);
      }

      res.json({
        success: true,
        message: 'تم حذف المرض بنجاح'
      });
    } catch (error) {
      next(error);
    }
  }

  // حذف دواء
  async deleteMedication(req, res, next) {
    try {
      const userId = req.user.id;
      const medicationId = req.params.id;
      const result = await medicalDataModel.deleteMedication(userId, medicationId);

      if (!result) {
        throw new AppError('الدواء غير موجود', 404);
      }

      res.json({
        success: true,
        message: 'تم حذف الدواء بنجاح'
      });
    } catch (error) {
      next(error);
    }
  }

  // حذف عملية جراحية
  async deleteSurgery(req, res, next) {
    try {
      const userId = req.user.id;
      const surgeryId = req.params.id;
      const result = await medicalDataModel.deleteSurgery(userId, surgeryId);

      if (!result) {
        throw new AppError('العملية الجراحية غير موجودة', 404);
      }

      res.json({
        success: true,
        message: 'تم حذف العملية الجراحية بنجاح'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
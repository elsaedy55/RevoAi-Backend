const { z } = require('zod');

// مخططات التحقق من صحة البيانات
const validationSchemas = {
  // مخطط تسجيل المستخدم
  registration: z.object({
    full_name: z.string()
      .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل')
      .max(100, 'الاسم لا يمكن أن يتجاوز 100 حرف'),
    email: z.string()
      .email('البريد الإلكتروني غير صالح'),
    password: z.string()
      .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على حروف كبيرة وصغيرة وأرقام'),
    phone: z.string()
      .optional()
      .refine(val => !val || /^[+]?[\d]{10,14}$/.test(val), 'رقم الهاتف غير صالح'),
    birth_date: z.string()
      .optional()
      .refine(val => !val || !isNaN(Date.parse(val)), 'تاريخ الميلاد غير صالح'),
    address: z.string()
      .optional()
  }),

  // مخطط تسجيل الدخول
  login: z.object({
    email: z.string()
      .email('البريد الإلكتروني غير صالح'),
    password: z.string()
      .min(1, 'كلمة المرور مطلوبة')
  }),

  // مخطط إضافة مرض مزمن
  condition: z.object({
    condition_name: z.string()
      .min(2, 'اسم المرض يجب أن يكون حرفين على الأقل')
      .max(100, 'اسم المرض لا يمكن أن يتجاوز 100 حرف'),
    start_date: z.string()
      .refine(val => !isNaN(Date.parse(val)), 'تاريخ بداية المرض غير صالح'),
    notes: z.string()
      .optional()
  }),

  // مخطط إضافة دواء
  medication: z.object({
    medication_name: z.string()
      .min(2, 'اسم الدواء يجب أن يكون حرفين على الأقل')
      .max(100, 'اسم الدواء لا يمكن أن يتجاوز 100 حرف'),
    dosage: z.string()
      .optional(),
    frequency: z.string()
      .optional(),
    start_date: z.string()
      .refine(val => !isNaN(Date.parse(val)), 'تاريخ بداية تناول الدواء غير صالح')
  }),

  // مخطط إضافة عملية جراحية
  surgery: z.object({
    surgery_name: z.string()
      .min(2, 'اسم العملية يجب أن يكون حرفين على الأقل')
      .max(100, 'اسم العملية لا يمكن أن يتجاوز 100 حرف'),
    surgery_date: z.string()
      .refine(val => !isNaN(Date.parse(val)), 'تاريخ العملية غير صالح'),
    notes: z.string()
      .optional()
  }),

  // مخطط تحليل الأعراض
  symptomAnalysis: z.object({
    symptoms: z.array(z.string())
      .min(1, 'يجب إدخال عرض واحد على الأقل')
      .max(10, 'لا يمكن إدخال أكثر من 10 أعراض'),
    additional_notes: z.string()
      .optional()
  }),

  // مخطط تغيير كلمة المرور
  passwordChange: z.object({
    current_password: z.string()
      .min(1, 'كلمة المرور الحالية مطلوبة'),
    new_password: z.string()
      .min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على حروف كبيرة وصغيرة وأرقام')
  }),

  // مخطط إرسال الإشعارات
  notification: z.object({
    title: z.string()
      .min(3, 'عنوان الإشعار يجب أن يكون 3 أحرف على الأقل')
      .max(100, 'عنوان الإشعار لا يمكن أن يتجاوز 100 حرف'),
    message: z.string()
      .min(10, 'محتوى الإشعار يجب أن يكون 10 أحرف على الأقل'),
    user_ids: z.array(z.number())
      .optional()
  })
};

// دالة مساعدة للتحقق من صحة البيانات
const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }
  };
};

module.exports = {
  validationSchemas,
  validate
};
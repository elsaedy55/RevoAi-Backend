const { OpenAI } = require('openai');
const { pool } = require('../config/database');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // تحضير البيانات الطبية للمستخدم
  prepareUserMedicalContext(user, conditions, medications, surgeries) {
    return `
معلومات المريض:
- العمر: ${this.calculateAge(user.birth_date)} سنة
- الأمراض المزمنة: ${conditions.map(c => `${c.condition_name} (منذ ${c.start_date})`).join(', ')}
- الأدوية الحالية: ${medications.map(m => `${m.medication_name} (${m.dosage}, ${m.frequency})`).join(', ')}
- العمليات الجراحية السابقة: ${surgeries.map(s => `${s.surgery_name} (${s.surgery_date})`).join(', ')}
    `.trim();
  }

  // حساب عمر المستخدم
  calculateAge(birthDate) {
    if (!birthDate) return 'غير محدد';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  // تحليل الأعراض باستخدام OpenAI
  async analyzeSymptoms(userId, symptoms, medicalData) {
    try {
      // التحقق من وجود تحليل سابق في قاعدة البيانات
      const { rows: existingAnalysis } = await pool.query(
        `SELECT analysis_result 
         FROM symptom_analysis 
         WHERE user_id = $1 
         AND symptoms = $2 
         AND created_at > NOW() - INTERVAL '24 hours'
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId, symptoms]
      );

      if (existingAnalysis.length > 0) {
        return existingAnalysis[0].analysis_result;
      }

      const userContext = this.prepareUserMedicalContext(
        medicalData.user,
        medicalData.conditions,
        medicalData.medications,
        medicalData.surgeries
      );

      const prompt = `
أنت طبيب خبير في التشخيص الطبي. قم بتحليل الأعراض التالية مع الأخذ في الاعتبار التاريخ الطبي للمريض.

الأعراض المقدمة:
${symptoms.join('\n')}

السياق الطبي للمريض:
${userContext}

قم بتقديم:
1. التشخيصات المحتملة مع نسبة الاحتمال لكل تشخيص
2. مستوى خطورة الحالة
3. توصيات وإرشادات طبية
4. هل يحتاج المريض لزيارة طبيب بشكل عاجل؟

ملاحظة: قدم إجابتك بتنسيق JSON بالشكل التالي:
{
  "diagnoses": [
    { "condition": "اسم الحالة", "probability": 0.8, "description": "وصف مختصر" }
  ],
  "severity": { "level": "منخفض/متوسط/مرتفع", "description": "وصف مستوى الخطورة" },
  "recommendations": ["توصية 1", "توصية 2"],
  "urgentCare": true/false,
  "followUpTime": "فترة المتابعة المقترحة"
}
      `.trim();

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "أنت طبيب خبير متخصص في التشخيص الطبي. تقدم تحليلاً دقيقاً وموضوعياً للأعراض."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE),
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS),
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);

      // حفظ نتيجة التحليل في قاعدة البيانات
      await pool.query(
        `INSERT INTO symptom_analysis (
          user_id, 
          symptoms, 
          analysis_result, 
          created_at
        ) VALUES ($1, $2, $3, NOW())`,
        [userId, symptoms, result]
      );

      return result;
    } catch (error) {
      console.error('OpenAI Analysis Error:', error);
      throw new Error('حدث خطأ في تحليل الأعراض. يرجى المحاولة مرة أخرى.');
    }
  }

  // تقييم خطورة الحالة بشكل منفصل
  evaluateSeverity(symptoms, diagnosis) {
    const emergencySymptoms = [
      'ألم شديد في الصدر',
      'صعوبة في التنفس',
      'فقدان الوعي',
      'نزيف شديد',
      'ارتفاع شديد في درجة الحرارة',
      'شلل مفاجئ',
      'تشوش شديد',
      'ألم شديد ومفاجئ في البطن'
    ];

    const hasEmergencySymptoms = symptoms.some(symptom => 
      emergencySymptoms.some(emergency => 
        symptom.toLowerCase().includes(emergency.toLowerCase())
      )
    );

    return {
      isEmergency: hasEmergencySymptoms,
      severityLevel: hasEmergencySymptoms ? 'عالي' : 'متوسط',
      recommendation: hasEmergencySymptoms 
        ? 'يرجى التوجه إلى أقرب مستشفى أو الاتصال بالطوارئ فوراً'
        : 'يرجى استشارة الطبيب في أقرب وقت ممكن'
    };
  }

  // توليد توصيات وقائية
  generatePreventiveRecommendations(medicalData) {
    const recommendations = [];

    if (medicalData.conditions.length > 0) {
      recommendations.push(
        'متابعة دورية مع الطبيب المختص',
        'الالتزام بمواعيد الأدوية',
        'إجراء الفحوصات الدورية اللازمة'
      );
    }

    recommendations.push(
      'ممارسة الرياضة بانتظام (30 دقيقة يومياً على الأقل)',
      'اتباع نظام غذائي صحي ومتوازن',
      'الحصول على قسط كافٍ من النوم (7-9 ساعات)',
      'شرب كمية كافية من الماء (8 أكواب يومياً)',
      'تجنب التدخين والكحول',
      'إدارة التوتر والضغط النفسي'
    );

    return recommendations;
  }
}

module.exports = new AIService();
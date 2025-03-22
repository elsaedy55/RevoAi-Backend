const sgMail = require('@sendgrid/mail');
const config = require('../config/config');

sgMail.setApiKey(config.sendgrid.apiKey);

const emailTemplates = {
  verifyEmail: (token) => ({
    subject: 'تأكيد البريد الإلكتروني',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>مرحباً بك في تطبيق الرعاية الصحية</h2>
        <p>شكراً لتسجيلك معنا. يرجى الضغط على الرابط التالي لتأكيد بريدك الإلكتروني:</p>
        <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}" 
           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          تأكيد البريد الإلكتروني
        </a>
        <p>ينتهي هذا الرابط خلال 24 ساعة.</p>
        <p>إذا لم تقم بالتسجيل في تطبيقنا، يمكنك تجاهل هذا البريد.</p>
      </div>
    `
  }),

  resetPassword: (token) => ({
    subject: 'إعادة تعيين كلمة المرور',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>إعادة تعيين كلمة المرور</h2>
        <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. يرجى الضغط على الرابط التالي:</p>
        <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}" 
           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          إعادة تعيين كلمة المرور
        </a>
        <p>ينتهي هذا الرابط خلال ساعة واحدة.</p>
        <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.</p>
      </div>
    `
  }),

  symptomAnalysisResult: (analysis) => ({
    subject: 'نتائج تحليل الأعراض',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>نتائج تحليل الأعراض</h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
          <h3>التشخيص المحتمل:</h3>
          <p>${analysis.diagnosis}</p>
          
          <h3>نسبة الثقة:</h3>
          <p>${(analysis.confidence_score * 100).toFixed(2)}%</p>
          
          <h3>التوصيات:</h3>
          <p>${analysis.recommendations}</p>
        </div>
        <p style="color: #666;">
          ملاحظة: هذه النتائج هي تحليل أولي فقط ولا تعتبر تشخيصاً طبياً رسمياً. 
          يرجى استشارة الطبيب للحصول على تشخيص دقيق.
        </p>
      </div>
    `
  })
};

const emailService = {
  async sendEmail(to, template) {
    try {
      const msg = {
        to,
        from: config.sendgrid.fromEmail,
        subject: template.subject,
        html: template.html,
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Send Email Error:', error);
      return false;
    }
  },

  async sendVerificationEmail(to, token) {
    return this.sendEmail(to, emailTemplates.verifyEmail(token));
  },

  async sendPasswordResetEmail(to, token) {
    return this.sendEmail(to, emailTemplates.resetPassword(token));
  },

  async sendSymptomAnalysisResult(to, analysis) {
    return this.sendEmail(to, emailTemplates.symptomAnalysisResult(analysis));
  }
};

module.exports = emailService;
const admin = require('firebase-admin');
require('dotenv').config();

try {
  // تهيئة Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // التعامل مع المفتاح الخاص بتنسيق صحيح
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? 
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    })
  });

  console.log('✅ تم تهيئة Firebase Admin بنجاح');
} catch (error) {
  console.error('❌ خطأ في تهيئة Firebase Admin:', error);
  // لا نريد إيقاف التطبيق في حالة فشل تهيئة Firebase
}

// تصدير مثيل Firebase Auth
const auth = admin.auth();

// دوال مساعدة للتعامل مع Firebase
const firebaseAdmin = {
  // إنشاء رمز مخصص
  async createCustomToken(uid, claims = {}) {
    try {
      const token = await admin.auth().createCustomToken(uid, claims);
      return token;
    } catch (error) {
      console.error('Firebase Create Custom Token Error:', error);
      throw error;
    }
  },

  // التحقق من صحة رمز المصادقة
  async verifyToken(idToken) {
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Firebase Token Verification Error:', error);
      throw error;
    }
  },

  // إنشاء مستخدم جديد في Firebase
  async createUser(email, password) {
    try {
      const userRecord = await auth.createUser({
        email,
        password,
        emailVerified: false
      });
      return userRecord;
    } catch (error) {
      console.error('Firebase Create User Error:', error);
      throw error;
    }
  },

  // تحديث معلومات المستخدم في Firebase
  async updateUser(uid, updates) {
    try {
      const userRecord = await auth.updateUser(uid, updates);
      return userRecord;
    } catch (error) {
      console.error('Firebase Update User Error:', error);
      throw error;
    }
  },

  // حذف مستخدم من Firebase
  async deleteUser(uid) {
    try {
      await auth.deleteUser(uid);
      return true;
    } catch (error) {
      console.error('Firebase Delete User Error:', error);
      throw error;
    }
  },

  // الحصول على معلومات المستخدم من Firebase
  async getUserByEmail(email) {
    try {
      const userRecord = await auth.getUserByEmail(email);
      return userRecord;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      throw error;
    }
  }
};

module.exports = firebaseAdmin;
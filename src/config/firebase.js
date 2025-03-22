const admin = require('firebase-admin');
const https = require('https');
require('dotenv').config();

// تكوين Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? 
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    })
  });

  console.log('✅ تم تهيئة Firebase Admin بنجاح');
} catch (error) {
  console.error('❌ خطأ في تهيئة Firebase Admin:', error);
}

// دوال مساعدة للتعامل مع Firebase
const firebaseAdmin = {
  async createUser(email, password) {
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        emailVerified: true
      });
      return userRecord;
    } catch (error) {
      console.error('Firebase Create User Error:', error);
      throw error;
    }
  },

  async verifyIdToken(idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Firebase Token Verification Error:', error);
      throw error;
    }
  },

  async createCustomToken(uid, claims = {}) {
    try {
      const token = await admin.auth().createCustomToken(uid, claims);
      return token;
    } catch (error) {
      console.error('Firebase Create Custom Token Error:', error);
      throw error;
    }
  },

  async getUserByEmail(email) {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      return userRecord;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      throw error;
    }
  },

  async signInWithEmailAndPassword(email, password) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        email,
        password,
        returnSecureToken: true
      });

      const options = {
        hostname: 'identitytoolkit.googleapis.com',
        path: `/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', async () => {
          try {
            const jsonResponse = JSON.parse(responseData);
            
            if (res.statusCode === 200 && jsonResponse.idToken) {
              // تم تسجيل الدخول بنجاح، نقوم بجلب معلومات المستخدم
              const userRecord = await this.getUserByEmail(email);
              resolve(userRecord);
            } else {
              console.error('Firebase Auth Error:', jsonResponse.error);
              resolve(null);
            }
          } catch (error) {
            console.error('JSON Parse Error:', error);
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        console.error('Request Error:', error);
        resolve(null);
      });

      req.write(data);
      req.end();
    });
  }
};

module.exports = firebaseAdmin;
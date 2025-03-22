# نظام تحليل الأعراض الصحية باستخدام الذكاء الاصطناعي

## 🌟 نظرة عامة
نظام RESTful API متكامل لتحليل الأعراض الصحية باستخدام الذكاء الاصطناعي. يوفر:
- المصادقة باستخدام Firebase
- إدارة البيانات الصحية للمستخدمين
- تحليل الأعراض باستخدام OpenAI
- لوحة تحكم للمسؤولين

## 🚀 التقنيات المستخدمة
- **Node.js & Express.js**: إطار العمل الرئيسي
- **PostgreSQL (Neon)**: قاعدة البيانات السحابية
- **Firebase Auth**: نظام المصادقة
- **OpenAI**: تحليل الأعراض
- **SendGrid**: إرسال البريد الإلكتروني

## 📋 المتطلبات الأساسية
1. Node.js (v14 أو أحدث)
2. حساب Neon للـ PostgreSQL
3. مشروع Firebase
4. مفتاح OpenAI API
5. حساب SendGrid (اختياري)

## ⚙️ التثبيت والإعداد

### 1. إعداد Firebase:
- انتقل إلى [Firebase Console](https://console.firebase.google.com)
- أنشئ مشروعاً جديداً
- فعّل Authentication مع Email/Password
- احصل على مفتاح الخدمة (Service Account Key)

### 2. إعداد المشروع:
```bash
# استنساخ المشروع
git clone [رابط المستودع]
cd [اسم المجلد]

# تثبيت التبعيات
npm install
```

### 3. إعداد الملفات البيئية:
أنشئ ملف .env وأضف:
```env
# Server Configuration
PORT=3000
NODE_ENV=development
API_URL=http://localhost:3000/api

# Database Configuration
DATABASE_URL=your_neon_database_url
PGHOST=your_neon_host
PGDATABASE=neondb
PGUSER=your_username
PGPASSWORD=your_password

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="your_private_key"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_AUTH_DOMAIN=your_auth_domain

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview
```

## 🏃‍♂️ تشغيل التطبيق
```bash
# وضع التطوير
npm run dev

# وضع الإنتاج
npm start
```

## 📱 المصادقة باستخدام Firebase

### إنشاء حساب جديد:
```javascript
// إنشاء الحساب في Firebase ثم تسجيله في قاعدة بياناتنا
POST /api/auth/register
{
  "firebase_uid": "uid_from_firebase",
  "full_name": "اسم المستخدم",
  "email": "user@example.com",
  "phone": "01234567890"
}
```

### جلب معلومات المستخدم:
```javascript
// إرفاق رمز المصادقة من Firebase
GET /api/auth/profile
Authorization: Bearer [firebase_id_token]
```

لمزيد من المعلومات حول المصادقة، راجع [دليل المصادقة](docs/AUTH.md)

## 🛣️ نقاط النهاية API

### البيانات الطبية
- `POST /api/user/conditions`: إضافة مرض مزمن
- `POST /api/user/medications`: إضافة دواء
- `POST /api/user/surgeries`: إضافة عملية جراحية

### تحليل الأعراض
- `POST /api/symptoms/analyze`: تحليل الأعراض
- `GET /api/symptoms/history`: عرض سجل التحليلات

### لوحة التحكم
- `GET /api/admin/users`: عرض قائمة المستخدمين
- `POST /api/admin/notifications`: إرسال إشعارات

## 🔒 الأمان
- مصادقة آمنة عبر Firebase
- حماية من هجمات SQL Injection
- Rate Limiting لمنع هجمات Brute Force
- تشفير البيانات الحساسة

## 🎯 المميزات
1. تحليل ذكي للأعراض باستخدام OpenAI
2. نظام مصادقة قوي مع Firebase
3. قاعدة بيانات سحابية مع Neon
4. إدارة كاملة للبيانات الطبية
5. لوحة تحكم للمسؤولين

## 📚 الوثائق
- [دليل المصادقة](docs/AUTH.md)
- [Postman Collection](postman_collection.json)

## 📄 الترخيص
[ISC License](LICENSE)
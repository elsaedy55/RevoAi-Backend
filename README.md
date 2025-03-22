# RevoAI - AI-Powered Health Symptom Analysis System

[العربية](#نظام-تحليل-الأعراض-الصحية-باستخدام-الذكاء-الاصطناعي)

## 🌟 Overview
A comprehensive RESTful API system for health symptom analysis using artificial intelligence. Features:
- Firebase Authentication
- User Health Data Management
- AI-Powered Symptom Analysis using OpenAI
- Admin Dashboard

## 🚀 Technologies Used
- **Node.js & Express.js**: Main Framework
- **PostgreSQL (Neon)**: Cloud Database
- **Firebase Auth**: Authentication System
- **OpenAI**: Symptom Analysis
- **SendGrid**: Email Service

## 📋 Prerequisites
1. Node.js (v14 or newer)
2. Neon PostgreSQL Account
3. Firebase Project
4. OpenAI API Key
5. SendGrid Account (optional)

## ⚙️ Installation & Setup

### 1. Firebase Setup:
- Go to [Firebase Console](https://console.firebase.google.com)
- Create a new project
- Enable Authentication with Email/Password
- Get your Service Account Key

### 2. Project Setup:
```bash
# Clone the repository
git clone https://github.com/elsaedy55/RevoAi-Backend.git
cd RevoAi-Backend

# Install dependencies
npm install
```

### 3. Environment Setup:
Create a .env file and add:
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

## 🏃‍♂️ Running the Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📱 Firebase Authentication

### Admin Login:
```http
POST /api/auth/admin/login
Content-Type: application/json

Request Body:
{
    "idToken": "firebase_id_token"
}

Response:
{
    "success": true,
    "message": "تم تسجيل الدخول كمشرف بنجاح",
    "data": {
        "token": "custom_admin_token",
        "user": {
            "id": 1,
            "full_name": "Admin Name",
            "email": "admin@example.com",
            "is_admin": true
        }
    }
}
```

### Creating a New Account:
```javascript
POST /api/auth/register
{
  "firebase_uid": "uid_from_firebase",
  "full_name": "User Name",
  "email": "user@example.com",
  "phone": "01234567890"
}
```

### Fetching User Profile:
```javascript
GET /api/auth/profile
Authorization: Bearer [firebase_id_token]
```

For more authentication details, see [Authentication Guide](docs/AUTH.md)

## 🛣️ API Endpoints

### Medical Data
- `POST /api/user/conditions`: Add chronic condition
- `POST /api/user/medications`: Add medication
- `POST /api/user/surgeries`: Add surgery

### Symptom Analysis
- `POST /api/symptoms/analyze`: Analyze symptoms
- `GET /api/symptoms/history`: View analysis history

### Admin Dashboard
- `GET /api/admin/users`: List users
- `POST /api/admin/notifications`: Send notifications

## 🔒 Security
- Secure Firebase Authentication
- SQL Injection Protection
- Rate Limiting for Brute Force Prevention
- Sensitive Data Encryption

## 🎯 Features
1. Intelligent symptom analysis using OpenAI
2. Robust Firebase authentication
3. Cloud database with Neon
4. Complete medical data management
5. Admin dashboard

## 📚 Documentation
- [Authentication Guide](docs/AUTH.md)
- [Postman Collection](postman_collection.json)

## 📄 License
[ISC License](LICENSE)

---

# نظام تحليل الأعراض الصحية - Revo AI

## نظرة عامة
نظام متكامل لتحليل الأعراض الصحية باستخدام الذكاء الاصطناعي. يساعد المرضى على فهم أعراضهم وتلقي توصيات طبية أولية.

## المميزات الرئيسية 🌟
- مصادقة آمنة عبر Firebase 🔒
- تحليل ذكي للأعراض عبر OpenAI 🤖
- إدارة البيانات الطبية للمستخدمين 💊
- لوحة تحكم للمشرفين 👥
- نظام إشعارات متكامل 📨

## التقنيات المستخدمة 🚀
- **Node.js & Express**: إطار العمل الرئيسي
- **PostgreSQL (Neon)**: قاعدة البيانات
- **Firebase**: نظام المصادقة
- **OpenAI**: تحليل الأعراض
- **SendGrid**: خدمة البريد

## التثبيت والتشغيل ⚙️

1. نسخ المشروع:
```bash
git clone https://github.com/elsaedy55/RevoAi-Backend.git
cd RevoAi-Backend
npm install
```

2. إعداد البيئة:
- انسخ `example.env` إلى `.env`
- عدّل المتغيرات حسب إعداداتك

3. تشغيل التطبيق:
```bash
npm run dev  # للتطوير
npm start    # للإنتاج
```

## الاستخدام السريع 📝

### تسجيل دخول المشرف
```javascript
fetch('/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123'
  })
});
```

### تحليل الأعراض
```javascript
fetch('/api/symptoms/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    symptoms: ['صداع', 'دوخة'],
    additional_notes: 'تزداد مع الإجهاد'
  })
});
```

## نقاط النهاية API 🛣️

### المصادقة 🔑
- `POST /auth/admin/login` تسجيل دخول المشرف
- `POST /auth/register` تسجيل مستخدم جديد
- `GET /auth/profile` عرض الملف الشخصي

### البيانات الطبية 💉
- `POST /user/conditions` إضافة مرض مزمن
- `POST /user/medications` إضافة دواء
- `POST /user/surgeries` إضافة عملية جراحية

### تحليل الأعراض 🏥
- `POST /symptoms/analyze` تحليل أعراض جديدة
- `GET /symptoms/history` سجل التحليلات

### لوحة التحكم 👨‍💼
- `GET /admin/users` إدارة المستخدمين
- `POST /admin/notifications` إرسال إشعارات

## الوثائق 📚
- [توثيق API](docs/API.md)
- [دليل المصادقة](docs/AUTH.md)
- [مجموعة Postman](postman_collection.json)

## الترخيص
ISC
# دليل المصادقة باستخدام Firebase

## 🚀 الخطوات الأساسية

### 1. إنشاء حساب جديد
```javascript
// في تطبيق الواجهة الأمامية
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const email = 'user@example.com';
const password = 'password123';

// 1. إنشاء الحساب في Firebase
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// 2. تسجيل المستخدم في قاعدة البيانات الخاصة بنا
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${await user.getIdToken()}`
  },
  body: JSON.stringify({
    firebase_uid: user.uid,
    full_name: 'اسم المستخدم',
    email: user.email,
    phone: '01234567890',
    birth_date: '1990-01-01',
    address: 'العنوان'
  })
});
```

### 2. تسجيل الدخول
```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const email = 'user@example.com';
const password = 'password123';

// تسجيل الدخول باستخدام Firebase
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// الحصول على رمز المصادقة لاستخدامه مع طلبات API
const idToken = await user.getIdToken();
```

### 3. استخدام رمز المصادقة مع الطلبات
```javascript
// إضافة رمز المصادقة لكل طلب
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${idToken}`
};

// مثال: جلب الملف الشخصي
const response = await fetch('/api/auth/profile', {
  headers
});
```

### 4. تحديث معلومات المستخدم
```javascript
const response = await fetch('/api/auth/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
  },
  body: JSON.stringify({
    full_name: 'الاسم الجديد',
    phone: '01234567890',
    address: 'العنوان الجديد'
  })
});
```

## 🔒 ملاحظات أمنية

1. تأكد من تجديد رمز المصادقة عند انتهاء صلاحيته
```javascript
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // تجديد الرمز كل ساعة
    setInterval(async () => {
      const newToken = await user.getIdToken(true);
      // تحديث الرمز في حالة التطبيق
    }, 3600000); // كل ساعة
  }
});
```

2. تأمين تخزين الرمز
```javascript
// تخزين آمن للرمز
const secureStorage = {
  setToken: (token) => {
    sessionStorage.setItem('authToken', token);
  },
  getToken: () => {
    return sessionStorage.getItem('authToken');
  },
  removeToken: () => {
    sessionStorage.removeItem('authToken');
  }
};
```

## 👑 تسجيل دخول المشرفين

### نقطة النهاية
```http
POST /api/auth/admin/login
Content-Type: application/json

{
    "idToken": "firebase-id-token"
}
```

### المثال
```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const email = 'admin@example.com';
const password = 'admin123';

async function adminLogin() {
  try {
    // تسجيل الدخول باستخدام Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();

    // محاولة تسجيل الدخول كمشرف
    const response = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idToken })
    });

    const data = await response.json();
    
    if (data.success) {
      // تخزين رمز المشرف
      secureStorage.setToken(data.data.token);
      return data.data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    if (error.message === 'غير مصرح لك بالدخول كمشرف') {
      alert('هذا الحساب ليس لديه صلاحيات المشرف');
    } else {
      alert('حدث خطأ في تسجيل الدخول');
    }
    throw error;
  }
}
```

##  تسجيل الخروج
```javascript
import { getAuth, signOut } from 'firebase/auth';

const auth = getAuth();

async function logout() {
  try {
    await signOut(auth);
    secureStorage.removeToken();
    // تنظيف حالة التطبيق
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
  }
}
```

## ⚠️ معالجة الأخطاء

```javascript
try {
  // محاولة تسجيل الدخول
  await signInWithEmailAndPassword(auth, email, password);
} catch (error) {
  switch (error.code) {
    case 'auth/user-not-found':
      alert('البريد الإلكتروني غير مسجل');
      break;
    case 'auth/wrong-password':
      alert('كلمة المرور غير صحيحة');
      break;
    case 'auth/invalid-email':
      alert('البريد الإلكتروني غير صالح');
      break;
    default:
      alert('حدث خطأ في تسجيل الدخول');
  }
}
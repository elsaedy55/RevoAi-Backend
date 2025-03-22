# توثيق واجهات برمجة التطبيقات (API Documentation)

## المصادقة (Authentication)

### 1. تسجيل مستخدم جديد
```http
POST /api/auth/register
Content-Type: application/json

Request:
{
    "firebase_uid": "uid_from_firebase",
    "full_name": "أحمد محمد",
    "email": "ahmed@example.com",
    "phone": "+201234567890",
    "birth_date": "1990-01-01",
    "address": "القاهرة، مصر"
}

Response:
{
    "success": true,
    "message": "تم إنشاء الحساب بنجاح",
    "data": {
        "id": 1,
        "full_name": "أحمد محمد",
        "email": "ahmed@example.com"
    }
}
```

### 2. تسجيل دخول المشرف
```http
POST /api/auth/admin/login
Content-Type: application/json

Request:
{
    "email": "admin@example.com",
    "password": "password123"
}

Response:
{
    "success": true,
    "message": "تم تسجيل الدخول كمشرف بنجاح",
    "data": {
        "token": "jwt_token",
        "user": {
            "id": 1,
            "full_name": "Admin",
            "email": "admin@example.com",
            "is_admin": true
        }
    }
}
```

### 3. عرض الملف الشخصي
```http
GET /api/auth/profile
Authorization: Bearer firebase_id_token

Response:
{
    "success": true,
    "data": {
        "user": {
            "id": 1,
            "full_name": "أحمد محمد",
            "email": "ahmed@example.com",
            "phone": "+201234567890",
            "birth_date": "1990-01-01",
            "address": "القاهرة، مصر",
            "is_verified": true
        },
        "medical_data": {
            "conditions": [...],
            "medications": [...],
            "surgeries": [...]
        }
    }
}
```

## البيانات الطبية (Medical Data)

### 1. إضافة مرض مزمن
```http
POST /api/user/conditions
Authorization: Bearer firebase_id_token
Content-Type: application/json

Request:
{
    "condition_name": "السكري",
    "start_date": "2020-01-01",
    "notes": "النوع الثاني"
}

Response:
{
    "success": true,
    "message": "تمت إضافة المرض بنجاح",
    "data": {
        "id": 1,
        "condition_name": "السكري",
        "start_date": "2020-01-01",
        "notes": "النوع الثاني",
        "created_at": "2024-03-22T12:00:00Z"
    }
}
```

### 2. إضافة دواء
```http
POST /api/user/medications
Authorization: Bearer firebase_id_token
Content-Type: application/json

Request:
{
    "medication_name": "انسولين",
    "dosage": "10 وحدات",
    "frequency": "مرتين يومياً",
    "start_date": "2020-01-01"
}

Response:
{
    "success": true,
    "message": "تمت إضافة الدواء بنجاح",
    "data": {
        "id": 1,
        "medication_name": "انسولين",
        "dosage": "10 وحدات",
        "frequency": "مرتين يومياً",
        "start_date": "2020-01-01",
        "created_at": "2024-03-22T12:00:00Z"
    }
}
```

### 3. إضافة عملية جراحية
```http
POST /api/user/surgeries
Authorization: Bearer firebase_id_token
Content-Type: application/json

Request:
{
    "surgery_name": "استئصال الزائدة الدودية",
    "surgery_date": "2020-01-01",
    "notes": "تمت العملية بنجاح"
}

Response:
{
    "success": true,
    "message": "تمت إضافة العملية الجراحية بنجاح",
    "data": {
        "id": 1,
        "surgery_name": "استئصال الزائدة الدودية",
        "surgery_date": "2020-01-01",
        "notes": "تمت العملية بنجاح",
        "created_at": "2024-03-22T12:00:00Z"
    }
}
```

## تحليل الأعراض (Symptom Analysis)

### 1. تحليل أعراض جديدة
```http
POST /api/symptoms/analyze
Authorization: Bearer firebase_id_token
Content-Type: application/json

Request:
{
    "symptoms": ["صداع", "دوخة", "غثيان"],
    "additional_notes": "الأعراض تزداد في المساء"
}

Response:
{
    "success": true,
    "message": "تم تحليل الأعراض بنجاح وإرسال النتائج إلى بريدك الإلكتروني",
    "data": {
        "analysis": {
            "diagnoses": [
                {
                    "condition": "الصداع النصفي",
                    "probability": 0.8,
                    "description": "صداع نصفي مع أعراض مصاحبة"
                }
            ],
            "severity": {
                "level": "متوسط",
                "description": "يحتاج إلى متابعة طبية"
            },
            "recommendations": [
                "استشارة طبيب مختص",
                "تجنب الضوء الساطع",
                "أخذ قسط كافٍ من الراحة"
            ],
            "urgentCare": false
        }
    }
}
```

### 2. عرض سجل التحليلات
```http
GET /api/symptoms/history
Authorization: Bearer firebase_id_token

Response:
{
    "success": true,
    "data": {
        "analyses": [...],
        "pagination": {
            "current_page": 1,
            "total_pages": 5,
            "total_items": 50,
            "items_per_page": 10
        }
    }
}
```

## لوحة التحكم (Admin Dashboard)

### 1. عرض قائمة المستخدمين
```http
GET /api/admin/users
Authorization: Bearer firebase_id_token

Response:
{
    "success": true,
    "data": {
        "users": [
            {
                "id": 1,
                "full_name": "أحمد محمد",
                "email": "ahmed@example.com",
                "is_verified": true,
                "is_admin": false,
                "created_at": "2024-03-22T12:00:00Z"
            }
        ],
        "pagination": {
            "current_page": 1,
            "total_pages": 5,
            "total_items": 50,
            "items_per_page": 10
        }
    }
}
```

### 2. إرسال إشعارات
```http
POST /api/admin/notifications
Authorization: Bearer firebase_id_token
Content-Type: application/json

Request:
{
    "title": "تحديث مهم",
    "message": "تم إضافة ميزات جديدة للتطبيق",
    "user_ids": [1, 2, 3]
}

Response:
{
    "success": true,
    "message": "تم إرسال الإشعار بنجاح إلى 3 مستخدم",
    "data": {
        "recipients_count": 3
    }
}
```

## ملاحظات هامة

1. جميع الطلبات تتطلب رمز المصادقة من Firebase في ترويسة `Authorization`
2. جميع البيانات المرسلة والمستلمة بتنسيق JSON
3. التواريخ بتنسيق ISO 8601
4. الردود تحتوي دائماً على حقل `success` يشير إلى نجاح أو فشل العملية
5. في حالة الخطأ، سيحتوي الرد على رسالة خطأ واضحة

## أمثلة على الأخطاء

### خطأ في المصادقة
```http
Status: 401 Unauthorized
{
    "success": false,
    "message": "رمز المصادقة غير صالح"
}
```

### خطأ في البيانات
```http
Status: 400 Bad Request
{
    "success": false,
    "message": "خطأ في البيانات المدخلة",
    "errors": [
        {
            "field": "email",
            "message": "البريد الإلكتروني غير صالح"
        }
    ]
}
```

### خطأ في الصلاحيات
```http
Status: 403 Forbidden
{
    "success": false,
    "message": "غير مصرح بالوصول إلى هذا المورد"
}
```
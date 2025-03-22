const Redis = require('redis');
const config = require('../config/config');

// إنشاء عميل Redis
const redisClient = Redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
});

redisClient.on('connect', () => {
  console.log('Connected to Redis successfully');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// دوال مساعدة للتعامل مع Redis
const redisUtils = {
  // تخزين بيانات مع وقت انتهاء صلاحية
  async set(key, value, expireSeconds = 3600) {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: expireSeconds,
      });
      return true;
    } catch (error) {
      console.error('Redis SET Error:', error);
      return false;
    }
  },

  // استرجاع البيانات
  async get(key) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET Error:', error);
      return null;
    }
  },

  // حذف البيانات
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL Error:', error);
      return false;
    }
  },

  // تخزين نتائج تحليل الأعراض في الذاكرة المؤقتة
  async cacheSymptomAnalysis(userId, symptoms, result) {
    const key = `symptom_analysis:${userId}:${symptoms.sort().join(',')}`;
    await this.set(key, result, 24 * 60 * 60); // تخزين لمدة 24 ساعة
  },

  // استرجاع نتائج تحليل الأعراض من الذاكرة المؤقتة
  async getCachedSymptomAnalysis(userId, symptoms) {
    const key = `symptom_analysis:${userId}:${symptoms.sort().join(',')}`;
    return await this.get(key);
  },
};

module.exports = redisUtils;
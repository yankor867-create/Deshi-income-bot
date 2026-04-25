// config.js - দেশী ইনকাম
// Last Updated: 2026-04-25

window.CONFIG = {
    // 🔧 Supabase Configuration
    SUPABASE_URL: 'https://fqeohejqrpcwjrjvamth.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZW9oZWpxcnBjd2pyanZhbXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDMxMjYsImV4cCI6MjA5MjYxOTEyNn0.DVuwgugcetNytGV7lKezN9EF5UCuaNaEmyy7PVgGm6Q',
    
    // 🤖 Telegram Bot Configuration
    BOT_USERNAME: 'deshiincomebot',
    BOT_TOKEN: '8763377927:AAE43INuRksUN1HSImP6HcsF4Q47M8sw6Y8',
    
    // 🌐 Deployment URL
    APP_URL: 'https://resplendent-lolly-35b4c6.netlify.app',
    
    // 🔗 Ad Links
    AD_LINKS: [
        'https://omg10.com/4/9809044',
        'https://shingledirt.com/img7n81xh8?key=60effca0c228e66afd204784027d8b16',
        'https://wwp.giriutan.com/redirect-zone/d37be84c'
    ],
    
    // 💰 Rewards (Custom amounts)
    AD_REWARD: 10,              // Per main ad
    BONUS_AD_REWARD: 5,          // Per bonus ad
    DAILY_BONUS_REWARD: 3,       // Per daily bonus ad
    REFERRAL_BONUS: 100,         // Referrer gets
    REFERRED_BONUS: 50,          // New user gets
    SIGNUP_BONUS: 50,            // Initial signup bonus
    
    // 📋 Withdrawal Requirements
    MIN_WITHDRAW: 500,
    MIN_REFERRALS: 15,
    MIN_TOTAL_ADS: 50,
    
    // ⏰ Limits
    HOURLY_AD_LIMIT: 10,
    HOURLY_BONUS_LIMIT: 10,
    DAILY_BONUS_LIMIT: 50,
    
    // 📢 Social & Support (Add later)
    PAYMENT_PROOF_CHANNEL: '',
    ADMIN_TELEGRAM: '',
    YOUTUBE_CHANNEL: 'https://youtube.com/@mishtikumra-y8v',
    TELEGRAM_CHANNEL: 'https://t.me/mishti_kumra_official',
    
    // 🎨 App Info
    APP_NAME: 'দেশী ইনকাম',
    APP_NAME_EN: 'Deshi Income',
    CURRENCY_SYMBOL: '৳',
    VERSION: '2.0.2'
};

console.log('✅ দেশী ইনকাম কনফিগ লোড হয়েছে - v' + window.CONFIG.VERSION);
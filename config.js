// config.js - দেশী ইনকাম

window.CONFIG = {
    SUPABASE_URL: 'https://fqeohejqrpcwjrjvamth.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZW9oZWpxcnBjd2pyanZhbXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDMxMjYsImV4cCI6MjA5MjYxOTEyNn0.DVuwgugcetNytGV7lKezN9EF5UCuaNaEmyy7PVgGm6Q',
    BOT_USERNAME: 'deshiincomebot',
    APP_URL: 'https://deshi-income-bot.vercel.app/',
    AD_LINKS: [
        'https://crn77.com/4/9550427',
        'https://shingledirt.com/img7n81xh8?key=60effca0c228e66afd204784027d8b16',
        'https://omg10.com/4/9345167',
        'https://shingledirt.com/img7n81xh8?key=60effca0c228e66afd204784027d8b16',
        'https://shingledirt.com/img7n81xh8?key=60effca0c228e66afd204784027d8b16',
        'https://shingledirt.com/img7n81xh8?key=60effca0c228e66afd204784027d8b16'
    ],
    AD_REWARD: 10,
    BONUS_AD_REWARD: 5,
    DAILY_BONUS_REWARD: 3,
    REFERRAL_BONUS: 100,
    REFERRED_BONUS: 50,
    SIGNUP_BONUS: 50,
    MIN_WITHDRAW: 500,
    MIN_REFERRALS: 15,
    MIN_TOTAL_ADS: 50,
    HOURLY_AD_LIMIT: 10,
    HOURLY_BONUS_LIMIT: 10,
    DAILY_BONUS_LIMIT: 50,
    PAYMENT_PROOF_CHANNEL: '',
    ADMIN_TELEGRAM: '',
    YOUTUBE_CHANNEL: 'https://youtube.com/@deshiincome-o6d?si=ZlTi1hm-UhuIleTR',
    TELEGRAM_CHANNEL: 'https://t.me/deshiincomeofficial',
    APP_NAME: 'দেশী ইনকাম',
    APP_NAME_EN: 'Deshi Income',
    CURRENCY_SYMBOL: '৳',
    VERSION: '2.0.4',
    
    // ========== YOUTUBE VIDEO TASK CONFIGURATION ==========
    VIDEO_TASK: {
        enabled: true,
        // YouTube video links (can add multiple)
        VIDEO_LINKS: [
            'https://youtu.be/JFB-CLhWgaQ?si=d7sD-DVsfEWCbIaQ',
            'https://youtu.be/TK0tdxHon0c?si=ndYSN5rsx6rgvTYM',
            'https://youtu.be/r-t12o6gVWw?si=2_6bm1d3kONhfMAN'
        ],
        DAILY_LIMIT: 2,           // প্রতিদিন সর্বোচ্চ কতবার ভিডিও দেখে আয় করতে পারবে
        REWARD: 100,              // পুরস্কারের পরিমাণ (টাকা)
        WATCH_SECONDS: 480,       // কত সেকেন্ড ভিডিও দেখতে হবে (৮ মিনিট = ৪৮০ সেকেন্ড)
        MIN_LIKE_REQUIRED: true   // লাইক দেওয়া বাধ্যতামূলক কিনা
    }
};
console.log('✅ দেশী ইনকাম কনফিগ লোড হয়েছে - v' + window.CONFIG.VERSION);
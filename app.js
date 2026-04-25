// app.js - দেশী ইনকাম (v2.0.3)
// Fixed: refreshMyReferralCount updates balance + total income
// Referral page uses no auto-refresh (handled in referral.html)

let currentUser = null;
let updateDebounce = null;

// ============================================
// Telegram User Helpers
// ============================================
function getTelegramUserId() {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
        return tg.initDataUnsafe.user.id.toString();
    }
    let userId = localStorage.getItem('deshi_temp_id');
    if (!userId) {
        userId = 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deshi_temp_id', userId);
    }
    return userId;
}

function getTelegramUsername() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user?.username || null;
}

function getTelegramFirstName() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'ইউজার';
}

function getReferrerFromUrl() {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.start_param) {
        let param = tg.initDataUnsafe.start_param;
        if (param.startsWith('ref')) return param.replace('ref', '');
        if (param.match(/^\d+$/)) return param;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const startapp = urlParams.get('startapp');
    if (startapp) {
        if (startapp.startsWith('ref')) return startapp.replace('ref', '');
        if (startapp.match(/^\d+$/)) return startapp;
    }
    const refParam = urlParams.get('ref');
    if (refParam) return refParam;
    return null;
}

// ============================================
// Reset Helpers
// ============================================
function checkHourlyReset() {
    const h = new Date().getHours().toString();
    if (localStorage.getItem('last_ad_reset_hour') !== h) {
        localStorage.setItem('hourly_ads_watched', '0');
        localStorage.setItem('last_ad_reset_hour', h);
    }
}

function checkBonusHourlyReset() {
    const h = new Date().getHours().toString();
    if (localStorage.getItem('last_bonus_reset_hour') !== h) {
        localStorage.setItem('hourly_bonus_ads_watched', '0');
        localStorage.setItem('last_bonus_reset_hour', h);
    }
}

function checkDailyReset() {
    const today = new Date().toDateString();
    if (localStorage.getItem('last_daily_bonus_date') !== today) {
        localStorage.setItem('daily_bonus_ads', '0');
        localStorage.setItem('last_daily_bonus_date', today);
    }
}

function getHourlyAdsCount() {
    checkHourlyReset();
    return parseInt(localStorage.getItem('hourly_ads_watched') || '0');
}

function getBonusHourlyCount() {
    checkBonusHourlyReset();
    return parseInt(localStorage.getItem('hourly_bonus_ads_watched') || '0');
}

function getDailyBonusCount() {
    checkDailyReset();
    return parseInt(localStorage.getItem('daily_bonus_ads') || '0');
}

// ============================================
// User Load/Create
// ============================================
async function loadUser() {
    const userId = getTelegramUserId();
    const firstName = getTelegramFirstName();
    const username = getTelegramUsername();
    const referrerId = getReferrerFromUrl();

    let user = await window.getUserDataOptimized(userId);

    if (user) {
        currentUser = user;
        try {
            // Refresh referral count on every load (also updates balance/income)
            await refreshMyReferralCount();
        } catch (e) {
            console.warn('Referral refresh failed:', e);
        }
    } else {
        // Create new user (referred_by = null)
        const newUser = {
            id: userId,
            first_name: firstName,
            username: username,
            balance: window.CONFIG.SIGNUP_BONUS,
            today_ads: 0,
            total_ads: 0,
            today_bonus_ads: 0,
            today_bonus_ads_2: 0,
            total_referrals: 0,
            total_income: window.CONFIG.SIGNUP_BONUS,
            join_date: new Date().toISOString(),
            last_active: new Date().toISOString(),
            referred_by: null
        };

        user = await window.createUserOptimized(newUser);
        if (!user) {
            updateUI();
            return null;
        }
        currentUser = user;

        // Handle referral if exists
        if (referrerId && referrerId !== userId) {
            try {
                const referralResult = await window.createReferralRecord(
                    referrerId,
                    userId,
                    firstName,
                    'telegram_startapp'
                );
                if (referralResult.success) {
                    // Add referral bonus to new user
                    const newBalance = window.CONFIG.SIGNUP_BONUS + window.CONFIG.REFERRED_BONUS;
                    const { error } = await window.supabase
                        .from('users')
                        .update({
                            balance: newBalance,
                            total_income: newBalance,
                            referred_by: referrerId
                        })
                        .eq('id', userId);
                    if (!error) {
                        currentUser.balance = newBalance;
                        currentUser.total_income = newBalance;
                        currentUser.referred_by = referrerId;
                    }
                    setTimeout(() => {
                        alert('🎉 রেফারেল বোনাস! আপনি ৫০ টাকা এবং আপনার রেফারার ১০০ টাকা পেয়েছেন!');
                    }, 1000);
                }
            } catch (e) {
                console.error('Referral error:', e);
            }
        }

        localStorage.setItem(`deshi_user_${userId}`, JSON.stringify({
            data: currentUser,
            timestamp: Date.now()
        }));
    }

    updateUI();
    return currentUser;
}

async function refreshMyReferralCount() {
    if (!currentUser) return 0;
    try {
        const result = await window.refreshReferralCount(currentUser.id);
        // result is an object { total_referrals, balance, total_income }
        if (typeof result === 'object' && result !== null) {
            currentUser.total_referrals = result.total_referrals;
            currentUser.balance = result.balance;
            currentUser.total_income = result.total_income;
        } else {
            // fallback if old implementation returns just number
            currentUser.total_referrals = result;
        }
        localStorage.setItem(`deshi_user_${currentUser.id}`, JSON.stringify({
            data: currentUser,
            timestamp: Date.now()
        }));
        updateUI();
        return currentUser.total_referrals;
    } catch (e) {
        console.error('refreshMyReferralCount error:', e);
        return currentUser.total_referrals;
    }
}

async function loadMyReferrals() {
    if (!currentUser) return [];
    return await window.getUserReferralsList(currentUser.id);
}

// ============================================
// Earnings Functions
// ============================================
async function addEarning(amount) {
    if (!currentUser) return { success: false, error: 'ইউজার লোড হয়নি' };
    checkHourlyReset();
    const hourlyCount = getHourlyAdsCount();
    if (hourlyCount >= window.CONFIG.HOURLY_AD_LIMIT) {
        return { success: false, error: 'এই ঘন্টায় লিমিট শেষ!' };
    }

    currentUser.balance = Number(currentUser.balance || 0) + amount;
    currentUser.total_income = Number(currentUser.total_income || 0) + amount;
    currentUser.total_ads = Number(currentUser.total_ads || 0) + 1;
    currentUser.today_ads = Number(currentUser.today_ads || 0) + 1;

    localStorage.setItem('hourly_ads_watched', (hourlyCount + 1).toString());
    localStorage.setItem(`deshi_user_${currentUser.id}`, JSON.stringify({
        data: currentUser,
        timestamp: Date.now()
    }));
    updateUI();

    try {
        await window.supabase
            .from('users')
            .update({
                balance: currentUser.balance,
                total_income: currentUser.total_income,
                total_ads: currentUser.total_ads,
                today_ads: currentUser.today_ads,
                last_active: new Date().toISOString(),
                last_ad_reset: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        await window.logAdWatch(currentUser.id, 'main', amount);
    } catch (e) {
        console.error('addEarning DB failed:', e);
    }

    return { success: true };
}

async function addBonusEarning(amount) {
    if (!currentUser) return { success: false, error: 'ইউজার লোড হয়নি' };
    checkBonusHourlyReset();
    const hourlyCount = getBonusHourlyCount();
    if (hourlyCount >= window.CONFIG.HOURLY_BONUS_LIMIT) {
        return { success: false, error: 'বোনাস লিমিট শেষ!' };
    }

    currentUser.balance = Number(currentUser.balance || 0) + amount;
    currentUser.total_income = Number(currentUser.total_income || 0) + amount;
    currentUser.today_bonus_ads = Number(currentUser.today_bonus_ads || 0) + 1;

    localStorage.setItem('hourly_bonus_ads_watched', (hourlyCount + 1).toString());
    localStorage.setItem(`deshi_user_${currentUser.id}`, JSON.stringify({
        data: currentUser,
        timestamp: Date.now()
    }));
    updateUI();

    try {
        await window.supabase
            .from('users')
            .update({
                balance: currentUser.balance,
                total_income: currentUser.total_income,
                today_bonus_ads: currentUser.today_bonus_ads,
                last_active: new Date().toISOString(),
                last_bonus_ad_reset: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        await window.logAdWatch(currentUser.id, 'bonus', amount);
    } catch (e) {
        console.error('addBonusEarning DB failed:', e);
    }

    return { success: true };
}

async function addDailyBonusEarning(amount) {
    if (!currentUser) return { success: false };
    checkDailyReset();
    const dailyCount = getDailyBonusCount();
    if (dailyCount >= window.CONFIG.DAILY_BONUS_LIMIT) {
        return { success: false, error: 'দৈনিক লিমিট শেষ!' };
    }

    currentUser.balance = Number(currentUser.balance || 0) + amount;
    currentUser.total_income = Number(currentUser.total_income || 0) + amount;
    currentUser.today_bonus_ads_2 = Number(currentUser.today_bonus_ads_2 || 0) + 1;

    localStorage.setItem('daily_bonus_ads', (dailyCount + 1).toString());
    localStorage.setItem(`deshi_user_${currentUser.id}`, JSON.stringify({
        data: currentUser,
        timestamp: Date.now()
    }));
    updateUI();

    try {
        await window.supabase
            .from('users')
            .update({
                balance: currentUser.balance,
                total_income: currentUser.total_income,
                today_bonus_ads_2: currentUser.today_bonus_ads_2,
                last_active: new Date().toISOString(),
                last_bonus_ad_reset_2: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        await window.logAdWatch(currentUser.id, 'daily', amount);
    } catch (e) {
        console.error('addDailyBonusEarning DB failed:', e);
    }

    return { success: true };
}

async function addBonus(amount) {
    if (!currentUser) return;
    currentUser.balance = Number(currentUser.balance || 0) + amount;
    currentUser.total_income = Number(currentUser.total_income || 0) + amount;

    localStorage.setItem(`deshi_user_${currentUser.id}`, JSON.stringify({
        data: currentUser,
        timestamp: Date.now()
    }));
    updateUI();

    try {
        await window.supabase
            .from('users')
            .update({
                balance: currentUser.balance,
                total_income: currentUser.total_income,
                last_active: new Date().toISOString()
            })
            .eq('id', currentUser.id);
    } catch (e) {
        console.error('addBonus DB failed:', e);
    }
}

// ============================================
// Withdrawal
// ============================================
async function requestWithdraw(amount, accountNumber, method) {
    if (!currentUser) return { success: false, error: 'ইউজার লোড হয়নি' };
    if (amount > currentUser.balance) return { success: false, error: 'ব্যালেন্স অপর্যাপ্ত!' };
    if (Number(currentUser.total_referrals || 0) < window.CONFIG.MIN_REFERRALS) {
        return {
            success: false,
            error: `${window.CONFIG.MIN_REFERRALS} জন রেফারেল প্রয়োজন! (বর্তমানে: ${currentUser.total_referrals || 0})`
        };
    }
    if (Number(currentUser.total_ads || 0) < window.CONFIG.MIN_TOTAL_ADS) {
        return {
            success: false,
            error: `${window.CONFIG.MIN_TOTAL_ADS}টি এড প্রয়োজন! (বর্তমানে: ${currentUser.total_ads || 0})`
        };
    }
    if (amount < window.CONFIG.MIN_WITHDRAW) {
        return { success: false, error: `ন্যূনতম ${window.CONFIG.MIN_WITHDRAW} টাকা প্রয়োজন!` };
    }

    const result = await window.requestWithdrawalOptimized(
        currentUser.id,
        currentUser.first_name,
        amount,
        accountNumber,
        method,
        Number(currentUser.total_ads || 0),
        Number(currentUser.total_referrals || 0)
    );

    if (result.success) {
        currentUser.balance = Number(currentUser.balance) - amount;
        localStorage.setItem(`deshi_user_${currentUser.id}`, JSON.stringify({
            data: currentUser,
            timestamp: Date.now()
        }));
        updateUI();

        try {
            await window.supabase
                .from('users')
                .update({
                    balance: currentUser.balance,
                    last_active: new Date().toISOString()
                })
                .eq('id', currentUser.id);
        } catch (e) {
            console.error('Withdraw balance deduct failed:', e);
        }
        return { success: true, message: 'উত্তোলন রিকোয়েস্ট সফল! ২৪-৪৮ ঘন্টার মধ্যে পেমেন্ট করা হবে।' };
    }
    return result;
}

// ============================================
// Referral Link
// ============================================
async function copyReferralLink() {
    if (!currentUser) return;
    const link = `https://t.me/${window.CONFIG.BOT_USERNAME}?startapp=ref${currentUser.id}`;
    try {
        await navigator.clipboard.writeText(link);
        alert('✅ রেফারেল লিঙ্ক কপি হয়েছে!');
    } catch (e) {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('✅ রেফারেল লিঙ্ক কপি হয়েছে!');
    }
}

// ============================================
// UI Update
// ============================================
function updateUI() {
    if (!currentUser) return;
    if (updateDebounce) clearTimeout(updateDebounce);
    updateDebounce = setTimeout(() => {
        const balanceEl = document.getElementById('mainBalance');
        if (balanceEl) balanceEl.textContent = Number(currentUser.balance || 0).toFixed(2);

        const nameEl = document.getElementById('userName');
        if (nameEl) nameEl.textContent = currentUser.first_name || 'ইউজার';

        const userIdEl = document.getElementById('userId');
        if (userIdEl) userIdEl.textContent = `আইডি: ${currentUser.id}`;

        const refsEl = document.getElementById('totalReferrals');
        if (refsEl) refsEl.textContent = currentUser.total_referrals || 0;

        const adsEl = document.getElementById('totalAds');
        if (adsEl) adsEl.textContent = currentUser.total_ads || 0;

        const incomeEl = document.getElementById('totalIncome');
        if (incomeEl) incomeEl.textContent = Number(currentUser.total_income || 0).toFixed(2);

        const loadingEl = document.getElementById('loadingOverlay');
        if (loadingEl) loadingEl.style.display = 'none';
    }, 50);
}

function getCurrentUser() {
    return currentUser;
}

function getUserData() {
    return currentUser;
}

function checkAllResets() {
    checkHourlyReset();
    checkBonusHourlyReset();
    checkDailyReset();
    updateUI();
}

// ============================================
// Social Tasks
// ============================================
async function completeTelegramTask() {
    if (!currentUser) return { success: false };
    if (currentUser.task_telegram) return { success: false, error: 'ইতিমধ্যে সম্পন্ন হয়েছে!' };
    window.open(window.CONFIG.TELEGRAM_CHANNEL, '_blank');
    await addBonus(50);
    try {
        await window.supabase
            .from('users')
            .update({ task_telegram: true })
            .eq('id', currentUser.id);
        currentUser.task_telegram = true;
    } catch (e) {
        console.error('Task update error:', e);
    }
    return { success: true };
}

async function completeYoutubeTask() {
    if (!currentUser) return { success: false };
    if (currentUser.task_youtube) return { success: false, error: 'ইতিমধ্যে সম্পন্ন হয়েছে!' };
    window.open(window.CONFIG.YOUTUBE_CHANNEL, '_blank');
    await addBonus(50);
    try {
        await window.supabase
            .from('users')
            .update({ task_youtube: true })
            .eq('id', currentUser.id);
        currentUser.task_youtube = true;
    } catch (e) {
        console.error('Task update error:', e);
    }
    return { success: true };
}

// ============================================
// Exports
// ============================================
window.addEarning = addEarning;
window.addBonusEarning = addBonusEarning;
window.addDailyBonusEarning = addDailyBonusEarning;
window.addBonus = addBonus;
window.requestWithdraw = requestWithdraw;
window.getCurrentUser = getCurrentUser;
window.loadUser = loadUser;
window.getUserData = getUserData;
window.updateUI = updateUI;
window.copyReferralLink = copyReferralLink;
window.loadMyReferrals = loadMyReferrals;
window.refreshMyReferralCount = refreshMyReferralCount;
window.getHourlyAdsCount = getHourlyAdsCount;
window.getBonusHourlyCount = getBonusHourlyCount;
window.getDailyBonusCount = getDailyBonusCount;
window.completeTelegramTask = completeTelegramTask;
window.completeYoutubeTask = completeYoutubeTask;

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.expand();
        tg.ready();
        tg.setHeaderColor('#060B18');
        tg.setBackgroundColor('#060B18');
    }

    checkAllResets();
    setInterval(checkAllResets, 60000);

    await loadUser();

    // Periodic sync every 10 minutes (updates balance, income, referrals)
    setInterval(async () => {
        if (currentUser) {
            try {
                localStorage.removeItem(`deshi_user_${currentUser.id}`);
                const freshUser = await window.getUserDataOptimized(currentUser.id);
                if (freshUser) {
                    currentUser = freshUser;
                    localStorage.setItem(`deshi_user_${currentUser.id}`, JSON.stringify({
                        data: currentUser,
                        timestamp: Date.now()
                    }));
                    updateUI();
                }
            } catch (e) {
                console.warn('Periodic sync failed:', e);
            }
        }
    }, 600000);
});

console.log('✅ দেশী ইনকাম অ্যাপ লোড হয়েছে - v' + window.CONFIG.VERSION);
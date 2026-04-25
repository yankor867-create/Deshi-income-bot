const supabaseClient = supabase.createClient(
    window.CONFIG.SUPABASE_URL,
    window.CONFIG.SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: 'public' } }
);

let userCache = new Map();

async function getUserDataOptimized(userId) {
    if (!userId) return null;
    if (userCache.has(userId)) {
        const cached = userCache.get(userId);
        if (Date.now() - cached.timestamp < 300000) return cached.data;
    }
    const localKey = `deshi_user_${userId}`;
    const localData = localStorage.getItem(localKey);
    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            if (Date.now() - parsed.timestamp < 300000) {
                userCache.set(userId, parsed);
                return parsed.data;
            }
        } catch (e) {}
    }
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
        if (error) throw error;
        if (data) {
            const cacheData = { data, timestamp: Date.now() };
            userCache.set(userId, cacheData);
            localStorage.setItem(localKey, JSON.stringify(cacheData));
        }
        return data;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

async function createUserOptimized(userData) {
    try {
        const now = new Date().toISOString();
        const { data, error } = await supabaseClient
            .from('users')
            .insert([{
                id: userData.id,
                first_name: userData.first_name,
                username: userData.username || null,
                balance: userData.balance || window.CONFIG.SIGNUP_BONUS,
                today_ads: 0,
                total_ads: 0,
                today_bonus_ads: 0,
                today_bonus_ads_2: 0,
                total_referrals: 0,
                total_income: userData.balance || window.CONFIG.SIGNUP_BONUS,
                join_date: now,
                last_active: now,
                referred_by: null,
                last_ad_reset: now,
                last_bonus_ad_reset: now,
                last_bonus_ad_reset_2: now,
                task_telegram: false,
                task_youtube: false
            }])
            .select()
            .single();
        if (error) { console.error('Create user error:', error); return null; }
        const cacheData = { data, timestamp: Date.now() };
        userCache.set(data.id, cacheData);
        localStorage.setItem(`deshi_user_${data.id}`, JSON.stringify(cacheData));
        return data;
    } catch (error) { console.error('Create user error:', error); return null; }
}

async function logAdWatch(userId, adType, amount) {
    try {
        await supabaseClient.from('ad_logs').insert([{
            user_id: userId,
            ad_type: adType,
            amount: amount,
            watched_at: new Date().toISOString(),
            user_agent: navigator.userAgent
        }]);
    } catch (e) { console.error('Ad log error:', e); }
}

async function createReferralRecord(referrerId, newUserId, newUserName, source = 'telegram_startapp') {
    try {
        console.log('📝 Creating referral:', { referrerId, newUserId, newUserName });
        const { data: existing } = await supabaseClient
            .from('referrals')
            .select('id')
            .eq('new_user_id', newUserId)
            .maybeSingle();
        if (existing) { console.log('⚠️ Referral already exists'); return { success: false, error: 'Already referred' }; }
        const { data: userData } = await supabaseClient
            .from('users')
            .select('referred_by')
            .eq('id', newUserId)
            .maybeSingle();
        if (userData?.referred_by) { console.log('⚠️ User already has referrer'); return { success: false, error: 'Already referred' }; }
        const { data: referrer, error: refError } = await supabaseClient
            .from('users')
            .select('balance, total_referrals, total_income')
            .eq('id', referrerId)
            .single();
        if (refError || !referrer) { console.log('❌ Referrer not found:', referrerId); return { success: false, error: 'Referrer not found' }; }
        const now = new Date().toISOString();
        const { error: insertError } = await supabaseClient
            .from('referrals')
            .insert({
                user_id: newUserId,
                referred_by: referrerId,
                referrer_user_id: referrerId,
                new_user_name: newUserName,
                new_user_id: newUserId,
                join_date: now,
                timestamp: Date.now(),
                status: 'completed',
                source: source
            });
        if (insertError) { console.error('❌ Referral insert error:', insertError); return { success: false, error: insertError.message }; }
        console.log('✅ Referral record created');
        const newReferrerBalance = Number(referrer.balance || 0) + window.CONFIG.REFERRAL_BONUS;
        const newReferrerTotalIncome = Number(referrer.total_income || 0) + window.CONFIG.REFERRAL_BONUS;
        const { error: updateError } = await supabaseClient
            .from('users')
            .update({ balance: newReferrerBalance, total_income: newReferrerTotalIncome, last_active: now })
            .eq('id', referrerId);
        if (updateError) {
            console.error('❌ Failed to add referral bonus to referrer:', updateError);
            return { success: false, error: 'Failed to add bonus' };
        }
        console.log(`✅ Referrer ${referrerId} got +${window.CONFIG.REFERRAL_BONUS} TK, new balance: ${newReferrerBalance}`);
        return { success: true };
    } catch (error) { console.error('❌ Create referral error:', error); return { success: false, error: error.message }; }
}

async function getUserReferralsList(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('referrals')
            .select('new_user_id, new_user_name, join_date, status')
            .eq('referred_by', userId)
            .eq('status', 'completed')
            .order('join_date', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) { console.error('Get referrals error:', error); return []; }
}

async function getReferralCount(userId) {
    try {
        const { count, error } = await supabaseClient
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by', userId)
            .eq('status', 'completed');
        if (error) throw error;
        return count || 0;
    } catch (error) { console.error('Get referral count error:', error); return 0; }
}

async function refreshReferralCount(userId) {
    try {
        // Get fresh user data instead of just count
        const { data: freshUser, error: userError } = await supabaseClient
            .from('users')
            .select('balance, total_income, total_referrals')
            .eq('id', userId)
            .single();
        if (userError) throw userError;
        const count = await getReferralCount(userId); // count from referrals table for safety
        // Update the users table with exact count
        await supabaseClient
            .from('users')
            .update({ 
                total_referrals: count,
                last_active: new Date().toISOString()
            })
            .eq('id', userId);
        // Update cache with fresh balance and income
        if (userCache.has(userId)) {
            const cached = userCache.get(userId);
            cached.data.balance = freshUser.balance;
            cached.data.total_income = freshUser.total_income;
            cached.data.total_referrals = count;
            cached.timestamp = Date.now();
            localStorage.setItem(`deshi_user_${userId}`, JSON.stringify(cached));
        }
        return {
            total_referrals: count,
            balance: freshUser.balance,
            total_income: freshUser.total_income
        };
    } catch (error) {
        console.error('Refresh referral count error:', error);
        return 0;
    }
}

async function requestWithdrawalOptimized(userId, userName, amount, accountNumber, method, userAds, userReferrals) {
    try {
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .insert([{
                user_id: userId, user_name: userName, amount: amount,
                account_number: accountNumber, method: method,
                status: 'pending', request_date: new Date().toISOString(),
                timestamp: Date.now(), user_ads: userAds, user_referrals: userReferrals
            }])
            .select()
            .single();
        if (error) throw error;
        return { success: true, data };
    } catch (error) { console.error('Withdrawal error:', error); return { success: false, error: error.message }; }
}

// Exports
window.supabase = supabaseClient;
window.getUserDataOptimized = getUserDataOptimized;
window.createUserOptimized = createUserOptimized;
window.createReferralRecord = createReferralRecord;
window.getUserReferralsList = getUserReferralsList;
window.getReferralCount = getReferralCount;
window.refreshReferralCount = refreshReferralCount;
window.requestWithdrawalOptimized = requestWithdrawalOptimized;
window.logAdWatch = logAdWatch;

console.log('✅ Supabase Client Loaded (referral bonus sync improved)');
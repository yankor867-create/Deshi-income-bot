// api/bot.js
// ⚠️ TOKEN IS HARDCODED – MOVE TO ENV VAR LATER!

const BOT_TOKEN = '8763377927:AAE43INuRksUN1HSImP6HcsF4Q47M8sw6Y8'; // <- your token (revoke this later!)
const APP_URL = 'https://deshi-income-bot.vercel.app';        // your mini app URL from config.js
const PAYMENT_CHANNEL = 'https://t.me/mishti_kumra_official';

export default async function handler(req, res) {
  // Only accept POST requests from Telegram
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  const update = req.body;
  
  // Handle /start command
  if (update.message && update.message.text === '/start') {
    const chatId = update.message.chat.id;
    const firstName = update.message.from.first_name || 'there';
    
    // Check for deep link payload (e.g., startapp=ref123)
    let miniAppUrl = APP_URL;
    const payload = update.message.text.split(' ')[1]; // /start ref123
    if (payload && payload.startsWith('ref')) {
      miniAppUrl = `${APP_URL}?startapp=${payload}`;
    }

    const welcomeText = `🇧🇩 **দেশী ইনকামে স্বাগতম!**\n\n💰 সাইন আপ বোনাস: ৫০ টাকা\n🎬 প্রতি এড: ১০ টাকা\n⭐ বোনাস এড: ৫ টাকা\n🌟 দৈনিক বোনাস: ৩ টাকা\n👥 রেফারেল বোনাস: ১০০ টাকা\n\nনিচের বাটনে ক্লিক করে শুরু করুন!`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '🚀 কাজ শুরু করুন', web_app: { url: miniAppUrl } },
          { text: '📢 পেমেন্ট প্রুফ চ্যানেল', url: PAYMENT_CHANNEL }
        ]
      ]
    };

    await sendMessage(chatId, welcomeText, replyMarkup);
  }

  res.status(200).json({ ok: true });
}

async function sendMessage(chatId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    reply_markup: replyMarkup
  };
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
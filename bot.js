const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ==========================================
// 🤖 เมนูหลัก
// ==========================================
const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('📋 บริการของเรา', 'services')],
    [Markup.button.callback('💰 ราคา/แพ็กเกจ', 'pricing')],
    [Markup.button.callback('📞 ติดต่อเจ้าหน้าที่', 'contact')],
    [Markup.button.callback('❓ คำถามที่พบบ่อย', 'faq')],
    [Markup.button.callback('🕐 เวลาทำการ', 'hours')],
]);

// ==========================================
// /start — ข้อความต้อนรับ
// ==========================================
bot.start((ctx) => {
    const name = ctx.from.first_name || 'คุณ';
    ctx.reply(
        `สวัสดีครับ คุณ${name} 👋\n\nยินดีต้อนรับสู่ระบบสอบถามบริการ\nกรุณาเลือกหัวข้อที่ต้องการได้เลยครับ`,
        mainMenu
    );
});

// ==========================================
// /help — กลับเมนูหลัก
// ==========================================
bot.help((ctx) => {
    ctx.reply('กรุณาเลือกหัวข้อที่ต้องการครับ', mainMenu);
});

// ==========================================
// 📋 บริการของเรา
// ==========================================
bot.action('services', (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText(
        `📋 *บริการของเรา*\n\n` +
        `1️⃣ บริการ A — อธิบายบริการ A\n` +
        `2️⃣ บริการ B — อธิบายบริการ B\n` +
        `3️⃣ บริการ C — อธิบายบริการ C\n\n` +
        `สนใจบริการไหน สามารถสอบถามเพิ่มเติมได้เลยครับ`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('💰 ดูราคา', 'pricing')],
                [Markup.button.callback('📞 ติดต่อเจ้าหน้าที่', 'contact')],
                [Markup.button.callback('🔙 กลับเมนูหลัก', 'back_main')],
            ])
        }
    );
});

// ==========================================
// 💰 ราคา/แพ็กเกจ
// ==========================================
bot.action('pricing', (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText(
        `💰 *ราคา/แพ็กเกจ*\n\n` +
        `📦 *แพ็กเกจ Basic*\n` +
        `   ราคา: XXX บาท/เดือน\n` +
        `   รายละเอียด: ...\n\n` +
        `📦 *แพ็กเกจ Standard*\n` +
        `   ราคา: XXX บาท/เดือน\n` +
        `   รายละเอียด: ...\n\n` +
        `📦 *แพ็กเกจ Premium*\n` +
        `   ราคา: XXX บาท/เดือน\n` +
        `   รายละเอียด: ...`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📞 สนใจ ติดต่อเจ้าหน้าที่', 'contact')],
                [Markup.button.callback('🔙 กลับเมนูหลัก', 'back_main')],
            ])
        }
    );
});

// ==========================================
// 📞 ติดต่อเจ้าหน้าที่
// ==========================================
bot.action('contact', (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText(
        `📞 *ติดต่อเจ้าหน้าที่*\n\n` +
        `🔹 Line: @yourline\n` +
        `🔹 Tel: 0XX-XXX-XXXX\n` +
        `🔹 Email: your@email.com\n` +
        `🔹 Facebook: facebook.com/yourpage\n\n` +
        `⏰ เวลาทำการ: จันทร์-ศุกร์ 09:00-18:00 น.`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.url('💬 Line', 'https://line.me/yourline')],
                [Markup.button.callback('🔙 กลับเมนูหลัก', 'back_main')],
            ])
        }
    );
});

// ==========================================
// ❓ คำถามที่พบบ่อย
// ==========================================
bot.action('faq', (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText(
        `❓ *คำถามที่พบบ่อย*\n\n` +
        `*Q: คำถามที่ 1?*\n` +
        `A: คำตอบที่ 1\n\n` +
        `*Q: คำถามที่ 2?*\n` +
        `A: คำตอบที่ 2\n\n` +
        `*Q: คำถามที่ 3?*\n` +
        `A: คำตอบที่ 3\n\n` +
        `หากไม่พบคำตอบ กรุณาติดต่อเจ้าหน้าที่ครับ`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📞 ติดต่อเจ้าหน้าที่', 'contact')],
                [Markup.button.callback('🔙 กลับเมนูหลัก', 'back_main')],
            ])
        }
    );
});

// ==========================================
// 🕐 เวลาทำการ
// ==========================================
bot.action('hours', (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText(
        `🕐 *เวลาทำการ*\n\n` +
        `📅 จันทร์ - ศุกร์\n` +
        `   09:00 - 18:00 น.\n\n` +
        `📅 เสาร์\n` +
        `   09:00 - 13:00 น.\n\n` +
        `📅 อาทิตย์ และวันหยุดนักขัตฤกษ์\n` +
        `   หยุดทำการ\n\n` +
        `💬 นอกเวลาทำการสามารถทิ้งข้อความไว้ได้เลยครับ`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📞 ติดต่อเจ้าหน้าที่', 'contact')],
                [Markup.button.callback('🔙 กลับเมนูหลัก', 'back_main')],
            ])
        }
    );
});

// ==========================================
// 🔙 กลับเมนูหลัก
// ==========================================
bot.action('back_main', (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText(
        'กรุณาเลือกหัวข้อที่ต้องการครับ',
        mainMenu
    );
});

// ==========================================
// 📨 รับข้อความทั่วไป
// ==========================================
bot.on('text', (ctx) => {
    ctx.reply(
        'กรุณาเลือกเมนูด้านล่างครับ หรือพิมพ์ /start เพื่อเริ่มใหม่',
        mainMenu
    );
});

// ==========================================
// 🚀 Start Bot
// ==========================================
bot.launch();
console.log('🤖 Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

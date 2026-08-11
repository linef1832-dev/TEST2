const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);
const CONFIG_PATH = path.join(__dirname, 'config.json');

// ==========================================
// โหลด config จากไฟล์ (real-time)
// ==========================================
function getConfig() {
    try {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
        console.error('❌ อ่าน config ไม่ได้:', e);
        return { menus: [], welcome_message: 'สวัสดีครับ', default_reply: 'กรุณาเลือกเมนูครับ' };
    }
}

// สร้างเมนูหลักจาก config
function buildMainMenu() {
    const config = getConfig();
    const buttons = config.menus.map(m => [Markup.button.callback(m.label, m.id)]);
    return Markup.inlineKeyboard(buttons);
}

// สร้างปุ่มของแต่ละเมนู
function buildMenuButtons(menuId) {
    const config = getConfig();
    const menu = config.menus.find(m => m.id === menuId);
    if (!menu) return Markup.inlineKeyboard([[Markup.button.callback('🔙 กลับเมนูหลัก', 'back_main')]]);

    const buttonMap = {};
    config.menus.forEach(m => { buttonMap[m.id] = m.label; });
    buttonMap['back_main'] = '🔙 กลับเมนูหลัก';

    const buttons = (menu.buttons || ['back_main']).map(btnId => [
        Markup.button.callback(buttonMap[btnId] || btnId, btnId)
    ]);
    return Markup.inlineKeyboard(buttons);
}

// ==========================================
// /start
// ==========================================
bot.start((ctx) => {
    const config = getConfig();
    const name = ctx.from.first_name || 'คุณ';
    const welcome = config.welcome_message.replace('{name}', name);
    ctx.reply(welcome, buildMainMenu());
});

bot.help((ctx) => {
    ctx.reply('กรุณาเลือกหัวข้อที่ต้องการครับ', buildMainMenu());
});

// ==========================================
// Dynamic menu handler
// ==========================================
function handleMenu(ctx, menuId) {
    ctx.answerCbQuery();
    const config = getConfig();

    if (menuId === 'back_main') {
        return ctx.editMessageText('กรุณาเลือกหัวข้อที่ต้องการครับ', buildMainMenu());
    }

    const menu = config.menus.find(m => m.id === menuId);
    if (!menu) return ctx.answerCbQuery('ไม่พบเมนูนี้');

    ctx.editMessageText(menu.content, {
        parse_mode: 'Markdown',
        ...buildMenuButtons(menuId)
    });
}

// ลงทะเบียน action สำหรับทุกเมนูใน config
const config = getConfig();
config.menus.forEach(menu => {
    bot.action(menu.id, (ctx) => handleMenu(ctx, menu.id));
});
bot.action('back_main', (ctx) => handleMenu(ctx, 'back_main'));

// รับ action ที่เพิ่มใหม่จาก admin (dynamic)
bot.on('callback_query', (ctx) => {
    const data = ctx.callbackQuery.data;
    handleMenu(ctx, data);
});

// ==========================================
// รับข้อความทั่วไป
// ==========================================
bot.on('text', (ctx) => {
    const config = getConfig();
    ctx.reply(config.default_reply, buildMainMenu());
});

// ==========================================
// Start
// ==========================================
bot.launch();
console.log('🤖 Bot is running...');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

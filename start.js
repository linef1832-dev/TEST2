const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const express = require('express');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

function readConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}
function saveConfig(data) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}
function auth(req, res, next) {
    const pin = req.headers['x-admin-pin'] || req.query.pin;
    if (pin !== ADMIN_PIN) return res.status(401).json({ error: 'Unauthorized' });
    next();
}

// ==========================================
// BOT
// ==========================================
const bot = new Telegraf(process.env.BOT_TOKEN);

function getConfig() {
    try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
    catch (e) { return { menus: [], welcome_message: 'สวัสดีครับ', default_reply: 'กรุณาเลือกเมนูครับ' }; }
}
function buildMainMenu() {
    const config = getConfig();
    return Markup.inlineKeyboard(config.menus.map(m => [Markup.button.callback(m.label, m.id)]));
}
function buildMenuButtons(menuId) {
    const config = getConfig();
    const menu = config.menus.find(m => m.id === menuId);
    if (!menu) return Markup.inlineKeyboard([[Markup.button.callback('🔙 กลับเมนูหลัก', 'back_main')]]);
    const buttonMap = {};
    config.menus.forEach(m => { buttonMap[m.id] = m.label; });
    buttonMap['back_main'] = '🔙 กลับเมนูหลัก';
    return Markup.inlineKeyboard((menu.buttons || ['back_main']).map(btnId => [Markup.button.callback(buttonMap[btnId] || btnId, btnId)]));
}
function handleMenu(ctx, menuId) {
    ctx.answerCbQuery();
    const config = getConfig();
    if (menuId === 'back_main') return ctx.editMessageText('กรุณาเลือกหัวข้อที่ต้องการครับ', buildMainMenu());
    const menu = config.menus.find(m => m.id === menuId);
    if (!menu) return;
    ctx.editMessageText(menu.content, { parse_mode: 'Markdown', ...buildMenuButtons(menuId) });
}
bot.start((ctx) => {
    const config = getConfig();
    ctx.reply(config.welcome_message.replace('{name}', ctx.from.first_name || 'คุณ'), buildMainMenu());
});
bot.help((ctx) => ctx.reply('กรุณาเลือกหัวข้อครับ', buildMainMenu()));
const initConfig = getConfig();
initConfig.menus.forEach(menu => { bot.action(menu.id, (ctx) => handleMenu(ctx, menu.id)); });
bot.action('back_main', (ctx) => handleMenu(ctx, 'back_main'));
bot.on('callback_query', (ctx) => handleMenu(ctx, ctx.callbackQuery.data));
bot.on('text', (ctx) => { const c = getConfig(); ctx.reply(c.default_reply, buildMainMenu()); });
bot.launch();
console.log('🤖 Bot is running...');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// ==========================================
// ADMIN WEB — serve index.html
// ==========================================
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/api/config', auth, (req, res) => res.json(readConfig()));
app.post('/api/menu/update', auth, (req, res) => {
    try {
        const { idx, label, content, buttons } = req.body;
        const c = readConfig();
        c.menus[idx] = { ...c.menus[idx], label, content, buttons };
        saveConfig(c); res.json({ ok: true });
    } catch(e) { res.json({ ok: false, error: e.message }); }
});
app.post('/api/menu/add', auth, (req, res) => {
    try {
        const { id, label, content, buttons } = req.body;
        const c = readConfig();
        if (c.menus.find(m => m.id === id)) return res.json({ ok: false, error: 'ID ซ้ำ' });
        c.menus.push({ id, label, content, buttons });
        saveConfig(c); res.json({ ok: true });
    } catch(e) { res.json({ ok: false, error: e.message }); }
});
app.post('/api/menu/delete', auth, (req, res) => {
    try {
        const c = readConfig();
        c.menus = c.menus.filter(m => m.id !== req.body.id);
        saveConfig(c); res.json({ ok: true });
    } catch(e) { res.json({ ok: false, error: e.message }); }
});
app.post('/api/menu/move', auth, (req, res) => {
    try {
        const { idx, dir } = req.body;
        const c = readConfig();
        const ni = idx + dir;
        if (ni < 0 || ni >= c.menus.length) return res.json({ ok: false });
        [c.menus[idx], c.menus[ni]] = [c.menus[ni], c.menus[idx]];
        saveConfig(c); res.json({ ok: true });
    } catch(e) { res.json({ ok: false, error: e.message }); }
});
app.post('/api/messages', auth, (req, res) => {
    try {
        const c = readConfig();
        c.welcome_message = req.body.welcome_message;
        c.default_reply = req.body.default_reply;
        saveConfig(c); res.json({ ok: true });
    } catch(e) { res.json({ ok: false, error: e.message }); }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('🌐 Admin running on port ' + PORT));

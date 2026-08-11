// รัน Bot และ Admin Dashboard พร้อมกันแบบ fork แยก process
const { fork } = require('child_process');
const path = require('path');

const bot   = fork(path.join(__dirname, 'bot.js'));
const admin = fork(path.join(__dirname, 'admin.js'));

bot.on('exit', (code) => {
    console.error('❌ bot.js exited with code', code);
    process.exit(code);
});

admin.on('exit', (code) => {
    console.error('❌ admin.js exited with code', code);
    process.exit(code);
});

console.log('🚀 Bot + Admin Dashboard started!');

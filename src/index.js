const cron = require('node-cron');
const db = require('./database'); // index.js dan database.js sama-sama di dalam folder src/
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment');
const { handleMessage } = require('./handler');

// Keep-alive web server (wajib untuk UptimeRobot di Replit)
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Kos Anak aktif! ' + moment().format('DD/MM/YYYY HH:mm:ss'));
}).listen(PORT, () => {
    console.log(`🌐 Keep-alive server jalan di port ${PORT}`);
});

// Set locale Indonesia untuk moment
moment.locale('id');

const SESSION_PATH = process.env.WA_SESSION_PATH || './wa-session';

console.log('🚀 Memulai Bot Keuangan Anak Kos...\n');
console.log('📅 Waktu server:', moment().format('dddd, DD MMMM YYYY HH:mm:ss'));

// Inisialisasi WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: SESSION_PATH
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// Cron Job: Ingatkan tugas besok setiap jam 21:00
cron.schedule('0 21 * * *', async () => {
    console.log('⏰ Menjalankan pengecekan tugas besok...');
    const besok = moment().add(1, 'days').format('DD/MM/YYYY');
    
    // Ambil semua user
    const users = await db.queryAsync('SELECT * FROM users', []);
    
    for (const user of users) {
        const tugasBesok = await db.queryAsync(
            'SELECT nama_tugas FROM tugas WHERE user_id = ? AND deadline = ? AND status = ?',
            [user.id, besok, 'belum']
        );
        
        if (tugasBesok.length > 0) {
            const list = tugasBesok.map(t => `• ${t.nama_tugas}`).join('\n');
            const pesan = `🚨 *PENGINGAT TUGAS!* 🚨\n\nHalo *${user.nama}*, ada tugas yang harus dikumpul besok:\n\n${list}\n\nJangan lupa dikerjakan ya! Semangat! 💪`;
            
            try {
                await client.sendMessage(user.phone_number + '@c.us', pesan);
            } catch (e) {
                console.error(`Gagal kirim pengingat ke ${user.phone_number}:`, e);
            }
        }
    }
});

// Event: QR Code untuk login
client.on('qr', (qr) => {
    console.log('📱 Scan QR Code ini dengan WhatsApp kamu:\n');
    qrcode.generate(qr, { small: true });
    console.log('\nCara scan:');
    console.log('1. Buka WhatsApp di HP');
    console.log('2. Tap Menu (3 titik) > Perangkat Tertaut');
    console.log('3. Tap "Tautkan Perangkat"');
    console.log('4. Scan QR code di atas\n');
});

// Event: Loading/Authenticating
client.on('loading_screen', (percent, message) => {
    console.log('⏳ Loading...', percent, message);
});

// Event: Authenticated
client.on('authenticated', () => {
    console.log('✅ Autentikasi berhasil!');
});

// Event: Authentication Failed
client.on('auth_failure', (msg) => {
    console.error('❌ Autentikasi gagal:', msg);
});

// Event: Ready
client.on('ready', () => {
    console.log('✅ Bot siap digunakan!');
    console.log('📱 Nomor bot:', client.info.wid.user);
    console.log('👤 Nama bot:', client.info.pushname);
    console.log('\n🎉 Sekarang bot sudah bisa menerima pesan!');
    console.log('Ketik !menu di WhatsApp untuk mulai\n');
});

// Event: Message received (dari orang lain)
client.on('message', async (msg) => {
    try {
        const contact = await msg.getContact();
        console.log(`📩 Pesan dari ${contact.pushname || contact.number}: "${msg.body}"`);

        const response = await handleMessage(msg);
        if (response) await msg.reply(response);

    } catch (error) {
        console.error('❌ Error:', error);
    }
});

// Event: Message yang KAMU kirim (termasuk ke diri sendiri)
client.on('message_create', async (msg) => {
    // Hanya proses jika pesan dari KAMU sendiri (fromMe)
    if (!msg.fromMe) return;

    try {
        const response = await handleMessage(msg);
        if (response) await msg.reply(response);
    } catch (error) {
        console.error('❌ Error:', error);
    }
});

// Event: Disconnected
client.on('disconnected', (reason) => {
    console.log('⚠️ Bot terputus:', reason);
});

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Menghentikan bot...');
    await client.destroy();
    process.exit(0);
});

// Inisialisasi client
client.initialize();

// Auto-restart mechanism: jika bot mati/error, hidupkan ulang
process.on('uncaughtException', async (err) => {
    console.error('❌ Uncaught Exception:', err);
    console.log('🔄 Memulai ulang bot dalam 5 detik...');
    setTimeout(() => {
        process.exit(1); // Force restart (Replit auto-runs npm start)
    }, 5000);
});

process.on('unhandledRejection', async (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Bot terputus:', reason);
    console.log('🔄 Memulai ulang bot dalam 5 detik...');
    setTimeout(() => {
        process.exit(1); // Force restart
    }, 5000);
});

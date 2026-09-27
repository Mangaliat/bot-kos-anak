const moment = require('moment');

function handleMenu() {
    return `🤖 *BOT KEUANGAN ANAK KOS* 🏠

Halo! Aku bot yang bakal bantu kamu catat pemasukan & pengeluaran. Gampang kok!

📝 *PERINTAH DASAR:*

💰 *Catat Pemasukan*
\`!pemasukan [jumlah] [sumber] [keterangan]\`
Contoh: \`!pemasukan 1000000 uang_saku dari ortu\`

💸 *Catat Pengeluaran*
\`!keluar [jumlah] [kategori] [keterangan]\`
Contoh: \`!keluar 15000 makan warteg langganan\`

📊 *Lihat Laporan*
\`!laporan\` - laporan bulan ini
\`!laporan 8 2026\` - laporan bulan tertentu

💵 *Cek Saldo*
\`!saldo\` - saldo bulan ini

📋 *Menu & Bantuan*
\`!menu\` atau \`!help\` - tampilkan menu ini

${'='.repeat(35)}

💡 *TIPS:*
• Semua angka tanpa titik/koma (15000 bukan 15.000)
• Kategori pakai underscore (bayar_kos bukan bayar kos)
• Keterangan opsional tapi berguna buat ingat-ingat

🍜 *Kategori Populer:*
makan, jajan, transport, bayar_kos, listrik, wifi, pulsa, hiburan, belanja, kesehatan, pakaian, laundry

Selamat mengelola keuangan! 🚀`;
}

function handleUnknown(command) {
    return `❌ Perintah *${command}* tidak dikenali.

Ketik *!menu* untuk melihat daftar perintah yang tersedia.`;
}

module.exports = { handleMenu, handleUnknown };

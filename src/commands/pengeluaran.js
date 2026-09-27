const moment = require('moment');
const db = require('../database');

// Format: !keluar [jumlah] [kategori] [keterangan opsional]
// Contoh: !keluar 15000 makan warteg
// Contoh: !keluar 50000 transport ke kampus
async function handlePengeluaran(msg, args, user) {
    if (args.length < 2) {
        return `❌ Format salah!

Cara pakai:
*!keluar [jumlah] [kategori] [keterangan]*

Contoh:
• !keluar 15000 makan warteg langganan
• !keluar 50000 transport gojek
• !keluar 1500000 bayar_kos bulan oktober
• !keluar 5000 jajan gorengan

Kategori populer:
🍜 makan, jajan, minum, kopi
🏠 bayar_kos, listrik, wifi
🚌 transport, bensin, parkir
📚 buku, fotocopy, print
🎮 hiburan, nongkrong, streaming
🛒 belanja, toiletries, pulsa
💊 kesehatan, obat
👕 pakaian, laundry`;
    }

    const jumlah = parseFloat(args[0]);
    const kategori = args[1].toLowerCase();
    const keterangan = args.slice(2).join(' ') || '-';
    const tanggal = moment().format('YYYY-MM-DD');

    if (isNaN(jumlah) || jumlah <= 0) {
        return '❌ Jumlah harus angka positif! Contoh: 15000';
    }

    try {
        await db.addPengeluaran(user.id, jumlah, kategori, keterangan, tanggal);
        
        // Hitung total pengeluaran bulan ini
        const bulan = moment().month() + 1;
        const tahun = moment().year();
        const totalBulan = await db.getTotalPengeluaranBulan(user.id, bulan, tahun);

        return `✅ *Pengeluaran Tercatat!*

💸 Jumlah: Rp ${jumlah.toLocaleString('id-ID')}
📂 Kategori: ${kategori}
📝 Keterangan: ${keterangan}
📅 Tanggal: ${moment(tanggal).format('DD MMMM YYYY')}

📊 Total pengeluaran bulan ini: *Rp ${totalBulan.toLocaleString('id-ID')}*`;

    } catch (error) {
        console.error('Error add pengeluaran:', error);
        return '❌ Gagal menyimpan pengeluaran. Coba lagi ya!';
    }
}

module.exports = { handlePengeluaran };

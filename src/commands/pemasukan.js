const moment = require('moment');
const db = require('../database');

// Format: !pemasukan [jumlah] [sumber] [keterangan opsional]
// Contoh: !pemasukan 1000000 uang_saku dari ortu
// Contoh: !pemasukan 500000 gaji_part_time
async function handlePemasukan(msg, args, user) {
    if (args.length < 2) {
        return `❌ Format salah!

Cara pakai:
*!pemasukan [jumlah] [sumber] [keterangan]*

Contoh:
• !pemasukan 1000000 uang_saku dari ortu
• !pemasukan 500000 gaji_part_time
• !pemasukan 200000 transfer teman

Sumber: uang_saku, gaji_part_time, bonus, transfer, lainnya`;
    }

    const jumlah = parseFloat(args[0]);
    const sumber = args[1];
    const keterangan = args.slice(2).join(' ') || '-';
    const tanggal = moment().format('YYYY-MM-DD');

    if (isNaN(jumlah) || jumlah <= 0) {
        return '❌ Jumlah harus angka positif! Contoh: 100000';
    }

    try {
        await db.addPemasukan(user.id, jumlah, sumber, keterangan, tanggal);
        
        // Hitung total pemasukan bulan ini
        const bulan = moment().month() + 1;
        const tahun = moment().year();
        const totalBulan = await db.getTotalPemasukanBulan(user.id, bulan, tahun);

        return `✅ *Pemasukan Tercatat!*

💰 Jumlah: Rp ${jumlah.toLocaleString('id-ID')}
📥 Sumber: ${sumber}
📝 Keterangan: ${keterangan}
📅 Tanggal: ${moment(tanggal).format('DD MMMM YYYY')}

📊 Total pemasukan bulan ini: *Rp ${totalBulan.toLocaleString('id-ID')}*`;

    } catch (error) {
        console.error('Error add pemasukan:', error);
        return '❌ Gagal menyimpan pemasukan. Coba lagi ya!';
    }
}

module.exports = { handlePemasukan };

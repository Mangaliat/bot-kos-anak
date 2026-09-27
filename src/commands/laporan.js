const moment = require('moment');
const db = require('../database');

// !laporan - laporan bulan ini
// !laporan 8 2026 - laporan bulan agustus 2026
async function handleLaporan(msg, args, user) {
    let bulan = moment().month() + 1;
    let tahun = moment().year();

    if (args.length >= 2) {
        bulan = parseInt(args[0]);
        tahun = parseInt(args[1]);
        
        if (isNaN(bulan) || isNaN(tahun) || bulan < 1 || bulan > 12) {
            return '❌ Format tanggal salah! Contoh: !laporan 8 2026';
        }
    }

    try {
        const totalPemasukan = await db.getTotalPemasukanBulan(user.id, bulan, tahun);
        const totalPengeluaran = await db.getTotalPengeluaranBulan(user.id, bulan, tahun);
        const pengeluaranPerKategori = await db.getPengeluaranPerKategori(user.id, bulan, tahun);
        
        const saldo = totalPemasukan - totalPengeluaran;
        const namaBulan = moment(`${tahun}-${bulan}-01`).format('MMMM YYYY');
        
        let laporan = `📊 *LAPORAN KEUANGAN*\n`;
        laporan += `📅 Periode: ${namaBulan}\n`;
        laporan += `👤 User: ${user.nama}\n`;
        laporan += `${'='.repeat(35)}\n\n`;
        
        laporan += `💰 *PEMASUKAN*\n`;
        laporan += `   Rp ${totalPemasukan.toLocaleString('id-ID')}\n\n`;
        
        laporan += `💸 *PENGELUARAN*\n`;
        laporan += `   Rp ${totalPengeluaran.toLocaleString('id-ID')}\n\n`;
        
        if (pengeluaranPerKategori.length > 0) {
            laporan += `📂 *PENGELUARAN PER KATEGORI:*\n`;
            pengeluaranPerKategori.forEach(item => {
                const persen = totalPengeluaran > 0 ? (item.total / totalPengeluaran * 100).toFixed(1) : 0;
                laporan += `   • ${item.kategori}: Rp ${item.total.toLocaleString('id-ID')} (${persen}%)\n`;
            });
            laporan += `\n`;
        }
        
        laporan += `${'='.repeat(35)}\n`;
        laporan += `💵 *SALDO:* Rp ${saldo.toLocaleString('id-ID')}\n`;
        
        if (saldo < 0) {
            laporan += `\n⚠️ *DEFISIT!* Pengeluaran lebih besar dari pemasukan.`;
        } else if (saldo > 0) {
            laporan += `\n✨ *SURPLUS!* Kamu masih ada sisa Rp ${saldo.toLocaleString('id-ID')}`;
        }
        
        // Tambahan analisis
        if (totalPengeluaran > 0) {
            const persentaseHemat = (saldo / totalPemasukan * 100).toFixed(1);
            laporan += `\n📈 Tingkat hemat: ${persentaseHemat}%`;
        }

        return laporan;

    } catch (error) {
        console.error('Error generate laporan:', error);
        return '❌ Gagal membuat laporan. Coba lagi ya!';
    }
}

async function handleSaldo(msg, args, user) {
    try {
        const bulan = moment().month() + 1;
        const tahun = moment().year();
        
        const totalPemasukan = await db.getTotalPemasukanBulan(user.id, bulan, tahun);
        const totalPengeluaran = await db.getTotalPengeluaranBulan(user.id, bulan, tahun);
        const saldo = totalPemasukan - totalPengeluaran;
        
        let response = `💰 *SALDO BULAN INI*\n`;
        response += `📅 ${moment().format('MMMM YYYY')}\n`;
        response += `👤 Pengguna: *${user.nama}*\n\n`;
        response += `💵 Saldo: *Rp ${saldo.toLocaleString('id-ID')}*\n\n`;
        response += `📥 Total pemasukan: Rp ${totalPemasukan.toLocaleString('id-ID')}\n`;
        response += `📤 Total pengeluaran: Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
        
        if (saldo < 100000 && saldo > 0) {
            response += `\n\n⚠️ Saldo tipis nih! Mulai berhemat ya!`;
        } else if (saldo <= 0) {
            response += `\n\n🚨 Minus! Hati-hati dengan pengeluaran!`;
        }

        return response;

    } catch (error) {
        console.error('Error cek saldo:', error);
        return '❌ Gagal mengecek saldo. Coba lagi ya!';
    }
}

module.exports = { handleLaporan, handleSaldo };

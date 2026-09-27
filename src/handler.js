const db = require('./database');
const moment = require('moment');
const { handleLaporan, handleSaldo } = require('./commands/laporan');

// Fungsi untuk membersihkan titik dari angka (misal: 10.000 -> 10000)
function cleanNumber(str) {
    if (!str) return NaN;
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

// Fungsi parsing deadline tugas
function parseTugas(detail) {
    const parts = detail.trim().split(' ');
    if (parts.length === 0) return { nama: '', deadline: null };

    const last = parts[parts.length - 1].toLowerCase();
    let deadline = null;
    let namaParts = parts;

    // Format: besok / lusa
    if (last === 'besok') {
        deadline = moment().add(1, 'days');
        namaParts = parts.slice(0, -1);
    } else if (last === 'lusa') {
        deadline = moment().add(2, 'days');
        namaParts = parts.slice(0, -1);
    }
    // Format: 2026-09-30
    else if (/^\d{4}-\d{2}-\d{2}$/.test(last)) {
        const m = moment(last, 'YYYY-MM-DD', true);
        if (m.isValid()) { deadline = m; namaParts = parts.slice(0, -1); }
    }
    // Format: 30-09-2026 atau 30/09/2026
    else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(last)) {
        const sep = last.includes('/') ? '/' : '-';
        const m = moment(last, `DD${sep}MM${sep}YYYY`, true);
        if (m.isValid()) { deadline = m; namaParts = parts.slice(0, -1); }
    }
    // Format: 30-09 atau 30/09 (tanpa tahun)
    else if (/^\d{1,2}[-/]\d{1,2}$/.test(last)) {
        const sep = last.includes('/') ? '/' : '-';
        const m = moment(`${last}-${moment().year()}`, `DD${sep}MM${sep}YYYY`, true);
        if (m.isValid()) { deadline = m; namaParts = parts.slice(0, -1); }
    }

    const nama = namaParts.join(' ').trim();
    if (!nama) return { nama: '', deadline: null };

    return {
        nama,
        deadline: deadline ? deadline.format('DD/MM/YYYY') : 'Belum ditentukan'
    };
}

async function handleMessage(msg) {
    try {
        const bodyOriginal = msg.body ? msg.body.trim() : '';
        const body = bodyOriginal.toLowerCase();
        if (!body) return null;

        // Dapatkan User
        const contact = await msg.getContact();
        const phoneNumber = contact.number;
        const nama = contact.pushname || contact.name || phoneNumber;
        const user = await db.getOrCreateUser(phoneNumber, nama);

        const tanggal = moment().format('YYYY-MM-DD');

        // 1. PEMASUKAN (+)
        if (body.startsWith('+') && !body.startsWith('+tugas')) {
            const rawBody = bodyOriginal.replace('+', '').trim();
            const spaceIdx = rawBody.indexOf(' ');
            const rawAngka = spaceIdx === -1 ? rawBody : rawBody.substring(0, spaceIdx);
            const ket = spaceIdx === -1 ? 'pemasukan' : rawBody.substring(spaceIdx + 1).trim();

            const angka = cleanNumber(rawAngka);
            if (isNaN(angka)) return '❌ Format salah. Contoh: + 50.000 kiriman ortu';
            
            await db.addPemasukan(user.id, angka, 'masuk', ket, tanggal);
            const total = await db.getTotalPemasukanBulan(user.id, moment().month()+1, moment().year());
            return `✅ *Uang Masuk Tercatat!* \n💰 +Rp ${angka.toLocaleString('id-ID')}\n📝 Ket: ${ket}\n📅 Tanggal: ${moment().format('DD/MM/YYYY HH:mm')}\n📊 Total masuk bulan ini: Rp ${total.toLocaleString('id-ID')}`;
        }

        // 2. PENGELUARAN (-)
        if (body.startsWith('-')) {
            const parts = bodyOriginal.replace('-', '').trim().split(' ');
            const angka = cleanNumber(parts[0]);
            const ket = parts.slice(1).join(' ') || 'lainnya';

            if (isNaN(angka)) return '❌ Format salah. Contoh: - 10.000 makan bakso';
            
            await db.addPengeluaran(user.id, angka, 'umum', ket, tanggal);
            const total = await db.getTotalPengeluaranBulan(user.id, moment().month()+1, moment().year());
            return `💸 *Uang Keluar Tercatat!* \n📉 -Rp ${angka.toLocaleString('id-ID')} (${ket})\n📅 Tanggal: ${moment().format('DD/MM/YYYY HH:mm')}\n📊 Total keluar bulan ini: Rp ${total.toLocaleString('id-ID')}`;
        }

        // 3. FITUR TUGAS KULIAH
        // Tambah tugas: +tugas [nama] [deadline]
        if (body.startsWith('+tugas')) {
            const detail = bodyOriginal.substring(6).trim();
            if (!detail) return '❌ Format salah. Contoh: +tugas Bikin Database besok\nContoh deadline: besok / lusa / 30-09 / 2026-09-30';

            const parsed = parseTugas(detail);
            if (!parsed.nama) return '❌ Nama tugas kosong. Contoh: +tugas Laporan pweb besok';

            await db.runAsync(
                'INSERT INTO tugas (user_id, nama_tugas, deadline, status) VALUES (?, ?, ?, ?)',
                [user.id, parsed.nama, parsed.deadline, 'belum']
            );
            return `📚 *Tugas Kuliah Ditambahkan!*\n📌 ${parsed.nama}\n⏰ Deadline: ${parsed.deadline}\n👤 Oleh: *${user.nama}*\n\nKetik *tugas* untuk melihat daftar tugas.`;
        }

        // Lihat daftar tugas: tugas / t
        if (body === 'tugas' || body === 't') {
            const listTugas = await db.queryAsync(
                'SELECT id, nama_tugas, deadline FROM tugas WHERE user_id = ? AND status = ? ORDER BY id DESC',
                [user.id, 'belum']
            );

            if (listTugas.length === 0) {
                return `🎉 *Yey, ${user.nama}!* Tidak ada tugas kuliah yang belum selesai.`;
            }

            let resp = `📚 *DAFTAR TUGAS KULIAH (${user.nama})*\n\n`;
            listTugas.forEach((t, i) => {
                const dead = (t.deadline && t.deadline !== 'Belum ditentukan') ? ` ⏰ ${t.deadline}` : '';
                resp += `${i+1}. ${t.nama_tugas}${dead} *(ID: ${t.id})*\n`;
            });
            resp += `\nKetik *selesai [ID]* jika sudah selesai (Contoh: selesai 1)`;
            return resp;
        }

        // Selesaikan tugas: selesai [ID]
        if (body.startsWith('selesai ')) {
            const idTugas = body.replace('selesai', '').trim();
            if (!idTugas) return '❌ Contoh: selesai 1';

            const result = await db.runAsync(
                'UPDATE tugas SET status = ? WHERE id = ? AND user_id = ?',
                ['selesai', idTugas, user.id]
            );

            if (result.changes > 0) {
                return `✅ *Tugas #${idTugas} selesai!* Hebat kamu, ${user.nama}! 🎉`;
            } else {
                return `❌ Tugas dengan ID #${idTugas} tidak ditemukan. Ketik *tugas* untuk lihat ID.`;
            }
        }

        // 4. FITUR UTANG-PIUTANG
        // Catat utang: +utang [jumlah] [nama] [keterangan]
        if (body.startsWith('+utang')) {
            const detail = bodyOriginal.substring(6).trim().split(' ');
            if (detail.length < 2) return '❌ Format salah. Contoh: +utang 50.000 budi makan';

            const jumlah = cleanNumber(detail[0]);
            const nama = detail[1];
            const ket = detail.slice(2).join(' ') || 'utang';

            if (isNaN(jumlah)) return '❌ Jumlah tidak valid. Contoh: +utang 50.000 budi makan';

            await db.runAsync(
                'INSERT INTO utang (user_id, jenis, nama, jumlah, keterangan, status) VALUES (?, ?, ?, ?, ?, ?)',
                [user.id, 'hutang', nama, jumlah, ket, 'belum']
            );

            return `⚠️ *Utang Tercatat!*\n💸 Kamu berutang ke *${nama}*\n💰 Jumlah: Rp ${jumlah.toLocaleString('id-ID')}\n📝 Ket: ${ket}\n📅 ${moment().format('DD/MM/YYYY HH:mm')}\n\nKetik *utang* untuk lihat semua.`;
        }

        // Catat piutang: +piutang [jumlah] [nama] [keterangan]
        if (body.startsWith('+piutang')) {
            const detail = bodyOriginal.substring(8).trim().split(' ');
            if (detail.length < 2) return '❌ Format salah. Contoh: +piutang 100.000 ani pulsa';

            const jumlah = cleanNumber(detail[0]);
            const nama = detail[1];
            const ket = detail.slice(2).join(' ') || 'piutang';

            if (isNaN(jumlah)) return '❌ Jumlah tidak valid. Contoh: +piutang 100.000 ani pulsa';

            await db.runAsync(
                'INSERT INTO utang (user_id, jenis, nama, jumlah, keterangan, status) VALUES (?, ?, ?, ?, ?, ?)',
                [user.id, 'piutang', nama, jumlah, ket, 'belum']
            );

            return `💰 *Piutang Tercatat!*\n👤 *${nama}* berutang ke kamu\n💵 Jumlah: Rp ${jumlah.toLocaleString('id-ID')}\n📝 Ket: ${ket}\n📅 ${moment().format('DD/MM/YYYY HH:mm')}\n\nKetik *utang* untuk lihat semua.`;
        }

        // Lihat daftar utang: utang / u
        if (body === 'utang' || body === 'u') {
            const listUtang = await db.queryAsync(
                'SELECT id, jenis, nama, jumlah, keterangan, created_at FROM utang WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
                [user.id, 'belum']
            );

            if (listUtang.length === 0) {
                return `✅ *Mantap, ${user.nama}!* Tidak ada utang/piutang yang belum lunas.`;
            }

            let resp = `💳 *DAFTAR UTANG & PIUTANG (${user.nama})*\n\n`;
            let totalHutang = 0;
            let totalPiutang = 0;

            const hutang = listUtang.filter(u => u.jenis === 'hutang');
            const piutang = listUtang.filter(u => u.jenis === 'piutang');

            if (hutang.length > 0) {
                resp += '⚠️ *UTANG (Kamu berutang):*\n';
                hutang.forEach((u) => {
                    resp += `  • ${u.nama}: Rp ${u.jumlah.toLocaleString('id-ID')} (${u.keterangan}) *[${u.id}]*\n`;
                    totalHutang += u.jumlah;
                });
                resp += `  ─────────────\n  Total: Rp ${totalHutang.toLocaleString('id-ID')}\n\n`;
            }

            if (piutang.length > 0) {
                resp += '💰 *PIUTANG (Orang berutang ke kamu):*\n';
                piutang.forEach((u) => {
                    resp += `  • ${u.nama}: Rp ${u.jumlah.toLocaleString('id-ID')} (${u.keterangan}) *[${u.id}]*\n`;
                    totalPiutang += u.jumlah;
                });
                resp += `  ─────────────\n  Total: Rp ${totalPiutang.toLocaleString('id-ID')}\n\n`;
            }

            resp += `Ketik *lunas [ID]* untuk tandai sudah dibayar (Contoh: lunas 1)`;
            return resp;
        }

        // Tandai lunas: lunas [ID]
        if (body.startsWith('lunas ')) {
            const idUtang = body.replace('lunas', '').trim();
            if (!idUtang) return '❌ Contoh: lunas 1';

            const result = await db.runAsync(
                'UPDATE utang SET status = ? WHERE id = ? AND user_id = ?',
                ['lunas', idUtang, user.id]
            );

            if (result.changes > 0) {
                return `✅ *Utang/Piutang #${idUtang} sudah lunas!* 💸✨`;
            } else {
                return `❌ ID #${idUtang} tidak ditemukan. Ketik *utang* untuk lihat ID.`;
            }
        }

        // 4. PENGINGAT (p)
        if (body === 'p' || body === 'pengingat') {
            return await handlePengingat(msg, user);
        }

        // 5. KATA KUNCI SINGKAT
        if (body === 'saldo' || body === 's') return await handleSaldo(msg, [], user);
        if (body === 'laporan' || body === 'l') return await handleLaporan(msg, [], user);
        if (body === 'menu' || body === 'm' || body === 'help') {
            return `🤖 *BOT KEUANGAN & KULIAH*

💰 *Keuangan:*
• *+ 10.000 gajian* (Uang masuk)
• *- 10.000 makan* (Uang keluar)
• *s* (Cek Saldo)
• *l* (Laporan bulanan)
• *p* (Pengingat hari ini)

📚 *Tugas Kuliah:*
• *+tugas [nama] [deadline]* (Catat tugas baru)
• *tugas* (Lihat daftar tugas kamu)
• *selesai [ID]* (Tandai tugas kelar)

💳 *Utang & Piutang:*
• *+utang [jumlah] [nama] [ket]* (Catat kamu berutang)
• *+piutang [jumlah] [nama] [ket]* (Catat orang berutang)
• *utang* (Lihat daftar utang/piutang)
• *lunas [ID]* (Tandai sudah dibayar)`;
        }

        return null;

    } catch (error) {
        console.error('Error:', error);
        return '❌ Terjadi kesalahan saat memproses perintah.';
    }
}

// ===== FUNGSI PENGINGAT =====
async function handlePengingat(msg, user) {
    try {
        const hariIni = moment().format('YYYY-MM-DD');
        let result = `📅 *PENGINGAT HARI INI (${user.nama})*\n`;
        result += `📆 ${moment().format('dddd, DD MMMM YYYY')}\n\n`;
        
        let adaPengingat = false;

        // Cek pengeluaran hari ini
        try {
            const pengeluaranHari = await db.queryAsync(
                `SELECT jumlah, kategori, keterangan FROM pengeluaran WHERE user_id = ? AND tanggal = ?`,
                [user.id, hariIni]
            );
            if (pengeluaranHari && pengeluaranHari.length > 0) {
                adaPengingat = true;
                let totalKeluar = 0;
                result += '💸 *Pengeluaran Hari Ini:*\n';
                pengeluaranHari.forEach((item) => {
                    result += `  • Rp ${item.jumlah.toLocaleString('id-ID')} - ${item.keterangan}\n`;
                    totalKeluar += item.jumlah;
                });
                result += `  ─────────────\n  Total: Rp ${totalKeluar.toLocaleString('id-ID')}\n\n`;
            }
        } catch (e) { /* abaikan */ }

        // Cek pemasukan hari ini
        try {
            const pemasukanHari = await db.queryAsync(
                `SELECT jumlah, sumber, keterangan FROM pemasukan WHERE user_id = ? AND tanggal = ?`,
                [user.id, hariIni]
            );
            if (pemasukanHari && pemasukanHari.length > 0) {
                adaPengingat = true;
                let totalMasuk = 0;
                result += '💰 *Pemasukan Hari Ini:*\n';
                pemasukanHari.forEach((item) => {
                    result += `  • Rp ${item.jumlah.toLocaleString('id-ID')} - ${item.keterangan}\n`;
                    totalMasuk += item.jumlah;
                });
                result += `  ─────────────\n  Total: Rp ${totalMasuk.toLocaleString('id-ID')}\n\n`;
            }
        } catch (e) { /* abaikan */ }

        // Cek tugas belum selesai
        try {
            const tugasList = await db.queryAsync(
                `SELECT id, nama_tugas FROM tugas WHERE user_id = ? AND status = 'belum' LIMIT 5`,
                [user.id]
            );
            if (tugasList && tugasList.length > 0) {
                adaPengingat = true;
                result += '📚 *Tugas Kuliah Belum Selesai:*\n';
                tugasList.forEach((t) => {
                    result += `  • ${t.nama_tugas} *(ID: ${t.id})*\n`;
                });
                result += '\n';
            }
        } catch (e) { /* abaikan */ }

        if (!adaPengingat) {
            result += '✅ *Santai aja!* Tidak ada pengingat hari ini 🎉';
        }

        return result;

    } catch (error) {
        console.error('Error handlePengingat:', error);
        return '❌ Gagal menampilkan pengingat';
    }
}

module.exports = { handleMessage };

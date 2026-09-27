const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/keuangan.db';

// Pastikan folder data ada
if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error membuka database:', err);
    } else {
        console.log('Database terhubung: ' + DB_PATH);
        initDatabase();
    }
});

function initDatabase() {
    // Tabel Pengguna
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT UNIQUE NOT NULL,
            nama TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabel Pemasukan
    db.run(`
        CREATE TABLE IF NOT EXISTS pemasukan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            jumlah REAL NOT NULL,
            sumber TEXT NOT NULL,
            keterangan TEXT,
            tanggal DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Tabel Pengeluaran
    db.run(`
        CREATE TABLE IF NOT EXISTS pengeluaran (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            jumlah REAL NOT NULL,
            kategori TEXT NOT NULL,
            keterangan TEXT,
            tanggal DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Tabel Budget (Batasan Pengeluaran)
    db.run(`
        CREATE TABLE IF NOT EXISTS budget (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            kategori TEXT NOT NULL,
            limit_bulanan REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Tabel Utang Simpel
    db.run(`
        CREATE TABLE IF NOT EXISTS utang (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            jenis TEXT NOT NULL, -- 'piutang' (dia utang ke kita) / 'utang' (kita utang ke dia)
            nama TEXT NOT NULL,
            jumlah REAL NOT NULL,
            keterangan TEXT,
            status TEXT DEFAULT 'belum',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Tabel Tugas Kuliah
    db.run(`
        CREATE TABLE IF NOT EXISTS tugas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            nama_tugas TEXT NOT NULL,
            deadline TEXT,
            status TEXT DEFAULT 'belum',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    console.log('Database initialized!');
}

// Query Helper Functions
const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const runAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

// User Functions
async function getOrCreateUser(phoneNumber, nama) {
    let user = await queryAsync('SELECT * FROM users WHERE phone_number = ?', [phoneNumber]);
    
    if (user.length === 0) {
        const result = await runAsync('INSERT INTO users (phone_number, nama) VALUES (?, ?)', [phoneNumber, nama]);
        return { id: result.id, phone_number: phoneNumber, nama };
    }
    return user[0];
}

async function addPemasukan(userId, jumlah, sumber, keterangan, tanggal) {
    return await runAsync(
        'INSERT INTO pemasukan (user_id, jumlah, sumber, keterangan, tanggal) VALUES (?, ?, ?, ?, ?)',
        [userId, jumlah, sumber, keterangan, tanggal]
    );
}

async function addPengeluaran(userId, jumlah, kategori, keterangan, tanggal) {
    return await runAsync(
        'INSERT INTO pengeluaran (user_id, jumlah, kategori, keterangan, tanggal) VALUES (?, ?, ?, ?, ?)',
        [userId, jumlah, kategori, keterangan, tanggal]
    );
}

async function getPemasukanBulan(userId, bulan, tahun) {
    return await queryAsync(
        `SELECT * FROM pemasukan 
         WHERE user_id = ? AND strftime('%m', tanggal) = ? AND strftime('%Y', tanggal) = ?
         ORDER BY tanggal DESC`,
        [userId, String(bulan).padStart(2, '0'), tahun]
    );
}

async function getPengeluaranBulan(userId, bulan, tahun) {
    return await queryAsync(
        `SELECT * FROM pengeluaran 
         WHERE user_id = ? AND strftime('%m', tanggal) = ? AND strftime('%Y', tanggal) = ?
         ORDER BY tanggal DESC`,
        [userId, String(bulan).padStart(2, '0'), tahun]
    );
}

async function getTotalPemasukanBulan(userId, bulan, tahun) {
    const result = await queryAsync(
        `SELECT SUM(jumlah) as total FROM pemasukan 
         WHERE user_id = ? AND strftime('%m', tanggal) = ? AND strftime('%Y', tanggal) = ?`,
        [userId, String(bulan).padStart(2, '0'), String(tahun)]
    );
    return result[0]?.total || 0;
}

async function getTotalPengeluaranBulan(userId, bulan, tahun) {
    const result = await queryAsync(
        `SELECT SUM(jumlah) as total FROM pengeluaran 
         WHERE user_id = ? AND strftime('%m', tanggal) = ? AND strftime('%Y', tanggal) = ?`,
        [userId, String(bulan).padStart(2, '0'), String(tahun)]
    );
    return result[0]?.total || 0;
}

async function getPengeluaranPerKategori(userId, bulan, tahun) {
    return await queryAsync(
        `SELECT kategori, SUM(jumlah) as total 
         FROM pengeluaran 
         WHERE user_id = ? AND strftime('%m', tanggal) = ? AND strftime('%Y', tanggal) = ?
         GROUP BY kategori ORDER BY total DESC`,
        [userId, String(bulan).padStart(2, '0'), tahun]
    );
}

module.exports = {
    db,
    getOrCreateUser,
    addPemasukan,
    addPengeluaran,
    getPemasukanBulan,
    getPengeluaranBulan,
    getTotalPemasukanBulan,
    getTotalPengeluaranBulan,
    getPengeluaranPerKategori,
    queryAsync,
    runAsync,
    allAsync: queryAsync  // Alias untuk queryAsync
};

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/keuangan.db');

db.all(`
    SELECT 
        id,
        user_id,
        jumlah,
        tanggal,
        strftime('%m', tanggal) as month_extracted,
        strftime('%Y', tanggal) as year_extracted
    FROM pemasukan 
    WHERE user_id = 1
`, (err, rows) => {
    if (err) console.error('Error:', err);
    else {
        console.log('Raw pemasukan data:');
        console.log(JSON.stringify(rows, null, 2));
    }
    
    // Sekarang coba query yang sama dengan getTotalPemasukanBulan
    db.all(`
        SELECT SUM(jumlah) as total 
        FROM pemasukan 
        WHERE user_id = 1 AND strftime('%m', tanggal) = '09' AND strftime('%Y', tanggal) = '2026'
    `, (err, total) => {
        if (err) console.error('Error:', err);
        else {
            console.log('\n\nQuery total (bulan 09, tahun 2026):');
            console.log(JSON.stringify(total, null, 2));
        }
        process.exit(0);
    });
});

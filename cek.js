const db = require('./src/database');

setTimeout(async () => {
  try {
    console.log('=== CEK USER ===');
    const users = await db.queryAsync('SELECT * FROM users');
    console.log(users);

    console.log('\n=== PEMASUKAN TERAKHIR 5 ===');
    const masuk = await db.queryAsync('SELECT id, user_id, jumlah, sumber, keterangan, tanggal, created_at FROM pemasukan ORDER BY id DESC LIMIT 5');
    console.log(masuk);

    console.log('\n=== PENGELUARAN TERAKHIR 5 ===');
    const keluar = await db.queryAsync('SELECT id, user_id, jumlah, kategori, keterangan, tanggal FROM pengeluaran ORDER BY id DESC LIMIT 5');
    console.log(keluar);
  } catch(e){
    console.error(e);
  }
  process.exit(0);
}, 1500);

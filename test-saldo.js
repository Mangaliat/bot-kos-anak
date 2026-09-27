const db = require('./src/database');

setTimeout(async () => {
  try {
    const userId = 1; // User 'caca'
    const bulan = 9;
    const tahun = 2026;

    console.log('=== TEST QUERY SALDO ===');
    console.log('User ID:', userId);
    console.log('Bulan:', bulan);
    console.log('Tahun:', tahun);

    const totalPemasukan = await db.getTotalPemasukanBulan(userId, bulan, tahun);
    console.log('Total Pemasukan:', totalPemasukan);

    const totalPengeluaran = await db.getTotalPengeluaranBulan(userId, bulan, tahun);
    console.log('Total Pengeluaran:', totalPengeluaran);

    const saldo = totalPemasukan - totalPengeluaran;
    console.log('Saldo:', saldo);

    // Cek raw data
    console.log('\n=== RAW DATA PEMASUKAN ===');
    const masuk = await db.queryAsync('SELECT * FROM pemasukan WHERE user_id = ?', [userId]);
    console.log(masuk);

  } catch(e) {
    console.error('Error:', e);
  }
  process.exit(0);
}, 1000);

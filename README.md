# 🤖 Bot Keuangan Anak Kos

Bot WhatsApp untuk mencatat dan mengelola pemasukan & pengeluaran keuangan anak kos.

## ✨ Fitur

- 💰 Catat pemasukan (uang saku, gaji part-time, dll)
- 💸 Catat pengeluaran dengan kategori
- 📊 Laporan keuangan bulanan otomatis
- 💵 Cek saldo real-time
- 📈 Analisis pengeluaran per kategori
- 🗃️ Database SQLite lokal (data aman di komputer kamu)

## 🚀 Cara Install & Jalankan

### 1. Pastikan Node.js Terinstall

Cek versi Node.js:
```bash
node --version
```

Kalau belum punya, download di: https://nodejs.org/

### 2. Install Dependencies

```bash
cd bot-kos-anak
npm install
```

### 3. Jalankan Bot

```bash
npm start
```

### 4. Scan QR Code

- Setelah bot jalan, akan muncul QR Code di terminal
- Buka WhatsApp di HP kamu
- Tap Menu (3 titik) > **Perangkat Tertaut**
- Tap **"Tautkan Perangkat"**
- Scan QR code yang muncul di terminal

### 5. Mulai Chat!

Setelah tersambung, kirim pesan ke nomor bot:
```
!menu
```

## 📝 Cara Pakai

### Catat Pemasukan
```
!pemasukan 1000000 uang_saku dari ortu
!pemasukan 500000 gaji_part_time
!pemasukan 200000 transfer
```

### Catat Pengeluaran
```
!keluar 15000 makan warteg langganan
!keluar 50000 transport gojek ke kampus
!keluar 1500000 bayar_kos oktober
!keluar 5000 jajan gorengan
```

### Lihat Laporan
```
!laporan           - laporan bulan ini
!laporan 8 2026    - laporan agustus 2026
```

### Cek Saldo
```
!saldo
```

## 🗂️ Kategori Pengeluaran

- 🍜 **makan** - makan berat, warteg, kantin
- 🍪 **jajan** - snack, gorengan, cemilan
- ☕ **kopi** - kopi, minuman
- 🏠 **bayar_kos** - bayar kos bulanan
- 💡 **listrik** - token listrik
- 📶 **wifi** - internet, pulsa
- 🚌 **transport** - ojol, bus, bensin
- 🅿️ **parkir** - biaya parkir
- 📚 **buku** - buku, alat tulis
- 🖨️ **print** - fotocopy, print
- 🎮 **hiburan** - nonton, game, streaming
- 🛒 **belanja** - kebutuhan sehari-hari
- 💊 **kesehatan** - obat, dokter
- 👕 **pakaian** - baju, sepatu
- 🧺 **laundry** - cuci baju

## 🛠️ Teknologi

- **Node.js** - Runtime JavaScript
- **whatsapp-web.js** - Library WhatsApp
- **SQLite3** - Database lokal
- **Moment.js** - Pengaturan tanggal
- **ExcelJS** - Export laporan (upcoming)

## 📁 Struktur Project

```
bot-kos-anak/
├── src/
│   ├── index.js              # Entry point bot
│   ├── handler.js            # Message handler & routing
│   ├── database.js           # Database functions
│   └── commands/
│       ├── pemasukan.js      # Handler pemasukan
│       ├── pengeluaran.js    # Handler pengeluaran
│       ├── laporan.js        # Handler laporan & saldo
│       └── menu.js           # Handler menu & help
├── data/                     # Folder database (auto-created)
├── wa-session/               # WhatsApp session (auto-created)
├── .env                      # Konfigurasi
├── .gitignore
├── package.json
└── README.md
```

## ⚠️ Troubleshooting

### Bot tidak bisa connect
- Pastikan koneksi internet stabil
- Coba hapus folder `wa-session` dan scan ulang QR code

### QR Code tidak muncul
- Pastikan terminal/console bisa tampilkan karakter unicode
- Coba jalankan ulang bot

### Error "sqlite3 not found"
```bash
npm install sqlite3 --build-from-source
```

### Bot tidak balas pesan
- Cek apakah pesan dimulai dengan `!` (tanda seru)
- Cek log di terminal, ada error atau tidak
- Pastikan bot tidak di-block di WhatsApp

## 🔐 Keamanan & Privasi

- Semua data disimpan **lokal** di komputer kamu (folder `data/`)
- Tidak ada data yang dikirim ke server eksternal
- Session WhatsApp tersimpan di folder `wa-session/`
- **Jangan share folder ini ke orang lain!**

## 🚀 Fitur yang Bisa Ditambahkan Nanti

- [ ] Export laporan ke Excel
- [ ] Grafik pengeluaran visual
- [ ] Reminder bayar kos otomatis
- [ ] Budget limit per kategori
- [ ] Split bill dengan teman
- [ ] OCR scan struk otomatis
- [ ] Multi-user (untuk grup kos)

## 📄 Lisensi

Bebas dipakai dan dimodifikasi untuk kebutuhan pribadi!

---

Made with ❤️ for anak kos yang mau hemat

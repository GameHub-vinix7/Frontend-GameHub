# GameHub — Harga Regional Indonesia (Development)

Frontend React/Vite dan backend Cloudflare Worker + D1. Branch ini **belum di-merge atau di-deploy**.

## Sumber dan validasi harga

- Mata uang wajib **IDR**, negara **ID**. Tidak ada konversi USD→IDR.
- Adapter harga aktif: `src/regionalPricing.mjs`. Ia membaca `Steam Store appdetails` menggunakan `cc=id`, lalu **menolak** respons tanpa currency IDR. API storefront Steam ini tidak terdokumentasi atau dijamin secara resmi, sehingga wajib diuji sebelum publikasi.
- `initial` / `final` pada `price_overview` dibagi 100 untuk mengubah satuan sen menjadi rupiah; diskon dihitung dari keduanya.
- **Epic dan GOG belum memiliki sumber IDR terverifikasi dalam proyek ini.** Harga keduanya ditampilkan "Harga belum tersedia", bukan menyalin Steam atau mengonversi USD. Jangan mengklaim kelengkapan ketiga toko.
- Data gambar, genre, dan rating tetap bersumber dari katalog showcase lokal.
- Data histori berasal dari observasi setelah worker dijalankan; masa lalu tidak direkayasa. Tabel lama `price_history` (USD eksperimen) tetap dipertahankan, tetapi tidak digunakan. Tabel baru `regional_price_history` hanya menerima IDR / ID.

## Cara cek perubahan

Dari root:

```cmd
git pull --ff-only origin feat/live-pricing-cloudflare
npm test
npm run lint
npm run build
```

`backend/wrangler.toml` di GitHub tetap berisi ID database *placeholder*. Pengguna yang sudah membuat D1 **mempertahankan `wrangler.toml` lokal mereka** dengan ID database asli dan binding `DB`. File tersebut tidak boleh tertimpa.

Untuk tes lokal dari `backend`:

```cmd
npx wrangler d1 migrations apply gamehub-price-history --local
npx wrangler dev --local
```

Lihat:
- `http://127.0.0.1:8787/api/health` → `currency: IDR`, `country: ID`
- `http://127.0.0.1:8787/api/catalog` → penawaran Steam IDR yang berhasil diverifikasi. Harga dapat tidak tersedia jika Store API mengembalikan data kosong, dibatasi, atau mata uang selain IDR.
- `http://127.0.0.1:8787/api/history?gameId=red-dead-redemption-2&store=steam` → data histori dari D1 lokal (awal kosong).

**Jangan jalankan migrasi remote atau deploy sebelum pengguna menyetujui tahap tersebut.** Setelah disetujui, migrasi `0002_regional_history.sql` dapat diterapkan ke D1 remote tanpa menghapus tabel eksperimen lama.

Jika frontend sedang berjalan lokal, gunakan `.env.local` pada root berisi:

```env
VITE_PRICE_API_URL=http://127.0.0.1:8787
```

Restart Vite setelah mengubah env. Semua informasi harga dalam UI mengikuti nilai `currency: IDR`.

## QA & keamanan

Perubahan dilakukan hanya dalam branch `feat/live-pricing-cloudflare`. UI navigation, favorites localStorage, gallery, route 404, dan URL query state tetap dipertahankan. Validasi `npm test`, `npm run lint`, `npm run build`, kemudian smoke test harga regional dan kembali dari detail game sebelum merge/deploy.

Cron `0 */6 * * *` menangkap snapshot setiap 6 jam **hanya setelah Worker diterapkan**. Worker lokal tidak menjalankan Cron secara otomatis.

Tentu, ini adalah draf file `README.md` yang lengkap dan profesional untuk proyek **MONALISA** Anda. File ini mencakup deskripsi proyek, teknologi yang digunakan, fitur berdasarkan role, struktur database, dan cara instalasi.

Silakan buat file bernama `README.md` di root folder proyek Anda dan salin isi berikut:

```markdown
# MONALISA - Sistem Informasi Manajemen Bapas

**MONALISA** adalah aplikasi berbasis web yang dirancang untuk mendigitalisasi dan mempermudah proses administrasi serta manajemen tugas di Balai Pemasyarakatan (Bapas). Aplikasi ini menangani alur kerja mulai dari registrasi klien pemasyarakatan, permintaan Penelitian Kemasyarakatan (Litmas), penunjukan Pembimbing Kemasyarakatan (PK), hingga supervisi berjenjang oleh Kepala Seksi (Kasie) dan Kepala Subseksi (Kasubsie).

## 🚀 Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan *stack* teknologi modern untuk memastikan performa, keamanan, dan kemudahan pengembangan:

* **Frontend Framework**: [React](https://react.dev/) (via [Vite](https://vitejs.dev/))
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
* **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL)
* **Authentication**: Supabase Auth (JWT)
* **Serverless**: Supabase Edge Functions (untuk manajemen user admin)
* **Charts**: Recharts
* **Icons**: Lucide React

## ✨ Fitur Utama & Hak Akses

Sistem ini menggunakan **Role-Based Access Control (RBAC)** yang ketat. Fitur yang tersedia menyesuaikan dengan role pengguna yang login:

### 1. Administrator (`admin`)
* **Manajemen User**: Membuat akun pengguna baru untuk pegawai yang terdaftar.
* **Role Assignment**: Mengatur hak akses (role) pegawai (misal: PK, Operator, Kasie).
* **Dashboard Monitoring**: Melihat statistik keseluruhan sistem.
* *Security*: Pembuatan user dilakukan via **Edge Function** untuk keamanan level server dan mencegah auto-login sesi admin.

### 2. Operator Registrasi (`staff_registrasi_anak` / `staff_registrasi_dewasa`)
* **Input Data Klien**: Mencatat data diri, perkara, dan penjamin klien baru.
* **Registrasi Litmas**: Mencatat surat permintaan Litmas masuk dari UPT (Lapas/Rutan).
* **Pemisahan Data**:
    * Operator Anak hanya melihat dan menginput data kategori "Anak".
    * Operator Dewasa hanya melihat dan menginput data kategori "Dewasa".

### 3. Pembimbing Kemasyarakatan / PK (`pk`)
* **Dashboard Personal**: Melihat daftar tugas Litmas yang ditugaskan spesifik kepada dirinya.
* **Detail Tugas**: Melihat detail klien dan tenggat waktu pengerjaan.

### 4. Kepala Seksi / Kasie (`kasi_bk_anak` / `kasi_bk_dewasa`)
* **Supervisi Wilayah**: Melihat **seluruh** berkas Litmas yang sedang berjalan di seksinya (Anak atau Dewasa), tanpa dibatasi oleh siapa PK yang mengerjakan.
* **Monitoring Kinerja**: Memantau beban kerja PK di bawah naungannya.

### 5. Kepala Subseksi / Kasubsie (`kasubsie`)
* **Supervisi Tingkat Lanjut**: Monitoring detail operasional bimbingan klien.

---

## 🗄️ Struktur Database (Ringkasan)

Aplikasi ini menggunakan skema relasional PostgreSQL di Supabase:

* **`users`**: Tabel *public* yang terhubung dengan `auth.users` (berisi referensi `employee_id`).
* **`employees`**: Data induk pegawai (NIP, Nama, Jabatan).
* **`roles` & `user_roles`**: Manajemen role dinamis.
* **`litmas`**: Tabel transaksional utama permintaan Litmas.
    * *Columns*: `id_litmas`, `id_klien`, `id_upt`, `nama_pk`, `nomor_surat_permintaan`, `status`, dll.
* **`klien`**: Data profil Warga Binaan Pemasyarakatan (WBP).
    * *Columns*: `nama_klien`, `kategori_usia` (Anak/Dewasa), `perkara`, `asal_upt`.
* **`perkara`**: Detail kasus hukum klien (Pasal, Vonis, Tanggal Ekspirasi).
* **`penjamin`**: Data keluarga/penjamin klien.

---

## 🛠️ Cara Instalasi & Menjalankan (Local Development)

Ikuti langkah-langkah ini untuk menjalankan proyek di komputer lokal Anda:

### 1. Clone Repository
```bash
git clone [https://github.com/username/machioneel.git](https://github.com/machioneel/monalisa.git)
cd monalisa

```

### 2. Install Dependencies

Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/).

```bash
npm install
# atau
yarn install

```

### 3. Konfigurasi Environment Variables

Buat file `.env` di root folder dan isi dengan kredensial Supabase Anda:

```env
VITE_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
VITE_SUPABASE_ANON_KEY=your-anon-key-here

```

### 4. Jalankan Aplikasi

```bash
npm run dev

```

Aplikasi akan berjalan di `http://localhost:5173`.

---

## ☁️ Supabase Edge Functions

Proyek ini menggunakan Edge Function khusus untuk fitur Admin (agar Admin bisa membuat user lain tanpa logout).

**Lokasi Function:** `supabase/functions/admin-create-user`

**Cara Deploy Function:**

```bash
supabase functions deploy admin-create-user

```

*Catatan: Pastikan opsi "Enforce JWT Verification" dimatikan di dashboard Supabase untuk function ini, karena verifikasi token dilakukan secara manual di dalam kode (untuk menangani preflight CORS).*

---

## 🛡️ Keamanan

* **Row Level Security (RLS)**: Diaktifkan pada seluruh tabel. Data hanya bisa diakses sesuai kebijakan role (misal: PK hanya bisa baca data miliknya, Admin bisa baca semua).
* **Protected Routes**: Routing di React dilindungi oleh `AuthContext` yang mengecek status login dan role sebelum merender halaman.

---

**Dikembangkan untuk kebutuhan internal Bapas.**

```

```
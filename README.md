Bertindak sebagai Full-Stack Senior Software Engineer. Sila hasilkan sistem tempahan bilik mesyuarat yang lengkap (End-to-End) menggunakan stack berikut:
- Frontend: React.js (dengan Lucide Icons, Tailwind CSS/CSS, dan pustaka Kalendar seperti FullCalendar atau kustom UI)
- Backend: Node.js dengan Express.js
- Database: MySQL

Sila sediakan KOD PENUH (Full Code), struktur projek, dan skrip SQL tanpa mengurangkan bahagian penting.

---

### 1. STRUKTUR PANGKALAN DATA (MySQL)
Tulis skrip SQL lengkap untuk membuat database dan jadual:
- `users`: (id, name, email, role ['staff', 'admin'])
- `rooms`: (id, room_name, capacity, location, status ['active', 'maintenance'])
- `bookings`: (id, room_id, user_id, title, description, start_time, end_time, status ['pending', 'approved', 'rejected', 'cancelled'], created_at)

Sediakan juga `INSERT` data sampel:
- 3 Bilik Mesyuarat sampel (cth: Bilik Perdana, Bilik Inovasi, Bilik Lembaga).
- 2 Pengguna sampel (1 Admin, 1 Staff).
- 2 Tempahan sampel (1 Approved, 1 Pending).

---

### 2. BACKEND API (Node.js + Express + MySQL / mysql2 driver)
Sediakan fail server penuh (cth: `server.js`) yang merangkumi:
1. Sambungan pangkalan data MySQL (Database Connection Pool).
2. LOGIK PENTING (Kunci Elak Pertindihan / Anti-Overlapping logic):
   - Sebelum permohonan baru disimpan atau diluluskan, sistem Wajib menyemak sama ada waktu yang dipohon (`start_time` hingga `end_time`) BERTINDAN dengan mana-mana tempahan sedia ada bagi bilik yang sama yang berstatus 'approved' atau 'pending'.
   - Formula SQL semakan pertindihan:
     `WHERE room_id = ? AND status IN ('approved', 'pending') AND (start_time < ? AND end_time > ?)`
3. API Endpoints:
   - `GET /api/rooms` - Senarai semua bilik.
   - `GET /api/bookings` - Senarai tempahan (boleh difilter mengikut bilik/tarikh untuk paparan kalendar).
   - `POST /api/bookings` - Permohonan tempahan baru (termasuk валидаси validation & semakan pertindihan).
   - `PATCH /api/bookings/:id/status` - Kelulusan Admin (Approve / Reject / Cancel).

---

### 3. FRONTEND (React.js)
Sediakan komponen-komponen React lengkap (bersama State Management) yang mengandungi FLOW LENGKAP:

1. **Borang Permohonan Tempahan (Booking Form)**:
   - Pilihan Bilik Mesyuarat (Dropdown dari API).
   - Tajuk Mesyuarat & Tujuan.
   - Tarikh, Masa Mula (Start Time), Masa Tamat (End Time).
   - Validation di Frontend: Masa Tamat MESTI selepas Masa Mula.
   - Mengendalikan maklum balas daripada Backend (Cth: Mesej ralat "Ralat: Waktu ini telah ditempah oleh pengguna lain!").

2. **Dashboard / Modul Kelulusan Admin (Admin Approval)**:
   - Senarai permohonan berstatus 'pending'.
   - Butang **Luluskan (Approve)** dan **Tolak (Reject)**.

3. **Kalendar Penggunaan Bilik (Meeting Room Calendar)**:
   - Paparan Kalendar / Jadual Penggunaan (Guna FullCalendar React atau Paparan Jadual Boleh Dilihat mengikut Hari/Minggu).
   - Menunjukkan slot masa bilik yang telah disahkan (Approved) dan Pending.
   - Penunjuk warna berbeza mengikut status tempahan (cth: Hijau = Approved, Kuning = Pending).

---

### REQUIREMENT TAMBAHAN:
- Berikan arahan langkah demi langkah cara menjalankan projek (Panduan Setup DB, Backend `.env` & npm packages, serta React Frontend).
- Sila tulis kod dengan kemas, jelas, dan mengandungi komen penerangan dalam Bahasa Melayu.

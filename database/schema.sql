-- =====================================================================
-- SISTEM TEMPAHAN BILIK MESYUARAT (MEETING ROOM BOOKING SYSTEM)
-- Skrip Penciptaan Pangkalan Data & Jadual MySQL Lengkap
-- =====================================================================

-- 1. Cipta Pangkalan Data (Database)
CREATE DATABASE IF NOT EXISTS `bilik_mesyuarat_db`
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `bilik_mesyuarat_db`;

-- ---------------------------------------------------------------------
-- 2. Hapus jadual sedia ada jika wujud (mengikut urutan kekunci asing)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `rooms`;
DROP TABLE IF EXISTS `users`;

-- ---------------------------------------------------------------------
-- 3. Jadual Pengguna (users)
-- Menyimpan maklumat staf dan pentadbir sistem
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Nama penuh pengguna',
  `email` VARCHAR(150) NOT NULL UNIQUE COMMENT 'Emel korporat unik',
  `role` ENUM('staff', 'admin') NOT NULL DEFAULT 'staff' COMMENT 'Peranan sistem',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Jadual Bilik Mesyuarat (rooms)
-- Menyimpan senarai bilik, kapasiti, lokasi dan status
-- ---------------------------------------------------------------------
CREATE TABLE `rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_name` VARCHAR(100) NOT NULL COMMENT 'Nama bilik mesyuarat',
  `capacity` INT NOT NULL COMMENT 'Kapasiti maksimum bilangan peserta',
  `location` VARCHAR(150) NOT NULL COMMENT 'Lokasi aras atau blok bangunan',
  `status` ENUM('active', 'maintenance') NOT NULL DEFAULT 'active' COMMENT 'Status kesediaan bilik',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Jadual Tempahan (bookings)
-- Menyimpan permohonan tempahan bilik bersama masa mula dan tamat
-- ---------------------------------------------------------------------
CREATE TABLE `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_id` INT NOT NULL COMMENT 'Kunci asing merujuk ke jadual rooms',
  `user_id` INT NOT NULL COMMENT 'Kunci asing merujuk ke jadual users',
  `title` VARCHAR(200) NOT NULL COMMENT 'Tajuk / Nama mesyuarat',
  `description` TEXT NULL COMMENT 'Tujuan / Agenda mesyuarat',
  `start_time` DATETIME NOT NULL COMMENT 'Tarikh dan masa mula',
  `end_time` DATETIME NOT NULL COMMENT 'Tarikh dan masa tamat',
  `status` ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT 'Status kelulusan tempahan',
  `rejection_reason` VARCHAR(255) NULL COMMENT 'Catatan penolakan jika ditolak oleh admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Hubungan Kekunci Asing (Foreign Keys)
  CONSTRAINT `fk_bookings_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,

  -- Indeks untuk mengoptimumkan carian masa dan bilik
  INDEX `idx_room_schedule` (`room_id`, `start_time`, `end_time`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 6. DATA SAMPEL (SEED DATA)
-- =====================================================================

-- Masukkan 2 Pengguna Sampel (1 Admin, 1 Staff)
INSERT INTO `users` (`id`, `name`, `email`, `role`) VALUES
(1, 'Ahmad Faizal (Pegawai Pentadbir)', 'admin@syarikat.com.my', 'admin'),
(2, 'Siti Nurhaliza (Eksekutif Pemasaran)', 'siti.staff@syarikat.com.my', 'staff'),
(3, 'Muhammad Haziq (Pembangun Perisian)', 'haziq.dev@syarikat.com.my', 'staff');

-- Masukkan 3 Bilik Mesyuarat Sampel
INSERT INTO `rooms` (`id`, `room_name`, `capacity`, `location`, `status`) VALUES
(1, 'Bilik Perdana', 25, 'Aras 3, Sayap Utama', 'active'),
(2, 'Bilik Inovasi', 12, 'Aras 2, Hab Digital', 'active'),
(3, 'Bilik Lembaga', 18, 'Aras 4, Zon Eksekutif', 'active'),
(4, 'Bilik Diskusi Ceria', 6, 'Aras 1, Ruang Kolaborasi', 'maintenance');

-- Masukkan Tempahan Sampel (Waktu dinamik berdekatan hari ini)
-- Formula masa bertindan mengelak pertindihan mengikut kehendak soalan
INSERT INTO `bookings` (`id`, `room_id`, `user_id`, `title`, `description`, `start_time`, `end_time`, `status`) VALUES
(
  1, 
  1, 
  2, 
  'Mesyuarat Perancangan Suku Tahunan Q4', 
  'Pembentangan KPI dan pelan tindakan pemasaran tahun hadapan bersama ketua jabatan.',
  DATE_ADD(CURDATE(), INTERVAL '09:00:00' HOUR_SECOND), 
  DATE_ADD(CURDATE(), INTERVAL '11:00:00' HOUR_SECOND), 
  'approved'
),
(
  2, 
  2, 
  3, 
  'Sprint Review & Demo Sistem Barangan', 
  'Semakan kemajuan sprint dwimingguan pasukan kejuruteraan perisian dan reka bentuk UI.',
  DATE_ADD(CURDATE(), INTERVAL '14:00:00' HOUR_SECOND), 
  DATE_ADD(CURDATE(), INTERVAL '16:00:00' HOUR_SECOND), 
  'pending'
),
(
  3, 
  1, 
  3, 
  'Sesi Latihan Keselamatan Siber Syarikat', 
  'Taklimat pematuhan standard ISO 27001 dan amalan keselamatan emel kakitangan.',
  DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL '10:00:00' HOUR_SECOND), 
  DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL '12:30:00' HOUR_SECOND), 
  'approved'
);

-- =====================================================================
-- 7. CONTOH QUERY SEMAKAN PERTINDIHAN MASA (ANTI-OVERLAPPING CHECK)
-- =====================================================================
-- Formula: Dua julat masa (A1 hingga A2) dan (B1 hingga B2) bertindih jika:
-- (A1 < B2) DAN (A2 > B1)
--
-- SQL:
-- SELECT * FROM bookings 
-- WHERE room_id = ? 
--   AND status IN ('approved', 'pending') 
--   AND (start_time < ? AND end_time > ?);
-- =====================================================================

import React, { useState } from 'react';
import { 
  Database, 
  Terminal, 
  Copy, 
  Check, 
  Server, 
  Code, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { DatabaseStatus } from '../types';

interface SqlDatabaseGuideProps {
  dbStatus: DatabaseStatus | null;
}

export const SqlDatabaseGuide: React.FC<SqlDatabaseGuideProps> = ({ dbStatus }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const sqlScript = `-- =====================================================================
-- SISTEM TEMPAHAN BILIK MESYUARAT (MEETING ROOM BOOKING SYSTEM)
-- Skrip Penciptaan Pangkalan Data & Jadual MySQL Lengkap
-- =====================================================================

CREATE DATABASE IF NOT EXISTS \`bilik_mesyuarat_db\`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE \`bilik_mesyuarat_db\`;

-- 1. Jadual Pengguna (users)
DROP TABLE IF EXISTS \`bookings\`;
DROP TABLE IF EXISTS \`rooms\`;
DROP TABLE IF EXISTS \`users\`;

CREATE TABLE \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL UNIQUE,
  \`role\` ENUM('staff', 'admin') NOT NULL DEFAULT 'staff',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Jadual Bilik Mesyuarat (rooms)
CREATE TABLE \`rooms\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`room_name\` VARCHAR(100) NOT NULL,
  \`capacity\` INT NOT NULL,
  \`location\` VARCHAR(150) NOT NULL,
  \`status\` ENUM('active', 'maintenance') NOT NULL DEFAULT 'active',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Jadual Tempahan (bookings)
CREATE TABLE \`bookings\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`room_id\` INT NOT NULL,
  \`user_id\` INT NOT NULL,
  \`title\` VARCHAR(200) NOT NULL,
  \`description\` TEXT NULL,
  \`start_time\` DATETIME NOT NULL,
  \`end_time\` DATETIME NOT NULL,
  \`status\` ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  \`rejection_reason\` VARCHAR(255) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT \`fk_bookings_room\` FOREIGN KEY (\`room_id\`) REFERENCES \`rooms\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_bookings_user\` FOREIGN KEY (\`user_id\` ) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  INDEX \`idx_room_schedule\` (\`room_id\`, \`start_time\`, \`end_time\`, \`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Data Sampel: Pengguna (1 Admin, 2 Staff)
INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`role\`) VALUES
(1, 'Ahmad Faizal (Pegawai Pentadbir)', 'admin@syarikat.com.my', 'admin'),
(2, 'Siti Nurhaliza (Eksekutif Pemasaran)', 'siti.staff@syarikat.com.my', 'staff'),
(3, 'Muhammad Haziq (Pembangun Perisian)', 'haziq.dev@syarikat.com.my', 'staff');

-- 5. Data Sampel: 3 Bilik Mesyuarat
INSERT INTO \`rooms\` (\`id\`, \`room_name\`, \`capacity\`, \`location\`, \`status\`) VALUES
(1, 'Bilik Perdana', 25, 'Aras 3, Sayap Utama', 'active'),
(2, 'Bilik Inovasi', 12, 'Aras 2, Hab Digital', 'active'),
(3, 'Bilik Lembaga', 18, 'Aras 4, Zon Eksekutif', 'active'),
(4, 'Bilik Diskusi Ceria', 6, 'Aras 1, Ruang Kolaborasi', 'maintenance');

-- 6. Data Sampel: Tempahan Sampel (1 Approved, 1 Pending)
INSERT INTO \`bookings\` (\`id\`, \`room_id\`, \`user_id\`, \`title\`, \`description\`, \`start_time\`, \`end_time\`, \`status\`) VALUES
(1, 1, 2, 'Mesyuarat Perancangan Suku Tahunan Q4', 'Pembentangan KPI pemasaran', 
 DATE_ADD(CURDATE(), INTERVAL '09:00:00' HOUR_SECOND), 
 DATE_ADD(CURDATE(), INTERVAL '11:00:00' HOUR_SECOND), 'approved'),
(2, 2, 3, 'Sprint Review & Demo Sistem Barangan', 'Semakan kemajuan sprint dwimingguan', 
 DATE_ADD(CURDATE(), INTERVAL '14:00:00' HOUR_SECOND), 
 DATE_ADD(CURDATE(), INTERVAL '16:00:00' HOUR_SECOND), 'pending');

-- =====================================================================
-- 7. FORMULA SEMAKAN PERTINDIHAN MASA (ANTI-OVERLAPPING CHECK)
-- =====================================================================
SELECT * FROM bookings 
WHERE room_id = ? 
  AND status IN ('approved', 'pending') 
  AND (start_time < ? AND end_time > ?);`;

  const envContent = `# Konfigurasi MySQL
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD="kata_laluan_mysql_anda"
DB_NAME="bilik_mesyuarat_db"

# Port Pelayan Aplikasi
PORT=3000`;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-md">
            Dokumentasi Teknikal & Setup
          </span>
          <span className="text-xs text-slate-500">• MySQL + Express + React</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Panduan Setup Pangkalan Data & Menjalankan Projek
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Panduan komprehensif langkah demi langkah untuk menyediakan MySQL, fail konfigurasi, dan menjalankan aplikasi.
        </p>
      </div>

      {/* Status Sambungan Semasa */}
      <div className={`p-4 rounded-2xl border mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        dbStatus?.isConnectedToMySQL
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            dbStatus?.isConnectedToMySQL ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
          }`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">
              Status Enjin Pangkalan Data Semasa
            </div>
            <div className="font-extrabold text-sm flex items-center gap-2 mt-0.5">
              <span>{dbStatus?.isConnectedToMySQL ? 'MySQL Server Bersambung' : 'Mod Enjin Memori SQL Tempatan'}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${
                dbStatus?.isConnectedToMySQL ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`} />
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {dbStatus?.isConnectedToMySQL
                ? `Bersambung terus ke ${dbStatus.config.host}:${dbStatus.config.port} (Pangkalan Data: ${dbStatus.config.database})`
                : 'Aplikasi beroperasi secara autonomous menggunakan replika skema SQL sebenar. Sambungan ke MySQL sedia diaktifkan bila-bila masa.'}
            </p>
          </div>
        </div>

        <div className="text-right text-xs shrink-0">
          <span className="px-2.5 py-1 rounded-lg font-mono font-semibold bg-white/80 border border-slate-200 text-slate-800">
            Pool: mysql2/promise
          </span>
        </div>
      </div>

      {/* Langkah-langkah Setup */}
      <div className="space-y-6">
        {/* LANGKAH 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
              Langkah 1: Cipta Pangkalan Data & Jadual di MySQL
            </h3>
            <button
              onClick={() => copyToClipboard(sqlScript, 'sql')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
            >
              {copiedSection === 'sql' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Skrip SQL</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-600 mb-3">
            Buka terminal MySQL, phpMyAdmin, atau DBeaver dan jalankan skrip SQL di bawah:
          </p>

          <div className="relative">
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
              {sqlScript}
            </pre>
          </div>
        </div>

        {/* LANGKAH 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
              Langkah 2: Konfigurasi Pemboleh Ubah Persekitaran (.env)
            </h3>
            <button
              onClick={() => copyToClipboard(envContent, 'env')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
            >
              {copiedSection === 'env' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin .env</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-600 mb-3">
            Cipta fail bernama <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 font-mono">.env</code> di punca projek dan masukkan parameter pangkalan data:
          </p>

          <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
            {envContent}
          </pre>
        </div>

        {/* LANGKAH 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
            Langkah 3: Jalankan Pakej & Pelayan Aplikasi
          </h3>

          <p className="text-xs text-slate-600 mb-3">
            Jalankan arahan berikut di terminal untuk memasang kebergantungan dan memulakan pelayan:
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl border border-slate-800">
              <div className="text-slate-500 mb-1"># Pasang semua kebergantungan (Dependencies)</div>
              <div className="text-white font-bold">npm install</div>
            </div>

            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl border border-slate-800">
              <div className="text-slate-500 mb-1"># Mulakan pelayan pembangunan (Express + Vite)</div>
              <div className="text-emerald-400 font-bold">npm run dev</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-sans">
              Aplikasi kini boleh dilayari di pelayar web melalui: <a href="http://localhost:3000" className="text-blue-600 font-bold underline">http://localhost:3000</a>
            </div>
          </div>
        </div>

        {/* PENJELASAN LOGIK ANTI-OVERLAPPING */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-base text-indigo-950">
              Penjelasan Logik Pertindihan (Anti-Overlapping Algorithm)
            </h3>
          </div>
          <p className="text-xs text-indigo-900 leading-relaxed mb-3">
            Bagi memastikan tiada bilik ditempah dua kali pada masa yang sama, sistem menggunakan formula semakan selang masa matematik:
          </p>

          <div className="bg-white p-3.5 rounded-xl border border-indigo-200 font-mono text-xs text-indigo-900">
            WHERE room_id = ?<br />
            &nbsp;&nbsp;AND status IN ('approved', 'pending')<br />
            &nbsp;&nbsp;AND (start_time &lt; ? AND end_time &gt; ?)
          </div>

          <div className="mt-3 text-xs text-indigo-900 space-y-1">
            <div>• Parameter 1: <code>room_id</code> bilik yang dipohon</div>
            <div>• Parameter 2: <code>Masa Tamat Baru</code> (Permohonan baru)</div>
            <div>• Parameter 3: <code>Masa Mula Baru</code> (Permohonan baru)</div>
            <div className="pt-1 text-indigo-700 italic">
              *Nota: Formula ini turut membenarkan mesyuarat diadakan secara berturutan (Back-to-back, cth: 09:00-10:00 dan 10:00-11:00) tanpa ralat palsu!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { Booking, Room, User, BookingStatus } from './types.js';

dotenv.config();

// Konfigurasi Sambungan MySQL dari Pemboleh Ubah Persekitaran (.env)
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bilik_mesyuarat_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let mysqlPool: mysql.Pool | null = null;
let isConnectedToMySQL = false;
let connectionErrorMsg: string | null = null;

// ============================================================================
// DATA AWAL (SEED DATA)
// Digunakan untuk inisialisasi MySQL atau Simpanan Memori
// ============================================================================
const getInitialUsers = (): User[] => [
  {
    id: 1,
    name: 'Ahmad Faizal (Pegawai Pentadbir)',
    email: 'admin@syarikat.com.my',
    role: 'admin',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Siti Nurhaliza (Eksekutif Pemasaran)',
    email: 'siti.staff@syarikat.com.my',
    role: 'staff',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Muhammad Haziq (Pembangun Perisian)',
    email: 'haziq.dev@syarikat.com.my',
    role: 'staff',
    created_at: new Date().toISOString(),
  },
];

const getInitialRooms = (): Room[] => [
  {
    id: 1,
    room_name: 'Bilik Perdana',
    capacity: 25,
    location: 'Aras 3, Sayap Utama',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    room_name: 'Bilik Inovasi',
    capacity: 12,
    location: 'Aras 2, Hab Digital',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    room_name: 'Bilik Lembaga',
    capacity: 18,
    location: 'Aras 4, Zon Eksekutif',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    room_name: 'Bilik Diskusi Ceria',
    capacity: 6,
    location: 'Aras 1, Ruang Kolaborasi',
    status: 'maintenance',
    created_at: new Date().toISOString(),
  },
];

const getInitialBookings = (): Booking[] => {
  const today = new Date();
  const formatTime = (date: Date, hours: number, minutes: number) => {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    // Kembalikan format YYYY-MM-DD HH:mm:ss
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  };

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return [
    {
      id: 1,
      room_id: 1,
      user_id: 2,
      title: 'Mesyuarat Perancangan Suku Tahunan Q4',
      description: 'Pembentangan KPI dan pelan tindakan pemasaran tahun hadapan bersama ketua jabatan.',
      start_time: formatTime(today, 9, 0),
      end_time: formatTime(today, 11, 0),
      status: 'approved',
      rejection_reason: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      room_id: 2,
      user_id: 3,
      title: 'Sprint Review & Demo Sistem Barangan',
      description: 'Semakan kemajuan sprint dwimingguan pasukan kejuruteraan perisian dan reka bentuk UI.',
      start_time: formatTime(today, 14, 0),
      end_time: formatTime(today, 16, 0),
      status: 'pending',
      rejection_reason: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      room_id: 1,
      user_id: 3,
      title: 'Sesi Latihan Keselamatan Siber Syarikat',
      description: 'Taklimat pematuhan standard ISO 27001 dan amalan keselamatan emel kakitangan.',
      start_time: formatTime(tomorrow, 10, 0),
      end_time: formatTime(tomorrow, 12, 30),
      status: 'approved',
      rejection_reason: null,
      created_at: new Date().toISOString(),
    },
  ];
};

// Penyimpan memori tempatan (Fallback autonomous jika tiada daemon MySQL luar)
let memoryUsers: User[] = getInitialUsers();
let memoryRooms: Room[] = getInitialRooms();
let memoryBookings: Booking[] = getInitialBookings();

// ============================================================================
// INISIALISASI PANGKALAN DATA (MySQL CONNECTION POOL)
// ============================================================================
export async function initializeDatabase() {
  try {
    console.log(`[Database] Menyambung ke pangkalan data MySQL di ${dbConfig.host}:${dbConfig.port}...`);
    mysqlPool = mysql.createPool(dbConfig);

    // Uji sambungan MySQL
    const connection = await mysqlPool.getConnection();
    console.log('[Database] Berjaya bersambung ke pelayan MySQL!');
    connection.release();

    isConnectedToMySQL = true;
    connectionErrorMsg = null;

    // Sediakan jadual dan data sampel jika belum wujud
    await bootstrapMySQLSchema(mysqlPool);
  } catch (err: any) {
    isConnectedToMySQL = false;
    connectionErrorMsg = err?.message || 'Gagal menyambung ke pelayan MySQL tempatan';
    console.warn(`[Database Info] Sambungan terus ke MySQL (${dbConfig.host}:${dbConfig.port}) tidak aktif: ${connectionErrorMsg}`);
    console.info('[Database Info] Sistem mengaktifkan Mod Enjin SQL Tempatan (In-Memory Database) dengan skema jadual MySQL yang sama agar aplikasi berfungsi lancar 100%.');
  }
}

async function bootstrapMySQLSchema(pool: mysql.Pool) {
  try {
    // 1. Cipta jadual users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        role ENUM('staff', 'admin') NOT NULL DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Cipta jadual rooms
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_name VARCHAR(100) NOT NULL,
        capacity INT NOT NULL,
        location VARCHAR(150) NOT NULL,
        status ENUM('active', 'maintenance') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Cipta jadual bookings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
        rejection_reason VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_room_time (room_id, start_time, end_time, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Semak dan masukkan data sampel jika jadual kosong
    const [userRows]: any = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0]?.count === 0) {
      console.log('[Database] Memasukkan data sampel ke jadual users...');
      for (const u of getInitialUsers()) {
        await pool.query(
          'INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)',
          [u.id, u.name, u.email, u.role]
        );
      }
    }

    const [roomRows]: any = await pool.query('SELECT COUNT(*) as count FROM rooms');
    if (roomRows[0]?.count === 0) {
      console.log('[Database] Memasukkan data sampel ke jadual rooms...');
      for (const r of getInitialRooms()) {
        await pool.query(
          'INSERT INTO rooms (id, room_name, capacity, location, status) VALUES (?, ?, ?, ?, ?)',
          [r.id, r.room_name, r.capacity, r.location, r.status]
        );
      }
    }

    const [bookingRows]: any = await pool.query('SELECT COUNT(*) as count FROM bookings');
    if (bookingRows[0]?.count === 0) {
      console.log('[Database] Memasukkan data sampel ke jadual bookings...');
      for (const b of getInitialBookings()) {
        await pool.query(
          'INSERT INTO bookings (id, room_id, user_id, title, description, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [b.id, b.room_id, b.user_id, b.title, b.description, b.start_time, b.end_time, b.status]
        );
      }
    }
  } catch (err) {
    console.error('[Database Bootstrap Error]', err);
  }
}

// ============================================================================
// PERKHIDMATAN PANGKALAN DATA (DATABASE SERVICE API)
// Mengendalikan MySQL atau In-Memory Engine dengan logika yang sama
// ============================================================================

export const dbService = {
  // Status sambungan
  getStatus() {
    return {
      mode: isConnectedToMySQL ? 'mysql' : 'in_memory_simulation',
      isConnectedToMySQL,
      error: connectionErrorMsg,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
      },
    };
  },

  // Reset ke data sampel awal
  async resetData() {
    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.query('DELETE FROM bookings');
      await mysqlPool.query('DELETE FROM rooms');
      await mysqlPool.query('DELETE FROM users');
      await bootstrapMySQLSchema(mysqlPool);
    } else {
      memoryUsers = getInitialUsers();
      memoryRooms = getInitialRooms();
      memoryBookings = getInitialBookings();
    }
    return true;
  },

  // Senarai Pengguna
  async getUsers(): Promise<User[]> {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT * FROM users ORDER BY id ASC');
      return rows as User[];
    }
    return [...memoryUsers];
  },

  // Senarai Bilik
  async getRooms(): Promise<Room[]> {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT * FROM rooms ORDER BY id ASC');
      return rows as Room[];
    }
    return [...memoryRooms];
  },

  async getRoomById(id: number): Promise<Room | null> {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT * FROM rooms WHERE id = ?', [id]);
      return rows[0] || null;
    }
    return memoryRooms.find((r) => r.id === id) || null;
  },

  // Senarai Tempahan (dengan JOIN ke users dan rooms)
  async getBookings(filters?: { roomId?: number; date?: string; status?: string }): Promise<Booking[]> {
    if (isConnectedToMySQL && mysqlPool) {
      let query = `
        SELECT 
          b.*,
          r.room_name,
          r.location as room_location,
          r.capacity as room_capacity,
          u.name as user_name,
          u.email as user_email,
          u.role as user_role
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        JOIN users u ON b.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filters?.roomId) {
        query += ' AND b.room_id = ?';
        params.push(filters.roomId);
      }

      if (filters?.status) {
        query += ' AND b.status = ?';
        params.push(filters.status);
      }

      if (filters?.date) {
        query += ' AND DATE(b.start_time) = ?';
        params.push(filters.date);
      }

      query += ' ORDER BY b.start_time ASC';
      const [rows] = await mysqlPool.query(query, params);
      return rows as Booking[];
    }

    // Fallback In-Memory JOIN
    let result = memoryBookings.map((b) => {
      const room = memoryRooms.find((r) => r.id === b.room_id);
      const user = memoryUsers.find((u) => u.id === b.user_id);
      return {
        ...b,
        room_name: room?.room_name || 'Bilik Tidak Dikenali',
        room_location: room?.location || '-',
        room_capacity: room?.capacity || 0,
        user_name: user?.name || 'Pengguna Tidak Dikenali',
        user_email: user?.email || '-',
        user_role: user?.role || 'staff',
      };
    });

    if (filters?.roomId) {
      result = result.filter((b) => b.room_id === filters.roomId);
    }
    if (filters?.status) {
      result = result.filter((b) => b.status === filters.status);
    }
    if (filters?.date) {
      result = result.filter((b) => {
        const bookingDate = b.start_time.split('T')[0].split(' ')[0];
        return bookingDate === filters.date;
      });
    }

    result.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    return result;
  },

  // --------------------------------------------------------------------------
  // LOGIK PENTING: SEMAKAN PERTINDIHAN MASA (ANTI-OVERLAPPING CHECK)
  // SQL Formula:
  // WHERE room_id = ? AND status IN ('approved', 'pending') AND (start_time < ? AND end_time > ?)
  // --------------------------------------------------------------------------
  async checkClashingBookings(
    roomId: number,
    startTime: string,
    endTime: string,
    excludeBookingId?: number
  ): Promise<Booking[]> {
    if (isConnectedToMySQL && mysqlPool) {
      let query = `
        SELECT b.*, r.room_name, u.name as user_name
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        JOIN users u ON b.user_id = u.id
        WHERE b.room_id = ? 
          AND b.status IN ('approved', 'pending')
          AND (b.start_time < ? AND b.end_time > ?)
      `;
      const params: any[] = [roomId, endTime, startTime];

      if (excludeBookingId) {
        query += ' AND b.id != ?';
        params.push(excludeBookingId);
      }

      const [rows] = await mysqlPool.query(query, params);
      return rows as Booking[];
    }

    // In-memory SQL equivalent formula
    const targetStart = new Date(startTime).getTime();
    const targetEnd = new Date(endTime).getTime();

    const conflicts = memoryBookings.filter((b) => {
      if (b.room_id !== roomId) return false;
      if (!['approved', 'pending'].includes(b.status)) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;

      const existingStart = new Date(b.start_time).getTime();
      const existingEnd = new Date(b.end_time).getTime();

      // Formula pertindihan: (existingStart < targetEnd) DAN (existingEnd > targetStart)
      return existingStart < targetEnd && existingEnd > targetStart;
    });

    return conflicts.map((b) => {
      const room = memoryRooms.find((r) => r.id === b.room_id);
      const user = memoryUsers.find((u) => u.id === b.user_id);
      return {
        ...b,
        room_name: room?.room_name || 'Bilik',
        user_name: user?.name || 'Pengguna',
      };
    });
  },

  // Cipta Permohonan Tempahan Baru
  async createBooking(data: {
    room_id: number;
    user_id: number;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
  }): Promise<Booking> {
    if (isConnectedToMySQL && mysqlPool) {
      const [res]: any = await mysqlPool.query(
        `INSERT INTO bookings (room_id, user_id, title, description, start_time, end_time, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [data.room_id, data.user_id, data.title, data.description || null, data.start_time, data.end_time]
      );
      const newId = res.insertId;
      const bookings = await this.getBookings();
      return bookings.find((b) => b.id === newId)!;
    }

    // In-memory insert
    const nextId = memoryBookings.length > 0 ? Math.max(...memoryBookings.map((b) => b.id)) + 1 : 1;
    const newBooking: Booking = {
      id: nextId,
      room_id: data.room_id,
      user_id: data.user_id,
      title: data.title,
      description: data.description || null,
      start_time: data.start_time,
      end_time: data.end_time,
      status: 'pending',
      rejection_reason: null,
      created_at: new Date().toISOString(),
    };

    memoryBookings.push(newBooking);

    const room = memoryRooms.find((r) => r.id === newBooking.room_id);
    const user = memoryUsers.find((u) => u.id === newBooking.user_id);
    return {
      ...newBooking,
      room_name: room?.room_name,
      room_location: room?.location,
      room_capacity: room?.capacity,
      user_name: user?.name,
      user_email: user?.email,
      user_role: user?.role,
    };
  },

  // Kemas Kini Status Tempahan (Approve / Reject / Cancel)
  async updateBookingStatus(
    id: number,
    status: BookingStatus,
    rejectionReason?: string
  ): Promise<Booking | null> {
    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.query(
        'UPDATE bookings SET status = ?, rejection_reason = ? WHERE id = ?',
        [status, rejectionReason || null, id]
      );
      const bookings = await this.getBookings();
      return bookings.find((b) => b.id === id) || null;
    }

    const booking = memoryBookings.find((b) => b.id === id);
    if (!booking) return null;

    booking.status = status;
    booking.rejection_reason = rejectionReason || null;

    const room = memoryRooms.find((r) => r.id === booking.room_id);
    const user = memoryUsers.find((u) => u.id === booking.user_id);
    return {
      ...booking,
      room_name: room?.room_name,
      room_location: room?.location,
      room_capacity: room?.capacity,
      user_name: user?.name,
      user_email: user?.email,
      user_role: user?.role,
    };
  },

  // Tambah Bilik Baharu
  async createRoom(data: { room_name: string; capacity: number; location: string; status: 'active' | 'maintenance' }): Promise<Room> {
    if (isConnectedToMySQL && mysqlPool) {
      const [res]: any = await mysqlPool.query(
        'INSERT INTO rooms (room_name, capacity, location, status) VALUES (?, ?, ?, ?)',
        [data.room_name, data.capacity, data.location, data.status]
      );
      return { id: res.insertId, ...data };
    }
    const nextId = memoryRooms.length > 0 ? Math.max(...memoryRooms.map((r) => r.id)) + 1 : 1;
    const room: Room = { id: nextId, ...data, created_at: new Date().toISOString() };
    memoryRooms.push(room);
    return room;
  }
};

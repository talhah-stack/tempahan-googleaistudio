import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, dbService, dbConfig } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Inisialisasi Pangkalan Data (MySQL atau fallback tempatan)
  await initializeDatabase();

  // Middleware JSON & URL-encoded
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ==========================================================================
  // API ENDPOINTS
  // ==========================================================================

  // 1. Status Pangkalan Data & Maklumat Sistem
  app.get('/api/db-status', (req, res) => {
    const status = dbService.getStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Senarai Pengguna (Users)
  app.get('/api/users', async (req, res) => {
    try {
      const users = await dbService.getUsers();
      res.json({ success: true, data: users });
    } catch (err: any) {
      console.error('Error fetching users:', err);
      res.status(500).json({ success: false, error: 'Gagal mendapatkan senarai pengguna.' });
    }
  });

  // 3. Senarai Bilik Mesyuarat (GET /api/rooms)
  app.get('/api/rooms', async (req, res) => {
    try {
      const rooms = await dbService.getRooms();
      res.json({ success: true, data: rooms });
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      res.status(500).json({ success: false, error: 'Gagal mendapatkan senarai bilik mesyuarat.' });
    }
  });

  // Tambah Bilik Baharu (Admin)
  app.post('/api/rooms', async (req, res) => {
    try {
      const { room_name, capacity, location, status } = req.body;
      if (!room_name || !capacity || !location) {
        return res.status(400).json({ success: false, error: 'Sila lengkapkan nama bilik, kapasiti, dan lokasi.' });
      }
      const newRoom = await dbService.createRoom({
        room_name: String(room_name).trim(),
        capacity: Number(capacity),
        location: String(location).trim(),
        status: status === 'maintenance' ? 'maintenance' : 'active',
      });
      res.status(201).json({ success: true, data: newRoom });
    } catch (err: any) {
      console.error('Error creating room:', err);
      res.status(500).json({ success: false, error: 'Gagal menambah bilik baharu.' });
    }
  });

  // 4. Senarai Tempahan (GET /api/bookings)
  // Menyokong penapisan mengikut room_id, date, dan status
  app.get('/api/bookings', async (req, res) => {
    try {
      const roomId = req.query.room_id ? Number(req.query.room_id) : undefined;
      const date = req.query.date ? String(req.query.date) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;

      const bookings = await dbService.getBookings({ roomId, date, status });
      res.json({ success: true, data: bookings });
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ success: false, error: 'Gagal mendapatkan senarai tempahan.' });
    }
  });

  // 5. Permohonan Tempahan Baharu (POST /api/bookings)
  // Termasuk validasi ketat & semakan pertindihan masa (Anti-overlapping)
  app.post('/api/bookings', async (req, res) => {
    try {
      const { room_id, user_id, title, description, start_time, end_time } = req.body;

      // a. Validasi ruangan mandatori
      if (!room_id || !user_id || !title || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          error: 'Sila lengkapkan semua maklumat mandatori (Bilik, Pengguna, Tajuk, Masa Mula, dan Masa Tamat).',
        });
      }

      // b. Validasi format masa & kronologi
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Format tarikh dan masa yang diberikan tidak sah.',
        });
      }

      // Syarat Utama: Masa Tamat MESTI selepas Masa Mula
      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          error: 'Masa Tamat MESTI selepas Masa Mula mesyuarat!',
        });
      }

      // Tempoh minima 15 minit
      const diffMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
      if (diffMinutes < 15) {
        return res.status(400).json({
          success: false,
          error: 'Tempoh tempahan mesyuarat mestilah sekurang-kurangnya 15 minit.',
        });
      }

      // c. Semak status bilik (Bilik aktif sahaja boleh ditempah)
      const room = await dbService.getRoomById(Number(room_id));
      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Bilik mesyuarat yang dipilih tidak ditemui dalam sistem.',
        });
      }

      if (room.status === 'maintenance') {
        return res.status(400).json({
          success: false,
          error: `Bilik "${room.room_name}" sedang dalam status penyelenggaraan dan tidak boleh ditempah pada masa ini.`,
        });
      }

      // ======================================================================
      // d. LOGIK PENTING: SEMAKAN PERTINDIHAN MASA (ANTI-OVERLAPPING CHECK)
      // SQL Formula:
      // WHERE room_id = ? AND status IN ('approved', 'pending') AND (start_time < ? AND end_time > ?)
      // ======================================================================
      const clashingBookings = await dbService.checkClashingBookings(
        Number(room_id),
        start_time,
        end_time
      );

      if (clashingBookings.length > 0) {
        const firstClash = clashingBookings[0];
        const statusLabel = firstClash.status === 'approved' ? 'Telah Diluluskan' : 'Sedang Menunggu Kelulusan';

        return res.status(409).json({
          success: false,
          code: 'SLOT_ALREADY_BOOKED',
          error: 'Ralat: Waktu ini telah ditempah oleh pengguna lain!',
          message: `Pertindihan masa dikesan dengan tempahan "${firstClash.title}" (${firstClash.start_time} hingga ${firstClash.end_time}) berstatus [${statusLabel}]. Sila pilih masa atau bilik lain.`,
          conflicts: clashingBookings,
        });
      }

      // e. Simpan tempahan baharu (Status lalai: 'pending')
      const newBooking = await dbService.createBooking({
        room_id: Number(room_id),
        user_id: Number(user_id),
        title: String(title).trim(),
        description: description ? String(description).trim() : '',
        start_time,
        end_time,
      });

      res.status(201).json({
        success: true,
        message: 'Permohonan tempahan berjaya dihantar dan kini menunggu kelulusan pentadbir.',
        data: newBooking,
      });
    } catch (err: any) {
      console.error('Error creating booking:', err);
      res.status(500).json({ success: false, error: 'Ralat dalaman pelayan semasa menyimpan tempahan.' });
    }
  });

  // 6. Kelulusan Admin (PATCH /api/bookings/:id/status)
  // Kemas kini status (approved, rejected, cancelled)
  app.patch('/api/bookings/:id/status', async (req, res) => {
    try {
      const bookingId = Number(req.params.id);
      const { status, rejection_reason } = req.body;

      if (!bookingId || isNaN(bookingId)) {
        return res.status(400).json({ success: false, error: 'ID tempahan tidak sah.' });
      }

      const validStatuses = ['approved', 'rejected', 'cancelled', 'pending'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Status '${status}' tidak sah. Nilai yang dibenarkan: ${validStatuses.join(', ')}`,
        });
      }

      // Jika pentadbir meluluskan (Approve), pastikan tiada tempahan 'approved' lain yang bertindih
      if (status === 'approved') {
        const allBookings = await dbService.getBookings();
        const currentBooking = allBookings.find((b) => b.id === bookingId);
        if (!currentBooking) {
          return res.status(404).json({ success: false, error: 'Tempahan tidak ditemui.' });
        }

        const approvedClashes = await dbService.checkClashingBookings(
          currentBooking.room_id,
          currentBooking.start_time,
          currentBooking.end_time,
          bookingId
        );

        // Semak jika ada yang sudah approved
        const alreadyApproved = approvedClashes.filter((b) => b.status === 'approved');
        if (alreadyApproved.length > 0) {
          return res.status(409).json({
            success: false,
            error: `Tidak dapat meluluskan! Terdapat tempahan "${alreadyApproved[0].title}" yang sudah diluluskan pada slot masa ini.`,
          });
        }
      }

      const updated = await dbService.updateBookingStatus(bookingId, status, rejection_reason);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Tempahan tidak dijumpai.' });
      }

      res.json({
        success: true,
        message: `Status tempahan #${bookingId} berjaya dikemas kini kepada '${status}'.`,
        data: updated,
      });
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      res.status(500).json({ success: false, error: 'Gagal mengemas kini status tempahan.' });
    }
  });

  // 7. Reset Data Sampel
  app.post('/api/reset-demo', async (req, res) => {
    try {
      await dbService.resetData();
      res.json({ success: true, message: 'Data sampel berjaya diset semula kepada keadaan asal.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Gagal menetapkan semula data.' });
    }
  });

  // ==========================================================================
  // VITE DEVELOPMENT MIDDLEWARE ATAU STATIC PRODUCTION SERVE
  // ==========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production dist serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Sistem Tempahan Bilik Mesyuarat beroperasi di port http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Fatal Error]', err);
  process.exit(1);
});

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  Calendar as CalendarIcon, 
  Building2, 
  Info,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Room, User, Booking } from '../types';

interface BookingFormProps {
  rooms: Room[];
  currentUser: User | null;
  onBookingCreated: () => void;
  onNavigateToCalendar: () => void;
  preselectedRoomId?: number;
  preselectedDate?: string;
  preselectedStartTime?: string;
  preselectedEndTime?: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  rooms,
  currentUser,
  onBookingCreated,
  onNavigateToCalendar,
  preselectedRoomId,
  preselectedDate,
  preselectedStartTime,
  preselectedEndTime,
}) => {
  // Form States
  const [roomId, setRoomId] = useState<number | ''>(preselectedRoomId || (rooms[0]?.id ?? ''));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Tarikh lalai hari ini (format YYYY-MM-DD)
  const getTodayDateString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [bookingDate, setBookingDate] = useState<string>(preselectedDate || getTodayDateString());
  const [startTime, setStartTime] = useState<string>(preselectedStartTime || '09:00');
  const [endTime, setEndTime] = useState<string>(preselectedEndTime || '10:30');

  // UI & Feedback States
  const [frontendError, setFrontendError] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<{
    error: string;
    message?: string;
    conflicts?: any[];
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update room when rooms loaded if empty
  useEffect(() => {
    if (!roomId && rooms.length > 0) {
      const activeRoom = rooms.find((r) => r.status === 'active') || rooms[0];
      setRoomId(activeRoom.id);
    }
  }, [rooms, roomId]);

  // Frontend Live Validation: Masa Tamat MESTI selepas Masa Mula
  useEffect(() => {
    setFrontendError(null);
    setBackendError(null);

    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      if (endTotal <= startTotal) {
        setFrontendError('Masa Tamat MESTI selepas Masa Mula mesyuarat!');
      } else if (endTotal - startTotal < 15) {
        setFrontendError('Tempoh mesyuarat mestilah sekurang-kurangnya 15 minit.');
      }
    }
  }, [startTime, endTime]);

  // Kiraan tempoh untuk paparan mesra pengguna
  const calculateDuration = () => {
    if (!startTime || !endTime) return null;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours === 0) return `${mins} minit`;
    if (mins === 0) return `${hours} jam`;
    return `${hours} jam ${mins} minit`;
  };

  const selectedRoom = rooms.find((r) => r.id === Number(roomId));

  // Handler Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFrontendError(null);
    setBackendError(null);
    setSuccessMessage(null);

    // 1. Validasi Asas di Frontend
    if (!roomId) {
      setFrontendError('Sila pilih bilik mesyuarat.');
      return;
    }
    if (!currentUser) {
      setFrontendError('Pengguna tidak aktif. Sila pilih pengguna di bahagian atas.');
      return;
    }
    if (!title.trim()) {
      setFrontendError('Sila masukkan tajuk mesyuarat.');
      return;
    }
    if (!bookingDate || !startTime || !endTime) {
      setFrontendError('Sila tetapkan tarikh, masa mula, dan masa tamat.');
      return;
    }

    // 2. Validasi Kronologi Masa
    const startDateTimeStr = `${bookingDate} ${startTime}:00`;
    const endDateTimeStr = `${bookingDate} ${endTime}:00`;

    const startDateTime = new Date(`${bookingDate}T${startTime}:00`);
    const endDateTime = new Date(`${bookingDate}T${endTime}:00`);

    if (endDateTime <= startDateTime) {
      setFrontendError('Masa Tamat MESTI selepas Masa Mula mesyuarat!');
      return;
    }

    if (selectedRoom?.status === 'maintenance') {
      setFrontendError('Bilik ini dalam status penyelenggaraan dan tidak boleh ditempah.');
      return;
    }

    // 3. Penghantaran ke Backend API (POST /api/bookings)
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: Number(roomId),
          user_id: currentUser.id,
          title: title.trim(),
          description: description.trim(),
          start_time: startDateTimeStr,
          end_time: endDateTimeStr,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Mengendalikan maklum balas ralat daripada backend (Pertindihan / Validasi)
        setBackendError({
          error: result.error || 'Ralat semasa membuat tempahan.',
          message: result.message,
          conflicts: result.conflicts,
        });
      } else {
        // Berjaya
        setSuccessMessage(`Permohonan tempahan "${title}" berjaya dihantar! Status semasa: Menunggu Kelulusan.`);
        setTitle('');
        setDescription('');
        onBookingCreated();
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setBackendError({
        error: 'Gagal menghubungi pelayan backend.',
        message: 'Pastikan pelayan sedang beroperasi dan cuba lagi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Butang slot masa pantas untuk kemudahan pengguna
  const applyQuickTime = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Tajuk & Pengenalan */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-md">
            Modul Staf & Pengguna
          </span>
          <span className="text-xs text-slate-500">• Semakan Pertindihan Automatik</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Borang Permohonan Tempahan Bilik
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Lengkapkan butiran mesyuarat di bawah. Sistem akan menyemak ketersediaan bilik secara langsung bagi mengelakkan pertindihan jadual.
        </p>
      </div>

      {/* Paparan Maklumat Pemohon Semasa */}
      {currentUser && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Pemohon Semasa:</div>
              <div className="text-sm font-bold text-slate-900">{currentUser.name}</div>
              <div className="text-xs text-slate-500">{currentUser.email}</div>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-200 text-slate-700">
            Peranan: {currentUser.role.toUpperCase()}
          </span>
        </div>
      )}

      {/* Banner Maklum Balas: Kejayaan */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-emerald-900">Permohonan Berjaya Dihantar!</h4>
            <p className="text-xs text-emerald-800 mt-1">{successMessage}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onNavigateToCalendar}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
              >
                Lihat Dalam Kalendar
              </button>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                Tutup Mesej
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Maklum Balas: Ralat Backend (Pertindihan / Clash) */}
      {backendError && (
        <div className="mb-6 p-4 sm:p-5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex flex-col sm:flex-row items-start gap-3.5 shadow-xs animate-shake">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-700 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded">
                Amaran Pertindihan
              </span>
              <h4 className="font-extrabold text-base text-rose-900">
                {backendError.error}
              </h4>
            </div>
            {backendError.message && (
              <p className="text-xs text-rose-800 mt-1.5 leading-relaxed font-medium">
                {backendError.message}
              </p>
            )}

            {/* Jika ada senarai permohonan bertindih dari API */}
            {backendError.conflicts && backendError.conflicts.length > 0 && (
              <div className="mt-3 bg-white/80 border border-rose-200 rounded-lg p-3">
                <span className="text-xs font-semibold text-rose-900 block mb-1.5">
                  Butiran Tempahan Yang Bertindih:
                </span>
                <ul className="space-y-1.5 text-xs text-rose-800">
                  {backendError.conflicts.map((c: any) => (
                    <li key={c.id} className="flex items-center justify-between bg-rose-50/70 p-2 rounded border border-rose-100">
                      <div>
                        <span className="font-bold text-slate-800">{c.title}</span>
                        <div className="text-[11px] text-slate-500">
                          Pemohon: {c.user_name || 'Kakitangan'} • Status: <span className="font-semibold capitalize text-amber-700">{c.status}</span>
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                        {c.start_time.substring(11, 16)} - {c.end_time.substring(11, 16)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onNavigateToCalendar}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-700 text-white rounded-lg hover:bg-rose-800 transition-colors"
              >
                Semak Jadual Kalendar Bilik Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ralat Validasi Frontend */}
      {frontendError && (
        <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center gap-2.5 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{frontendError}</span>
        </div>
      )}

      {/* Borang Tempahan Utama */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        {/* 1. Pilihan Bilik Mesyuarat */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            1. Pilihan Bilik Mesyuarat <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {rooms.map((room) => {
              const isSelected = Number(roomId) === room.id;
              const isMaintenance = room.status === 'maintenance';
              return (
                <button
                  type="button"
                  key={room.id}
                  disabled={isMaintenance}
                  onClick={() => setRoomId(room.id)}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                    isMaintenance
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-50/60 border-blue-600 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">
                        {room.room_name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isMaintenance 
                          ? 'bg-slate-200 text-slate-600' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isMaintenance ? 'Penyelenggaraan' : 'Sedia'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{room.location}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {room.capacity} Orang
                    </span>
                    {isSelected && (
                      <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Dipilih
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Tajuk & Tujuan Mesyuarat */}
        <div className="space-y-4">
          <div>
            <label htmlFor="booking-title" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              2. Tajuk Mesyuarat <span className="text-rose-500">*</span>
            </label>
            <input
              id="booking-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cth: Taklimat Pelancaran Projek Sistem ERP 2.0"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="booking-description" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              3. Tujuan & Agenda Mesyuarat (Pilihan)
            </label>
            <textarea
              id="booking-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nyatakan agenda ringkas, bilangan anggaran peserta, atau keperluan alatan..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>

        {/* 3. Tarikh, Masa Mula & Masa Tamat */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              4. Tarikh & Slot Masa
            </span>
            {calculateDuration() && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                Tempoh: {calculateDuration()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tarikh */}
            <div>
              <label htmlFor="booking-date" className="block text-xs font-semibold text-slate-600 mb-1">
                Tarikh Mesyuarat
              </label>
              <input
                id="booking-date"
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Masa Mula */}
            <div>
              <label htmlFor="booking-start-time" className="block text-xs font-semibold text-slate-600 mb-1">
                Masa Mula (Start Time)
              </label>
              <input
                id="booking-start-time"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Masa Tamat */}
            <div>
              <label htmlFor="booking-end-time" className="block text-xs font-semibold text-slate-600 mb-1">
                Masa Tamat (End Time)
              </label>
              <input
                id="booking-end-time"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-lg bg-white border text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
                  frontendError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
            </div>
          </div>

          {/* Pintasan Masa Lazim */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Slot Pantas:</span>
            <button
              type="button"
              onClick={() => applyQuickTime('09:00', '10:30')}
              className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 font-medium transition-colors"
            >
              09:00 - 10:30 (Pagi)
            </button>
            <button
              type="button"
              onClick={() => applyQuickTime('11:00', '12:30')}
              className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 font-medium transition-colors"
            >
              11:00 - 12:30 (Tengah Hari)
            </button>
            <button
              type="button"
              onClick={() => applyQuickTime('14:30', '16:00')}
              className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 font-medium transition-colors"
            >
              14:30 - 16:00 (Petang)
            </button>
          </div>
        </div>

        {/* Butang Hantar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Permohonan akan dihantar terus ke papan pemuka kelulusan Pentadbir.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onNavigateToCalendar}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Semak Kalendar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!frontendError}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyemak Jadual...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Hantar Permohonan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

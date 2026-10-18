import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Plus, 
  Eye, 
  Layers, 
  LayoutGrid, 
  List,
  Building,
  Info
} from 'lucide-react';
import { Booking, Room, BookingStatus } from '../types';

interface RoomCalendarProps {
  rooms: Room[];
  bookings: Booking[];
  onSelectSlotToBook: (roomId: number, dateStr: string, startTime: string, endTime: string) => void;
  onRefresh: () => void;
}

export const RoomCalendar: React.FC<RoomCalendarProps> = ({
  rooms,
  bookings,
  onSelectSlotToBook,
  onRefresh,
}) => {
  // Paparan Tarikh Semasa
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'month' | 'list'>('timeline');
  const [activeModalBooking, setActiveModalBooking] = useState<Booking | null>(null);

  // Waktu operasi jam kerja (08:00 hingga 18:00)
  const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  // Format tarikh terpilih ke format YYYY-MM-DD
  const formatDateToYMD = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const selectedDateYMD = formatDateToYMD(selectedDate);

  // Navigasi Tarikh
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Tapis bilik
  const activeRooms = rooms.filter((r) => {
    if (selectedRoomFilter === 'all') return true;
    return r.id === selectedRoomFilter;
  });

  // Tapis tempahan mengikut tarikh yang dipilih
  const getBookingsForDate = (dateYMD: string) => {
    return bookings.filter((b) => {
      const bDate = b.start_time.split('T')[0].split(' ')[0];
      return bDate === dateYMD;
    });
  };

  const todayBookings = getBookingsForDate(selectedDateYMD);

  // Penunjuk Warna Status
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'approved':
        return {
          bg: 'bg-emerald-500',
          text: 'text-white',
          lightBg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
          label: 'Disahkan (Approved)',
          colorName: 'Hijau',
        };
      case 'pending':
        return {
          bg: 'bg-amber-500',
          text: 'text-white',
          lightBg: 'bg-amber-50 border-amber-300 text-amber-900',
          label: 'Menunggu Kelulusan (Pending)',
          colorName: 'Kuning',
        };
      case 'rejected':
        return {
          bg: 'bg-rose-500',
          text: 'text-white',
          lightBg: 'bg-rose-50 border-rose-300 text-rose-900',
          label: 'Ditolak (Rejected)',
          colorName: 'Merah',
        };
      case 'cancelled':
      default:
        return {
          bg: 'bg-slate-400',
          text: 'text-white',
          lightBg: 'bg-slate-50 border-slate-300 text-slate-700',
          label: 'Dibatalkan (Cancelled)',
          colorName: 'Kelabu',
        };
    }
  };

  // Kira posisi dan lebar blok tempahan pada grid waktu 08:00 - 18:00
  const calculateSlotPosition = (startTimeStr: string, endTimeStr: string) => {
    const getTimeDecimal = (str: string) => {
      const timePart = str.includes(' ') ? str.split(' ')[1] : str.includes('T') ? str.split('T')[1] : str;
      const [h, m] = timePart.split(':').map(Number);
      return h + m / 60;
    };

    const startDec = getTimeDecimal(startTimeStr);
    const endDec = getTimeDecimal(endTimeStr);

    const minHour = 8;
    const totalHours = 10; // 08:00 to 18:00

    const leftPercent = Math.max(0, Math.min(100, ((startDec - minHour) / totalHours) * 100));
    const widthPercent = Math.max(4, Math.min(100 - leftPercent, ((endDec - startDec) / totalHours) * 100));

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header & Penerangan */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-md">
              Jadual Bilik Mesyuarat
            </span>
            <span className="text-xs text-slate-500">• Pemantauan Waktu Nyata</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kalendar & Jadual Penggunaan Bilik
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Semak slot masa bilik yang telah disahkan atau masih dalam proses kelulusan.
          </p>
        </div>

        {/* Legend Penunjuk Warna Status */}
        <div className="flex flex-wrap items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs text-xs">
          <span className="font-bold text-slate-700 mr-1">Petunjuk Status:</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Disahkan (Approved)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Menunggu (Pending)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 font-semibold border border-rose-200">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Ditolak</span>
          </div>
        </div>
      </div>

      {/* Bar Kawalan: Navigasi Tarikh, Pilihan Bilik & Mod Paparan */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigasi Tarikh */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={handlePrevDay}
              className="p-2 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 border-x border-slate-200 transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={handleNextDay}
              className="p-2 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Hari Seterusnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
            <input
              type="date"
              aria-label="Pilih Tarikh Kalendar"
              value={selectedDateYMD}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  setSelectedDate(new Date(y, m - 1, d));
                }
              }}
              className="text-xs font-bold text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <span className="text-xs font-extrabold text-blue-900 hidden sm:inline ml-2">
            {selectedDate.toLocaleDateString('ms-MY', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Pilihan Bilik & Mod Paparan */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Penapis Bilik */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Bilik:</span>
            <select
              aria-label="Pilih Bilik Mesyuarat"
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="all">Semua Bilik ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_name} ({r.capacity} pax)
                </option>
              ))}
            </select>
          </div>

          {/* Tab Mod Paparan */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Garis Masa Bilik</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Senarai Jadual</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PAPARAN 1: GARIS MASA BILIK (TIMELINE SCHEDULE MATRIX) */}
      {/* ==================================================================== */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Baris Masa (08:00 - 18:00) */}
          <div className="border-b border-slate-200 bg-slate-50 flex">
            {/* Ruang Label Bilik */}
            <div className="w-48 sm:w-60 p-3.5 shrink-0 border-r border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-slate-400" />
              <span>Bilik Mesyuarat</span>
            </div>

            {/* Grid Jam 08:00 hingga 18:00 */}
            <div className="flex-1 grid grid-cols-10 text-center divide-x divide-slate-200">
              {HOURS.slice(0, 10).map((h) => (
                <div key={h} className="py-3 text-[11px] font-mono font-semibold text-slate-500">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Baris Bagi Setiap Bilik */}
          <div className="divide-y divide-slate-200">
            {activeRooms.map((room) => {
              // Dapatkan tempahan bilik ini untuk tarikh terpilih
              const roomBookings = todayBookings.filter((b) => b.room_id === room.id);
              const isMaintenance = room.status === 'maintenance';

              return (
                <div key={room.id} className="flex min-h-[95px] relative group hover:bg-slate-50/50 transition-colors">
                  {/* Info Bilik Sebelah Kiri */}
                  <div className="w-48 sm:w-60 p-3.5 shrink-0 border-r border-slate-200 bg-white group-hover:bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                          {room.room_name}
                        </span>
                        {isMaintenance && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                            Servis
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{room.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {room.capacity} Pax
                      </span>
                      {!isMaintenance && (
                        <button
                          onClick={() => onSelectSlotToBook(room.id, selectedDateYMD, '09:00', '10:30')}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                          title="Buat tempahan untuk bilik ini"
                        >
                          <Plus className="w-3 h-3" /> Tempah
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Trek Garis Masa Bilik (Timeline Track) */}
                  <div className="flex-1 relative overflow-hidden bg-slate-50/30">
                    {/* Grid Garisan Jam (Background markers) */}
                    <div className="absolute inset-0 grid grid-cols-10 divide-x divide-slate-100 pointer-events-none">
                      {HOURS.slice(0, 10).map((h) => (
                        <div key={h} className="h-full" />
                      ))}
                    </div>

                    {/* Jika Bilik Penyelenggaraan */}
                    {isMaintenance ? (
                      <div className="absolute inset-0 bg-slate-100/70 flex items-center justify-center text-xs text-slate-500 font-medium">
                        Bilik dalam proses penyelenggaraan berjadual.
                      </div>
                    ) : roomBookings.length === 0 ? (
                      /* Ruang Kosong Sedia Ditempah */
                      <div
                        onClick={() => onSelectSlotToBook(room.id, selectedDateYMD, '10:00', '11:30')}
                        className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 hover:bg-blue-50/50 hover:text-blue-700 cursor-pointer transition-all"
                        title="Klik untuk menempah slot waktu kosong ini"
                      >
                        <span className="opacity-0 group-hover:opacity-100 font-semibold flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-2xs">
                          <Plus className="w-3.5 h-3.5" /> Klik untuk Tempah Slot
                        </span>
                      </div>
                    ) : (
                      /* Blok-blok Tempahan yang Berada pada Bilik Ini */
                      roomBookings.map((booking) => {
                        const { left, width } = calculateSlotPosition(booking.start_time, booking.end_time);
                        const statusStyle = getStatusBadge(booking.status);
                        const timeStart = booking.start_time.includes(' ') ? booking.start_time.split(' ')[1].substring(0, 5) : booking.start_time.substring(11, 16);
                        const timeEnd = booking.end_time.includes(' ') ? booking.end_time.split(' ')[1].substring(0, 5) : booking.end_time.substring(11, 16);

                        return (
                          <div
                            key={booking.id}
                            style={{ left, width }}
                            onClick={() => setActiveModalBooking(booking)}
                            className={`absolute top-2.5 bottom-2.5 rounded-xl border p-2 shadow-2xs cursor-pointer transition-transform hover:scale-[1.01] hover:z-20 overflow-hidden flex flex-col justify-between ${
                              booking.status === 'approved'
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : booking.status === 'pending'
                                ? 'bg-amber-400 text-slate-900 border-amber-500'
                                : 'bg-rose-500 text-white border-rose-600'
                            }`}
                            title={`${booking.title} (${timeStart} - ${timeEnd}) - Status: ${booking.status}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold text-xs truncate">
                                {booking.title}
                              </span>
                              <span className="text-[10px] font-mono opacity-90 shrink-0">
                                {timeStart}-{timeEnd}
                              </span>
                            </div>

                            <div className="text-[10px] opacity-90 truncate flex items-center gap-1">
                              <span>Oleh: {booking.user_name || 'Kakitangan'}</span>
                              <span className="capitalize font-bold text-[9px] px-1 rounded bg-black/15">
                                {booking.status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PAPARAN 2: SENARAI JADUAL TEMPAHAN (AGENDA LIST VIEW) */}
      {/* ==================================================================== */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-base text-slate-900">
              Senarai Tempahan Bagi Tarikh: {selectedDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {todayBookings.length} Tempahan
            </span>
          </div>

          {todayBookings.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Tiada tempahan pada tarikh ini</p>
              <p className="text-xs text-slate-500 mt-1">Semua bilik mesyuarat bersedia untuk ditempah.</p>
              <button
                onClick={() => onSelectSlotToBook(rooms[0]?.id || 1, selectedDateYMD, '09:00', '10:30')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
              >
                + Buat Tempahan Baru
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((b) => {
                const statusStyle = getStatusBadge(b.status);
                const timeStart = b.start_time.includes(' ') ? b.start_time.split(' ')[1].substring(0, 5) : b.start_time.substring(11, 16);
                const timeEnd = b.end_time.includes(' ') ? b.end_time.split(' ')[1].substring(0, 5) : b.end_time.substring(11, 16);

                return (
                  <div
                    key={b.id}
                    onClick={() => setActiveModalBooking(b)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle.lightBg}`}>
                          {statusStyle.label}
                        </span>
                        <span className="text-xs font-bold text-blue-700">
                          {b.room_name} ({b.room_location})
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900">{b.title}</h4>
                      {b.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">"{b.description}"</p>
                      )}
                      <div className="text-xs text-slate-500 flex items-center gap-3 pt-1">
                        <span>Pemohon: <strong>{b.user_name}</strong></span>
                        <span>•</span>
                        <span>Emel: {b.user_email}</span>
                      </div>
                    </div>

                    <div className="text-right sm:border-l sm:pl-4 border-slate-200 shrink-0">
                      <div className="text-sm font-mono font-extrabold text-slate-800">
                        {timeStart} - {timeEnd}
                      </div>
                      <span className="text-[11px] text-blue-600 font-semibold flex items-center justify-end gap-1 mt-1">
                        <Eye className="w-3.5 h-3.5" /> Butiran
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL BUTIRAN TEMPAHAN (BOOKING DETAIL MODAL) */}
      {/* ==================================================================== */}
      {activeModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mb-1.5 ${
                  getStatusBadge(activeModalBooking.status).lightBg
                }`}>
                  Status: {getStatusBadge(activeModalBooking.status).label}
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {activeModalBooking.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700 mb-6">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Bilik Mesyuarat:</div>
                  <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {activeModalBooking.room_name}
                  </div>
                  <div className="text-[11px] text-slate-500">{activeModalBooking.room_location}</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Kapasiti & Ruang:</div>
                  <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-600" />
                    {activeModalBooking.room_capacity || 20} Peserta Max
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Tarikh & Masa Mesyuarat:</div>
                <div className="font-extrabold text-sm text-slate-900 font-mono mt-0.5">
                  {activeModalBooking.start_time.split('T')[0].split(' ')[0]} (
                  {activeModalBooking.start_time.substring(11, 16)} hingga {activeModalBooking.end_time.substring(11, 16)})
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 font-medium mb-1">Pemohon / Penganjur:</div>
                <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{activeModalBooking.user_name}</div>
                    <div className="text-slate-500">{activeModalBooking.user_email}</div>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {activeModalBooking.user_role}
                  </span>
                </div>
              </div>

              {activeModalBooking.description && (
                <div>
                  <div className="text-[11px] text-slate-500 font-medium mb-1">Tujuan / Agenda:</div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 italic">
                    "{activeModalBooking.description}"
                  </div>
                </div>
              )}

              {activeModalBooking.rejection_reason && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
                  <div className="font-bold text-[11px] text-rose-800">Catatan Penolakan Admin:</div>
                  <div className="mt-0.5">{activeModalBooking.rejection_reason}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveModalBooking(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

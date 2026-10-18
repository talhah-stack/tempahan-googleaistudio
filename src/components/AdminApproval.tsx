import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User as UserIcon, 
  MapPin, 
  Users, 
  Calendar, 
  AlertCircle, 
  Filter, 
  ShieldCheck, 
  FileText,
  Search,
  Check,
  X,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { Booking, User, BookingStatus } from '../types';

interface AdminApprovalProps {
  bookings: Booking[];
  currentUser: User | null;
  onUpdateStatus: (bookingId: number, status: BookingStatus, reason?: string) => Promise<boolean>;
  onSwitchToAdmin: () => void;
}

export const AdminApproval: React.FC<AdminApprovalProps> = ({
  bookings,
  currentUser,
  onUpdateStatus,
  onSwitchToAdmin,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Penapisan data tempahan
  const filteredBookings = bookings.filter((b) => {
    // Penapis status
    if (filterStatus !== 'all' && b.status !== filterStatus) {
      return false;
    }
    // Carian teks
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchRoom = (b.room_name || '').toLowerCase().includes(q);
      const matchUser = (b.user_name || '').toLowerCase().includes(q);
      return matchTitle || matchRoom || matchUser;
    }
    return true;
  });

  // Kiraan statistik
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;
  const rejectedCount = bookings.filter((b) => b.status === 'rejected').length;

  // Format tarikh dan masa mesra pengguna
  const formatDateTime = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      
      const dateFormatted = start.toLocaleDateString('ms-MY', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const startTime = startStr.includes(' ') ? startStr.split(' ')[1].substring(0, 5) : start.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
      const endTime = endStr.includes(' ') ? endStr.split(' ')[1].substring(0, 5) : end.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });

      return { dateFormatted, timeRange: `${startTime} - ${endTime}` };
    } catch (e) {
      return { dateFormatted: startStr, timeRange: `${startStr} - ${endStr}` };
    }
  };

  // Handler Luluskan (Approve)
  const handleApprove = async (booking: Booking) => {
    setActionLoadingId(booking.id);
    setActionMessage(null);
    try {
      const success = await onUpdateStatus(booking.id, 'approved');
      if (success) {
        setActionMessage({
          type: 'success',
          text: `Permohonan tempahan "${booking.title}" telah berjaya DILULUSKAN!`,
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Gagal meluluskan tempahan.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler Tolak (Reject)
  const submitRejection = async () => {
    if (!rejectingBooking) return;
    setActionLoadingId(rejectingBooking.id);
    setActionMessage(null);
    try {
      const success = await onUpdateStatus(
        rejectingBooking.id,
        'rejected',
        rejectionReason.trim() || 'Ditolak atas sebab kekangan operasi / slot bilik.'
      );
      if (success) {
        setActionMessage({
          type: 'success',
          text: `Permohonan tempahan "${rejectingBooking.title}" telah DITOLAK.`,
        });
        setRejectingBooking(null);
        setRejectionReason('');
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Gagal menolak tempahan.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Dashboard Kelulusan */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Modul Pentadbir (Admin)
            </span>
            <span className="text-xs text-slate-500">• Pengurusan Status & Semakan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Papan Pemuka Kelulusan Tempahan
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Semak, luluskan, atau tolak permohonan tempahan bilik mesyuarat daripada kakitangan organisasi.
          </p>
        </div>

        {/* Amaran jika pengguna semasa bukan Admin */}
        {!isAdmin && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Anda kini melayari sebagai <strong>{currentUser?.role.toUpperCase()}</strong>.</span>
            </div>
            <button
              onClick={onSwitchToAdmin}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              Tukar ke Admin
            </button>
          </div>
        )}
      </div>

      {/* Kad Metrik Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <button
          onClick={() => setFilterStatus('pending')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'pending'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="text-xs font-semibold opacity-90">Menunggu Kelulusan</div>
          <div className="text-2xl font-extrabold mt-1">{pendingCount}</div>
          <div className="text-[11px] mt-1 opacity-80">Memerlukan tindakan</div>
        </button>

        <button
          onClick={() => setFilterStatus('approved')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'approved'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="text-xs font-semibold opacity-90">Telah Diluluskan</div>
          <div className="text-2xl font-extrabold mt-1">{approvedCount}</div>
          <div className="text-[11px] mt-1 opacity-80">Slot disahkan</div>
        </button>

        <button
          onClick={() => setFilterStatus('rejected')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'rejected'
              ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="text-xs font-semibold opacity-90">Telah Ditolak</div>
          <div className="text-2xl font-extrabold mt-1">{rejectedCount}</div>
          <div className="text-[11px] mt-1 opacity-80">Tidak dibenarkan</div>
        </button>

        <button
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'all'
              ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="text-xs font-semibold opacity-90">Jumlah Semua</div>
          <div className="text-2xl font-extrabold mt-1">{bookings.length}</div>
          <div className="text-[11px] mt-1 opacity-80">Rekod keseluruhan</div>
        </button>
      </div>

      {/* Mesej Maklum Balas Tindakan */}
      {actionMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-rose-50 text-rose-900 border border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="p-1 hover:bg-black/5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bahagian Penapis & Carian */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari tajuk, bilik atau pemohon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'pending'
                ? `Menunggu (${pendingCount})`
                : st === 'approved'
                ? 'Diluluskan'
                : st === 'rejected'
                ? 'Ditolak'
                : 'Semua'}
            </button>
          ))}
        </div>
      </div>

      {/* Senarai Permohonan */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tiada Permohonan Dijumpai</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filterStatus === 'pending'
              ? 'Tiada permohonan baru yang memerlukan kelulusan pada masa ini. Semua permohonan telah selesai diproses.'
              : 'Tiada rekod tempahan yang sepadan dengan kriteria carian atau penapis anda.'}
          </p>
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="mt-4 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Papar Semua Tempahan
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredBookings.map((booking) => {
            const { dateFormatted, timeRange } = formatDateTime(booking.start_time, booking.end_time);
            const isLoading = actionLoadingId === booking.id;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Maklumat Utama Tempahan */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                        booking.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : booking.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : booking.status === 'cancelled'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {booking.status === 'approved' && <Check className="w-3 h-3 text-emerald-600" />}
                      {booking.status === 'rejected' && <X className="w-3 h-3 text-rose-600" />}
                      {booking.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                      <span className="capitalize">
                        {booking.status === 'approved'
                          ? 'Diluluskan'
                          : booking.status === 'rejected'
                          ? 'Ditolak'
                          : booking.status === 'pending'
                          ? 'Menunggu Kelulusan'
                          : 'Dibatalkan'}
                      </span>
                    </span>

                    <span className="text-xs text-slate-400 font-mono">#{booking.id}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {booking.title}
                  </h3>

                  {booking.description && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      "{booking.description}"
                    </p>
                  )}

                  {/* Sebab penolakan jika ada */}
                  {booking.rejection_reason && (
                    <div className="text-xs text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Catatan Penolakan: {booking.rejection_reason}</span>
                    </div>
                  )}

                  {/* Metadata Bilik & Pengguna */}
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      {booking.room_name} ({booking.room_location})
                    </span>

                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {dateFormatted}
                    </span>

                    <span className="flex items-center gap-1 font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {timeRange}
                    </span>

                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {booking.user_name || 'Kakitangan'} ({booking.user_email})
                    </span>
                  </div>
                </div>

                {/* Butang Tindakan Kelulusan (Luluskan / Tolak) */}
                <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  {booking.status === 'pending' ? (
                    <>
                      {/* Butang Tolak */}
                      <button
                        type="button"
                        disabled={isLoading || !isAdmin}
                        onClick={() => setRejectingBooking(booking)}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-xl transition-colors disabled:opacity-50"
                        title={!isAdmin ? 'Hanya akaun Admin dibenarkan menolak' : 'Tolak tempahan ini'}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Tolak</span>
                      </button>

                      {/* Butang Luluskan (Approve) */}
                      <button
                        type="button"
                        disabled={isLoading || !isAdmin}
                        onClick={() => handleApprove(booking)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                        title={!isAdmin ? 'Hanya akaun Admin dibenarkan meluluskan' : 'Luluskan tempahan ini'}
                      >
                        {isLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>Luluskan</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">Tindakan selesai</span>
                      {booking.status === 'approved' && (
                        <button
                          type="button"
                          disabled={isLoading || !isAdmin}
                          onClick={() => setRejectingBooking(booking)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Batalkan Kelulusan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog Sebab Penolakan (Rejection Modal) */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-700 mb-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Tolak Permohonan Tempahan
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Anda sedang menolak permohonan mesyuarat <strong>"{rejectingBooking.title}"</strong> oleh{' '}
              {rejectingBooking.user_name}. Sila nyatakan sebab penolakan untuk makluman pemohon.
            </p>

            <div className="mb-4">
              <label htmlFor="rejection-reason" className="block text-xs font-bold text-slate-700 mb-1.5">
                Sebab Penolakan:
              </label>
              <textarea
                id="rejection-reason"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Cth: Bilik diperlukan untuk taklimat kecemasan pihak pengurusan atasan."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingBooking(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoadingId === rejectingBooking.id}
                onClick={submitRejection}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
              >
                Sahkan Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

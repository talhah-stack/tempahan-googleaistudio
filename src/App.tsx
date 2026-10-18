/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { RoomCalendar } from './components/RoomCalendar';
import { BookingForm } from './components/BookingForm';
import { AdminApproval } from './components/AdminApproval';
import { SqlDatabaseGuide } from './components/SqlDatabaseGuide';
import { Room, Booking, User, DatabaseStatus, BookingStatus } from './types';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'booking' | 'admin' | 'db_guide'>('calendar');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // Pra-isi slot apabila pengguna memilih daripada kalendar
  const [preselectedSlot, setPreselectedSlot] = useState<{
    roomId?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
  }>({});

  // Sistem Notifikasi Ringkas
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Muat turun data daripada Backend API
  const loadInitialData = useCallback(async () => {
    try {
      const [roomsRes, bookingsRes, usersRes, dbRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/bookings'),
        fetch('/api/users'),
        fetch('/api/db-status'),
      ]);

      const roomsData = await roomsRes.json();
      const bookingsData = await bookingsRes.json();
      const usersData = await usersRes.json();
      const dbData = await dbRes.json();

      if (roomsData.success) setRooms(roomsData.data);
      if (bookingsData.success) setBookings(bookingsData.data);
      if (usersData.success) {
        setUsers(usersData.data);
        // Tetapkan pengguna lalai (Staff) jika belum ditetapkan
        if (!currentUser && usersData.data.length > 0) {
          const staffUser = usersData.data.find((u: User) => u.role === 'staff') || usersData.data[0];
          setCurrentUser(staffUser);
        }
      }
      if (dbData.success) setDbStatus(dbData.data);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Kemas kini status tempahan (Kelulusan Admin)
  const handleUpdateStatus = async (
    bookingId: number,
    status: BookingStatus,
    reason?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejection_reason: reason }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Gagal mengemas kini status tempahan.');
      }

      showToast('success', resData.message || 'Status berjaya dikemas kini!');
      // Muat semula data tempahan terkini
      await loadInitialData();
      return true;
    } catch (err: any) {
      showToast('error', err.message || 'Ralat semasa memproses kelulusan.');
      return false;
    }
  };

  // Set Semula Data Sampel (Reset Demo)
  const handleResetData = async () => {
    setIsResetting(true);
    try {
      const response = await fetch('/api/reset-demo', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        showToast('info', 'Data sampel telah diset semula kepada keadaan asal.');
        await loadInitialData();
      }
    } catch (err) {
      showToast('error', 'Gagal menetapkan semula data.');
    } finally {
      setIsResetting(false);
    }
  };

  // Navigasi dari kalendar ke borang tempahan dengan pra-isi bilik dan masa
  const handleSelectSlotToBook = (roomId: number, dateStr: string, startTime: string, endTime: string) => {
    setPreselectedSlot({
      roomId,
      date: dateStr,
      startTime,
      endTime,
    });
    setActiveTab('booking');
  };

  // Tukar kepada peranan admin secara pantas
  const handleSwitchToAdmin = () => {
    const adminUser = users.find((u) => u.role === 'admin');
    if (adminUser) {
      setCurrentUser(adminUser);
      showToast('info', `Anda kini melayari sebagai Admin: ${adminUser.name}`);
    }
  };

  const pendingBookingsCount = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Bar Navigasi Utama */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        users={users}
        onSelectUser={(u) => {
          setCurrentUser(u);
          showToast('info', `Pengguna ditukar: ${u.name} (${u.role.toUpperCase()})`);
        }}
        pendingCount={pendingBookingsCount}
        dbStatus={dbStatus}
        onResetData={handleResetData}
        isResetting={isResetting}
      />

      {/* Toast Notification Floating Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounceOnce">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-800 text-white border-emerald-900'
                : toast.type === 'error'
                ? 'bg-rose-800 text-white border-rose-900'
                : 'bg-slate-900 text-white border-slate-950'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Kandungan Utama Berdasarkan Tab */}
      <main className="flex-1">
        {isLoading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium">Memuatkan data sistem tempahan...</p>
          </div>
        ) : (
          <>
            {activeTab === 'calendar' && (
              <RoomCalendar
                rooms={rooms}
                bookings={bookings}
                onSelectSlotToBook={handleSelectSlotToBook}
                onRefresh={loadInitialData}
              />
            )}

            {activeTab === 'booking' && (
              <BookingForm
                rooms={rooms}
                currentUser={currentUser}
                onBookingCreated={async () => {
                  await loadInitialData();
                  showToast('success', 'Permohonan tempahan bilik berjaya dihantar!');
                }}
                onNavigateToCalendar={() => setActiveTab('calendar')}
                preselectedRoomId={preselectedSlot.roomId}
                preselectedDate={preselectedSlot.date}
                preselectedStartTime={preselectedSlot.startTime}
                preselectedEndTime={preselectedSlot.endTime}
              />
            )}

            {activeTab === 'admin' && (
              <AdminApproval
                bookings={bookings}
                currentUser={currentUser}
                onUpdateStatus={handleUpdateStatus}
                onSwitchToAdmin={handleSwitchToAdmin}
              />
            )}

            {activeTab === 'db_guide' && <SqlDatabaseGuide dbStatus={dbStatus} />}
          </>
        )}
      </main>

      {/* Footer Ringkas */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Sistem Tempahan Bilik Mesyuarat (STBM)</strong> • Dikuasakan oleh Node.js, Express.js, React.js & MySQL
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('db_guide')}
              className="text-blue-600 hover:underline font-medium"
            >
              Lihat Skrip SQL & Dokumentasi
            </button>
            <span>•</span>
            <span className="font-mono text-[11px] text-slate-400">Anti-Overlapping Engine Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export type UserRole = 'staff' | 'admin';
export type RoomStatus = 'active' | 'maintenance';
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface Room {
  id: number;
  room_name: string;
  capacity: number;
  location: string;
  status: RoomStatus;
  created_at?: string;
}

export interface Booking {
  id: number;
  room_id: number;
  user_id: number;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  rejection_reason?: string | null;
  created_at?: string;
  room_name?: string;
  room_location?: string;
  room_capacity?: number;
  user_name?: string;
  user_email?: string;
  user_role?: UserRole;
}

export interface DatabaseStatus {
  mode: 'mysql' | 'in_memory_simulation';
  isConnectedToMySQL: boolean;
  error: string | null;
  config: {
    host: string;
    port: number;
    database: string;
    user: string;
  };
}

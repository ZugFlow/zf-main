export interface Member {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  role?: string;
  department?: string;
  hire_date?: string;
  ColorMember?: string;
  user_id?: string;
  is_active?: boolean;
}

export interface Permission {
  id: string;
  member_id: string;
  member_name: string;
  salon_id: string;
  type: 'ferie' | 'permesso' | 'malattia' | 'altro';
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  notes?: string | undefined;
  created_at: string | null;
  updated_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  archived?: boolean;
}

export interface WorkHours {
  id: string;
  member_id: string;
  member_name: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  break_time: number;
  notes?: string;
  status: 'completed' | 'pending' | 'absent';
  created_at: string;
  updated_at: string;
}

export interface HolidayBalance {
  id?: string;
  member_id: string;
  member_name: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  pending_days: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormData {
  member_id: string;
  type: Permission['type'];
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  notes: string;
}

// Nuovi tipi per la gestione orari di lavoro
export interface WeeklySchedule {
  id: string;
  member_id: string;
  salon_id: string;
  week_start_date: string; // Data di inizio settimana (lunedì)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailySchedule {
  id: string;
  weekly_schedule_id: string;
  day_of_week: number; // 0 = domenica, 1 = lunedì, ..., 6 = sabato
  start_time: string;
  end_time: string;
  is_working_day: boolean;
  break_start?: string;
  break_end?: string;
  notes?: string;
}

export interface ExtraSchedule {
  id: string;
  member_id: string;
  salon_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'extra' | 'overtime' | 'holiday' | 'closing';
  reason?: string;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftRequest {
  id: string;
  member_id: string;
  salon_id: string;
  requested_date: string;
  current_start_time: string;
  current_end_time: string;
  requested_start_time: string;
  requested_end_time: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRequest {
  id: string;
  member_id: string;
  salon_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'available' | 'unavailable';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleNotification {
  id: string;
  member_id: string;
  salon_id: string;
  type: 'schedule_change' | 'shift_request' | 'availability_request' | 'approval';
  title: string;
  message: string;
  is_read: boolean;
  related_id?: string; // ID del record correlato (schedule, request, etc.)
  created_at: string;
}

export interface WorkingHoursFormData {
  member_id: string;
  week_start_date: string;
  schedules: {
    [key: number]: { // day_of_week
      is_working_day: boolean;
      start_time: string;
      end_time: string;
      break_start?: string;
      break_end?: string;
      notes?: string;
    };
  };
}

export interface ExtraScheduleFormData {
  member_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'extra' | 'overtime' | 'holiday' | 'closing';
  reason?: string;
}

export interface ShiftRequestFormData {
  requested_date: string;
  current_start_time: string;
  current_end_time: string;
  requested_start_time: string;
  requested_end_time: string;
  reason: string;
}

export interface AvailabilityRequestFormData {
  date: string;
  start_time: string;
  end_time: string;
  type: 'available' | 'unavailable';
  reason?: string;
} 
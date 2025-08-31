// TypeScript interfaces for appointment notifications

export interface AppointmentNotification {
  id: string;
  appointment_id: string;
  salon_id: string;
  method: 'sms' | 'whatsapp' | 'email';
  time_minutes: number;
  sent: boolean;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentNotificationInsert {
  appointment_id: string;
  salon_id: string;
  method: 'sms' | 'whatsapp' | 'email';
  time_minutes: number;
  sent?: boolean;
  sent_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentNotificationUpdate {
  id?: string;
  appointment_id?: string;
  salon_id?: string;
  method?: 'sms' | 'whatsapp' | 'email';
  time_minutes?: number;
  sent?: boolean;
  sent_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PendingNotification {
  notification_id: string;
  appointment_id: string;
  method: 'sms' | 'whatsapp' | 'email';
  time_minutes: number;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  appointment_date: string;
  appointment_time: string;
  team_member_name: string | null;
}

export interface NotificationStats {
  method: 'sms' | 'whatsapp' | 'email';
  total_notifications: number;
  sent_notifications: number;
  success_rate: number;
}

export interface NotificationSettings {
  enabled: boolean;
  default_methods: ('sms' | 'whatsapp' | 'email')[];
  default_times: number[]; // minutes before appointment
  custom_message_template?: string;
}

// Common notification time intervals
export const NOTIFICATION_TIMES = {
  ONE_WEEK: 10080, // 7 days in minutes (7 * 24 * 60)
  FOUR_DAYS: 5760, // 4 days in minutes (4 * 24 * 60)
  THREE_DAYS: 4320, // 3 days in minutes (3 * 24 * 60)
  TWO_DAYS: 2880, // 2 days in minutes (2 * 24 * 60)
  TWENTY_FOUR_HOURS: 1440, // 24 hours in minutes
  ONE_HOUR: 60,
  THIRTY_MINUTES: 30,
  FIFTEEN_MINUTES: 15,
  FIVE_MINUTES: 5,
} as const;

// Notification methods
export const NOTIFICATION_METHODS = {
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
} as const;

// Helper function to get human-readable time description
export function getTimeDescription(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    return `${days} ${days === 1 ? 'giorno' : 'giorni'} prima`;
  } else if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} ${hours === 1 ? 'ora' : 'ore'} prima`;
  } else {
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minuti'} prima`;
  }
}

// Helper function to get method display name
export function getMethodDisplayName(method: 'sms' | 'whatsapp' | 'email'): string {
  switch (method) {
    case 'sms':
      return 'SMS';
    case 'whatsapp':
      return 'WhatsApp';
    case 'email':
      return 'Email';
    default:
      return method;
  }
}

// Helper function to get method icon
export function getMethodIcon(method: 'sms' | 'whatsapp' | 'email'): string {
  switch (method) {
    case 'sms':
      return '📱';
    case 'whatsapp':
      return '💬';
    case 'email':
      return '📧';
    default:
      return '📢';
  }
} 
import { createClient } from '@/utils/supabase/client';
import { 
  AppointmentNotification, 
  AppointmentNotificationInsert, 
  PendingNotification, 
  NotificationStats,
  NOTIFICATION_TIMES,
  NOTIFICATION_METHODS 
} from '@/types/appointment-notifications';

const supabase = createClient();

export class AppointmentNotificationService {
  /**
   * Create a new notification record
   */
  static async createNotification(notification: AppointmentNotificationInsert): Promise<AppointmentNotification> {
    const { data, error } = await supabase
      .from('appointment_notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all notifications for a specific appointment
   */
  static async getNotificationsForAppointment(appointmentId: string): Promise<AppointmentNotification[]> {
    const { data, error } = await supabase
      .from('appointment_notifications')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('time_minutes', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get pending notifications for a specific time interval
   */
  static async getPendingNotifications(salonId: string, minutesBefore: number): Promise<PendingNotification[]> {
    const { data, error } = await supabase
      .rpc('get_pending_notifications', {
        p_salon_id: salonId,
        p_minutes_before: minutesBefore
      });

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark a notification as sent
   */
  static async markNotificationSent(notificationId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('mark_notification_sent', {
        p_notification_id: notificationId
      });

    if (error) throw error;
    return data;
  }

  /**
   * Get notification statistics for a salon
   */
  static async getNotificationStats(
    salonId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<NotificationStats[]> {
    const { data, error } = await supabase
      .rpc('get_notification_stats', {
        p_salon_id: salonId,
        p_start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_end_date: endDate || new Date().toISOString().split('T')[0]
      });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a custom notification for an appointment
   */
  static async createCustomNotification(
    appointmentId: string,
    salonId: string,
    method: 'sms' | 'whatsapp' | 'email',
    timeMinutes: number
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('create_custom_notification', {
        p_appointment_id: appointmentId,
        p_salon_id: salonId,
        p_method: method,
        p_time_minutes: timeMinutes
      });

    if (error) throw error;
    return data;
  }

  /**
   * Delete all notifications for an appointment
   */
  static async deleteAppointmentNotifications(appointmentId: string, salonId: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('delete_appointment_notifications', {
        p_appointment_id: appointmentId,
        p_salon_id: salonId
      });

    if (error) throw error;
    return data;
  }

  /**
   * Update notification settings
   */
  static async updateNotification(notificationId: string, updates: Partial<AppointmentNotification>): Promise<AppointmentNotification> {
    const { data, error } = await supabase
      .from('appointment_notifications')
      .update(updates)
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all notifications for a salon with pagination
   */
  static async getNotificationsForSalon(
    salonId: string, 
    page: number = 1, 
    pageSize: number = 50
  ): Promise<{ data: AppointmentNotification[], count: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('appointment_notifications')
      .select('*', { count: 'exact' })
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  /**
   * Get notifications that need to be sent (for cron job)
   */
  static async getNotificationsToSend(salonId: string): Promise<PendingNotification[]> {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    
    // Get notifications for different time intervals
    const timeIntervals = [
      NOTIFICATION_TIMES.TWENTY_FOUR_HOURS,
      NOTIFICATION_TIMES.ONE_HOUR,
      NOTIFICATION_TIMES.THIRTY_MINUTES,
      NOTIFICATION_TIMES.FIFTEEN_MINUTES,
      NOTIFICATION_TIMES.FIVE_MINUTES
    ];

    const allNotifications: PendingNotification[] = [];

    for (const minutes of timeIntervals) {
      try {
        const notifications = await this.getPendingNotifications(salonId, minutes);
        allNotifications.push(...notifications);
      } catch (error) {
        console.error(`Error fetching notifications for ${minutes} minutes:`, error);
      }
    }

    return allNotifications;
  }

  /**
   * Bulk mark notifications as sent
   */
  static async markNotificationsAsSent(notificationIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('appointment_notifications')
      .update({ 
        sent: true, 
        sent_at: new Date().toISOString() 
      })
      .in('id', notificationIds);

    if (error) throw error;
  }

  /**
   * Get notification settings for a salon (placeholder for future implementation)
   */
  static async getNotificationSettings(salonId: string) {
    // This could be implemented to store salon-specific notification preferences
    // For now, return default settings
    return {
      enabled: true,
      default_methods: [NOTIFICATION_METHODS.SMS, NOTIFICATION_METHODS.EMAIL],
      default_times: [
        NOTIFICATION_TIMES.TWENTY_FOUR_HOURS,
        NOTIFICATION_TIMES.ONE_HOUR,
        NOTIFICATION_TIMES.FIFTEEN_MINUTES
      ],
      custom_message_template: null
    };
  }
}

// Export commonly used constants
export { NOTIFICATION_TIMES, NOTIFICATION_METHODS }; 
import { useState, useEffect, useCallback } from 'react';
import { createClient } from "@/utils/supabase/client";
import { getSalonId } from '@/utils/getSalonId';
import { Appointment, Member } from '../types';
import { format, startOfDay, endOfDay } from 'date-fns';

const supabase = createClient();

export const useAppointmentData = (dailyViewDate: Date) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarHours, setCalendarHours] = useState<{ start: string; end: string } | null>(null);

  const fetchAppointments = useCallback(async (forceRefresh = false) => {
    try {
      const salonId = await getSalonId();
      if (!salonId) {
        setError('Salon ID non trovato');
        return;
      }

      const startDate = startOfDay(dailyViewDate);
      const endDate = endOfDay(dailyViewDate);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          nome,
          orarioInizio,
          orarioFine,
          data,
          team_id,
          servizio,
          accesso,
          status,
          progresso,
          color_card,
          prefer_card_style,
          alone,
          note,
          task,
          email,
          services (
            id,
            name,
            price
          )
        `)
        .eq('salon_id', salonId)
        .gte('data', format(startDate, 'yyyy-MM-dd'))
        .lte('data', format(endDate, 'yyyy-MM-dd'))
        .order('orarioInizio', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        setError(error.message);
        return;
      }

      const processedAppointments = data?.map(appointment => ({
        ...appointment,
        services: appointment.services || []
      })) || [];

      setAppointments(processedAppointments);
    } catch (err) {
      console.error('Error in fetchAppointments:', err);
      setError('Errore nel caricamento degli appuntamenti');
    }
  }, [dailyViewDate]);

  const fetchMembers = useCallback(async () => {
    try {
      const salonId = await getSalonId();
      if (!salonId) {
        setError('Salon ID non trovato');
        return;
      }

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('salon_id', salonId)
        .eq('visible_users', true)
        .order('order_column', { ascending: true });

      if (error) {
        console.error('Error fetching members:', error);
        setError(error.message);
        return;
      }

      setMembers(data || []);
    } catch (err) {
      console.error('Error in fetchMembers:', err);
      setError('Errore nel caricamento dei membri del team');
    }
  }, []);

  const fetchCalendarHours = useCallback(async () => {
    try {
      const salonId = await getSalonId();
      if (!salonId) return;

      const { data, error } = await supabase
        .from('salon_settings')
        .select('working_hours_start, working_hours_end')
        .eq('salon_id', salonId)
        .single();

      if (error) {
        console.error('Error fetching calendar hours:', error);
        return;
      }

      setCalendarHours({
        start: data?.working_hours_start || '08:00',
        end: data?.working_hours_end || '20:00'
      });
    } catch (err) {
      console.error('Error in fetchCalendarHours:', err);
    }
  }, []);

  const addAppointment = useCallback(async (newAppointment: Appointment) => {
    try {
      const salonId = await getSalonId();
      if (!salonId) {
        setError('Salon ID non trovato');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert([{
          ...newAppointment,
          salon_id: salonId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding appointment:', error);
        setError(error.message);
        return;
      }

      setAppointments(prev => [...prev, data]);
    } catch (err) {
      console.error('Error in addAppointment:', err);
      setError('Errore nell\'aggiunta dell\'appuntamento');
    }
  }, []);

  const updateAppointment = useCallback(async (appointmentId: string, updates: Partial<Appointment>) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        setError(error.message);
        return;
      }

      setAppointments(prev => 
        prev.map(appt => appt.id === appointmentId ? { ...appt, ...data } : appt)
      );
    } catch (err) {
      console.error('Error in updateAppointment:', err);
      setError('Errore nell\'aggiornamento dell\'appuntamento');
    }
  }, []);

  const deleteAppointment = useCallback(async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        console.error('Error deleting appointment:', error);
        setError(error.message);
        return;
      }

      setAppointments(prev => prev.filter(appt => appt.id !== appointmentId));
    } catch (err) {
      console.error('Error in deleteAppointment:', err);
      setError('Errore nella cancellazione dell\'appuntamento');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchAppointments(),
        fetchMembers(),
        fetchCalendarHours()
      ]);
      
      setLoading(false);
    };

    loadData();
  }, [fetchAppointments, fetchMembers, fetchCalendarHours]);

  return {
    appointments,
    members,
    calendarHours,
    loading,
    error,
    fetchAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment
  };
}; 
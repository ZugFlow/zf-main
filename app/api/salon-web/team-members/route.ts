import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Recupera membri del team disponibili per uno slot specifico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salon_id');
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const serviceId = searchParams.get('service_id');

    console.log('Team Members API - Request params:', { salonId, date, time, serviceId });

    if (!salonId || !date || !time) {
      return NextResponse.json(
        { error: 'salon_id, date e time sono obbligatori' },
        { status: 400 }
      );
    }

    // Recupera la durata del servizio se specificato
    let serviceDuration = 30; // default
    if (serviceId) {
      const { data: service } = await supabaseAdmin
        .from('services')
        .select('duration')
        .eq('id', serviceId)
        .single();
      
      if (service?.duration) {
        serviceDuration = service.duration;
      }
    }

    // Calcola l'orario di fine
    const endTime = calculateEndTime(time, serviceDuration);

    // Recupera tutti i membri del team del salone
    const { data: teamMembers, error: teamError } = await supabaseAdmin
      .from('team')
      .select('id, name, user_id')
      .eq('salon_id', salonId);

    if (teamError || !teamMembers) {
      return NextResponse.json(
        { error: 'Errore nel recupero membri del team' },
        { status: 500 }
      );
    }

    // Recupera appuntamenti esistenti
    const { data: existingAppointments } = await supabaseAdmin
      .from('orders')
      .select('orarioInizio, orarioFine, team_id, status')
      .eq('data', date)
      .eq('salon_id', salonId)
      .neq('status', 'Eliminato')
      .neq('status', 'Annullato');

    // Recupera prenotazioni online esistenti
    const { data: existingOnlineBookings } = await supabaseAdmin
      .from('online_bookings')
      .select('start_time, end_time, team_member_id, status')
      .eq('booking_date', date)
      .eq('salon_id', salonId)
      .in('status', ['pending', 'confirmed']);

    // Recupera permessi e ferie
    const { data: timeOff } = await supabaseAdmin
      .from('permessiferie')
      .select('start_date, end_date, start_time, end_time, member_id, status')
      .eq('salon_id', salonId)
      .eq('status', 'approved')
      .lte('start_date', date)
      .gte('end_date', date);

    // Verifica disponibilità per ogni membro del team
    const availableTeamMembers = teamMembers.filter(member => {
      // Verifica se ha permessi/ferie
      const hasTimeOff = timeOff?.some(off => off.member_id === member.id);
      if (hasTimeOff) return false;

      // Verifica se ha appuntamenti sovrapposti
      const hasAppointment = existingAppointments?.some(appointment => {
        if (appointment.team_id !== member.id) return false;
        return time < appointment.orarioFine && appointment.orarioInizio < endTime;
      });
      if (hasAppointment) return false;

      // Verifica se ha prenotazioni online sovrapposte
      const hasOnlineBooking = existingOnlineBookings?.some(booking => {
        if (booking.team_member_id !== member.id) return false;
        return time < booking.end_time && booking.start_time < endTime;
      });
      if (hasOnlineBooking) return false;

      return true;
    });

    return NextResponse.json({
      available_team_members: availableTeamMembers,
      total_team_members: teamMembers.length,
      requested_time: time,
      end_time: endTime,
      service_duration: serviceDuration
    });

  } catch (error) {
    console.error('Errore nel recupero membri del team disponibili:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Funzione helper per calcolare l'orario di fine
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
} 
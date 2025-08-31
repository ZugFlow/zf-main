import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test endpoint per verificare il funzionamento del sistema di prenotazione
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salon_id');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]; // Default to today

    console.log('Test API - Request params:', { salonId, date });

    if (!salonId) {
      return NextResponse.json(
        { error: 'salon_id è obbligatorio' },
        { status: 400 }
      );
    }

    // Recupera tutti gli appuntamenti esistenti per questa data
    const { data: existingAppointments, error: appointmentsError } = await supabaseAdmin
      .from('orders')
      .select('orarioInizio, orarioFine, team_id, status, nome')
      .eq('data', date)
      .eq('salon_id', salonId)
      .neq('status', 'Eliminato')
      .neq('status', 'Annullato');

    if (appointmentsError) {
      console.error('Test API - Error fetching appointments:', appointmentsError);
      return NextResponse.json(
        { error: `Errore nel recupero appuntamenti: ${appointmentsError.message}` },
        { status: 500 }
      );
    }

    // Recupera le prenotazioni online esistenti
    const { data: existingOnlineBookings, error: onlineBookingsError } = await supabaseAdmin
      .from('online_bookings')
      .select('start_time, end_time, team_member_id, status, customer_name')
      .eq('booking_date', date)
      .eq('salon_id', salonId)
      .in('status', ['pending', 'confirmed']);

    if (onlineBookingsError) {
      console.error('Test API - Error fetching online bookings:', onlineBookingsError);
      return NextResponse.json(
        { error: `Errore nel recupero prenotazioni online: ${onlineBookingsError.message}` },
        { status: 500 }
      );
    }

    // Recupera le impostazioni degli orari di lavoro
    const { data: workingHours, error: workingHoursError } = await supabaseAdmin
      .from('hoursettings')
      .select('start_hour, finish_hour')
      .eq('salon_id', salonId)
      .single();

    // Recupera permessi e ferie
    const { data: timeOff, error: timeOffError } = await supabaseAdmin
      .from('permessiferie')
      .select('start_date, end_date, start_time, end_time, member_id, status')
      .eq('salon_id', salonId)
      .eq('status', 'approved')
      .lte('start_date', date)
      .gte('end_date', date);

    // Recupera tutti i membri del team del salone
    const { data: teamMembers, error: teamError } = await supabaseAdmin
      .from('team')
      .select('id, name, user_id')
      .eq('salon_id', salonId);

    if (teamError) {
      console.error('Test API - Error fetching team members:', teamError);
      return NextResponse.json(
        { error: `Errore nel recupero membri del team: ${teamError.message}` },
        { status: 500 }
      );
    }

    // Analizza la disponibilità per ogni membro del team
    const teamAvailability = teamMembers?.map(member => {
      const memberAppointments = existingAppointments?.filter(apt => apt.team_id === member.id) || [];
      const memberOnlineBookings = existingOnlineBookings?.filter(booking => booking.team_member_id === member.id) || [];
      const memberTimeOff = timeOff?.filter(off => off.member_id === member.id) || [];

      return {
        id: member.id,
        name: member.name,
        appointments: memberAppointments,
        online_bookings: memberOnlineBookings,
        time_off: memberTimeOff,
        total_appointments: memberAppointments.length,
        total_online_bookings: memberOnlineBookings.length,
        has_time_off: memberTimeOff.length > 0
      };
    }) || [];

    return NextResponse.json({
      date,
      salon_id: salonId,
      team_members: teamMembers || [],
      team_availability: teamAvailability,
      existing_appointments: existingAppointments || [],
      existing_online_bookings: existingOnlineBookings || [],
      working_hours: workingHours,
      time_off: timeOff || [],
      day_of_week: new Date(date).getDay(),
      is_sunday: new Date(date).getDay() === 0,
      summary: {
        total_team_members: teamMembers?.length || 0,
        total_appointments: existingAppointments?.length || 0,
        total_online_bookings: existingOnlineBookings?.length || 0,
        has_time_off: (timeOff?.length || 0) > 0,
        working_hours_configured: !!workingHours,
        salon_open: new Date(date).getDay() !== 0,
        available_team_members: teamAvailability.filter(member => !member.has_time_off).length
      }
    });

  } catch (error) {
    console.error('Test API - Error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 
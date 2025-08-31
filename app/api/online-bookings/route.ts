import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { 
  parseOpeningHours, 
  generateAvailableSlotsForBooking, 
  isWithinOpeningHours,
  calculateEndTime 
} from '@/utils/openingHoursUtils';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const {
      salon_id,
      customer_name,
      customer_email,
      customer_phone,
      requested_date,
      requested_time,
      service_id,
      service_name,
      service_duration,
      service_price,
      team_member_id,
      notes,
      ip_address,
      user_agent
    } = body;

    // Validazione dei dati
    if (!salon_id || !customer_name || !requested_date || !requested_time || !service_name || !service_duration || !service_price) {
      return NextResponse.json(
        { error: 'Dati mancanti o non validi' },
        { status: 400 }
      );
    }

    // Verifica se le prenotazioni online sono abilitate per questo salone
    const { data: settings, error: settingsError } = await supabase
      .from('online_booking_settings')
      .select('*')
      .eq('salon_id', salon_id)
      .single();

    if (settingsError || !settings?.enabled) {
      return NextResponse.json(
        { error: 'Prenotazioni online non abilitate per questo salone' },
        { status: 403 }
      );
    }

    // Get salon web settings for opening hours
    const { data: webSettings, error: webSettingsError } = await supabase
      .from('salon_web_settings')
      .select('*')
      .eq('salon_id', salon_id)
      .single();

    if (webSettingsError) {
      console.error('Error fetching web settings:', webSettingsError);
    }

    // Parse opening hours - use any to access the field that might not be in types yet
    const openingHoursString = (webSettings as any)?.web_map_opening_hours || '';
    const openingHours = parseOpeningHours(openingHoursString);

    // Check if the requested time is within opening hours
    if (!isWithinOpeningHours(requested_date, requested_time, Number(service_duration), openingHours)) {
      return NextResponse.json(
        { error: 'L\'orario richiesto non è disponibile o fuori dagli orari di apertura' },
        { status: 400 }
      );
    }

    // Check for existing bookings that conflict with this time slot
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('online_bookings')
      .select('requested_date, requested_time, service_duration, status')
      .eq('salon_id', salon_id)
      .eq('requested_date', requested_date)
      .in('status', ['pending', 'approved']);

    if (bookingsError) {
      console.error('Error checking existing bookings:', bookingsError);
    }

    // Check for conflicts with existing bookings
    const hasConflict = existingBookings?.some(booking => {
      const bookingStart = booking.requested_time;
      const bookingEnd = calculateEndTime(booking.requested_time, Number(booking.service_duration));
      const requestedEnd = calculateEndTime(requested_time, Number(service_duration));
      
      return (requested_time < bookingEnd && requestedEnd > bookingStart);
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: 'L\'orario richiesto non è disponibile' },
        { status: 409 }
      );
    }

    // Verifica preavviso minimo
    const requestedDateTime = new Date(`${requested_date}T${requested_time}`);
    const now = new Date();
    const minNoticeHours = settings.min_notice_hours || 2;
    const minNoticeTime = new Date(now.getTime() + (minNoticeHours * 60 * 60 * 1000));

    if (requestedDateTime < minNoticeTime) {
      return NextResponse.json(
        { error: `È necessario un preavviso minimo di ${minNoticeHours} ore` },
        { status: 400 }
      );
    }

    // Verifica giorni massimi in anticipo
    const maxDaysAhead = settings.max_days_ahead || 30;
    const maxDate = new Date(now.getTime() + (maxDaysAhead * 24 * 60 * 60 * 1000));

    if (requestedDateTime > maxDate) {
      return NextResponse.json(
        { error: `Non è possibile prenotare oltre ${maxDaysAhead} giorni in anticipo` },
        { status: 400 }
      );
    }

    // Determina lo status iniziale
    let initialStatus = 'pending';
    if (!settings.require_approval && settings.auto_confirm) {
      initialStatus = 'approved';
    }

    // Inserisci la prenotazione
    const { data: booking, error: insertError } = await supabase
      .from('online_bookings')
      .insert({
        salon_id,
        customer_name,
        customer_email,
        customer_phone,
        requested_date,
        requested_time,
        booking_date: requested_date, // campo alias
        start_time: requested_time, // campo alias
        service_id,
        service_name,
        service_duration,
        service_price,
        team_member_id,
        status: initialStatus,
        notes,
        ip_address,
        user_agent
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting booking:', insertError);
      return NextResponse.json(
        { error: 'Errore durante la creazione della prenotazione' },
        { status: 500 }
      );
    }

    // Se la prenotazione è auto-approvata, crea anche l'appuntamento
    if (initialStatus === 'approved') {
      const endTime = calculateEndTime(requested_time, Number(service_duration));
      
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          nome: customer_name,
          email: customer_email,
          telefono: customer_phone,
          data: requested_date,
          orarioInizio: requested_time,
          orarioFine: endTime,
          prezzo: service_price,
          servizio: service_name,
          status: 'Prenotato',
          team_id: team_member_id,
          salon_id: salon_id,
          note: `Prenotazione online auto-approvata - ${notes || ''}`,
        });

      if (orderError) {
        console.error('Error creating order:', orderError);
        // Non restituiamo errore qui perché la prenotazione è stata creata
      }
    }

    return NextResponse.json({
      success: true,
      booking,
      message: initialStatus === 'approved' 
        ? 'Prenotazione confermata con successo' 
        : 'Prenotazione inviata in attesa di approvazione'
    });

  } catch (error) {
    console.error('Error in online booking API:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const salon_id = searchParams.get('salon_id');
    const date = searchParams.get('date');
    const team_member_id = searchParams.get('team_member_id');
    const service_id = searchParams.get('service_id');

    if (!salon_id || !date) {
      return NextResponse.json(
        { error: 'salon_id e date sono richiesti' },
        { status: 400 }
      );
    }

    // Get salon web settings for opening hours
    const { data: webSettings, error: webSettingsError } = await supabase
      .from('salon_web_settings')
      .select('*')
      .eq('salon_id', salon_id)
      .single();

    if (webSettingsError) {
      console.error('Error fetching web settings:', webSettingsError);
    }

    // Parse opening hours - use any to access the field that might not be in types yet
    const openingHoursString = (webSettings as any)?.web_map_opening_hours || '';
    const openingHours = parseOpeningHours(openingHoursString);

    // Get service duration if service_id is provided
    let serviceDuration = 60; // Default duration
    if (service_id) {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('duration')
        .eq('id', Number(service_id))
        .single();

      if (!serviceError && service) {
        serviceDuration = Number(service.duration || 60);
      }
    }

    // Get existing bookings for the date
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('online_bookings')
      .select('requested_date, requested_time, service_duration, status')
      .eq('salon_id', salon_id)
      .eq('requested_date', date)
      .in('status', ['pending', 'approved']);

    if (bookingsError) {
      console.error('Error fetching existing bookings:', bookingsError);
    }

    // Generate available slots based on opening hours
    const availableSlots = generateAvailableSlotsForBooking(
      date!,
      openingHours,
      serviceDuration,
      existingBookings || []
    );

    // Get team members for availability
    const { data: teamMembers, error: teamError } = await supabase
      .from('team')
      .select('id, name, email')
      .eq('salon_id', salon_id)
      .eq('is_active', true)
      .eq('visible_users', true);

    if (teamError) {
      console.error('Error getting team members:', teamError);
    }

    // Populate available members for each slot
    const slotsWithMembers = availableSlots.map(slot => ({
      ...slot,
      available_members: teamMembers || [],
      total_available_members: (teamMembers || []).length
    }));

    return NextResponse.json({
      success: true,
      availableSlots: slotsWithMembers,
      openingHours: openingHours.filter(h => h.isOpen),
      services: [], // Services are loaded separately in the form
      teamMembers: teamMembers || []
    });

  } catch (error) {
    console.error('Error in online booking GET API:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 
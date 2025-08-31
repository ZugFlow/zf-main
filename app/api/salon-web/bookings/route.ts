import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Recupera slot disponibili per una data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salon_id');
    const date = searchParams.get('date');
    const serviceId = searchParams.get('service_id');
    const teamMemberId = searchParams.get('team_member_id');

    console.log('Bookings API - Request params:', { salonId, date, serviceId, teamMemberId });

    if (!salonId || !date) {
      return NextResponse.json(
        { error: 'salon_id e date sono obbligatori' },
        { status: 400 }
      );
    }

    // Recupera le impostazioni di prenotazione online
    console.log('Bookings API - Fetching online_booking_settings for salon:', salonId);
    let { data: settings, error: settingsError } = await supabaseAdmin
      .from('online_booking_settings')
      .select('*')
      .eq('salon_id', salonId)
      .single();

    console.log('Bookings API - Settings result:', { 
      settings: settings ? {
        salon_id: settings.salon_id,
        enabled: settings.enabled,
        allow_same_day_booking: settings.allow_same_day_booking,
        booking_start_time: settings.booking_start_time,
        booking_end_time: settings.booking_end_time,
        slot_duration: settings.slot_duration
      } : null, 
      error: settingsError 
    });

    if (settingsError) {
      console.error('Bookings API - Settings error:', settingsError);
      return NextResponse.json(
        { error: `Errore nel recupero impostazioni: ${settingsError.message}` },
        { status: 500 }
      );
    }

    // Verifica se le prenotazioni per lo stesso giorno sono abilitate
    const today = new Date().toISOString().split('T')[0];
    const isSameDay = date === today;
    
    console.log('Bookings API - Same day check:', {
      date,
      today,
      isSameDay,
      allow_same_day_booking: settings?.allow_same_day_booking
    });
    
    if (isSameDay && settings && settings.allow_same_day_booking === false) {
      console.log('Bookings API - Same day booking is disabled for this salon');
      return NextResponse.json({
        available_slots: [],
        settings: {
          slot_duration: settings.slot_duration,
          max_bookings_per_day: settings.max_bookings_per_day,
          min_notice_hours: settings.min_notice_hours,
          allow_same_day_booking: false
        },
        message: 'Prenotazioni per lo stesso giorno non sono abilitate per questo salone'
      });
    }

    // Recupera le impostazioni degli orari di lavoro del salone
    console.log('Bookings API - Fetching working hours for salon:', salonId);
    const { data: workingHours, error: workingHoursError } = await supabaseAdmin
      .from('hoursettings')
      .select('start_hour, finish_hour')
      .eq('salon_id', salonId)
      .is('user_id', null) // Solo orari generali del salone, non specifici per utente
      .single();

    console.log('Bookings API - Working hours result:', { 
      workingHours: workingHours ? {
        start_hour: workingHours.start_hour,
        finish_hour: workingHours.finish_hour
      } : null, 
      error: workingHoursError 
    });

    if (workingHoursError && workingHoursError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Bookings API - Working hours error:', workingHoursError);
      return NextResponse.json(
        { error: `Errore nel recupero orari di lavoro: ${workingHoursError.message}` },
        { status: 500 }
      );
    }

    // Se è specificato un membro del team, recupera i suoi orari specifici
    let teamMemberWorkingHours = null;
    if (teamMemberId) {
      console.log('Bookings API - Fetching team member working hours for:', teamMemberId);
      const { data: memberHours, error: memberHoursError } = await supabaseAdmin
        .from('hoursettings')
        .select('start_hour, finish_hour')
        .eq('salon_id', salonId)
        .eq('user_id', teamMemberId)
        .single();

      if (!memberHoursError && memberHours) {
        teamMemberWorkingHours = memberHours;
        console.log('Bookings API - Team member working hours:', teamMemberWorkingHours);
      }
    }

    if (!settings) {
      console.log('Bookings API - No settings found for salon:', salonId);
      
      // Crea impostazioni di default per questo salone
      console.log('Bookings API - Creating default settings for salon:', salonId);
      
      // Crea un oggetto con solo i campi base
      const defaultSettings: any = {
        salon_id: salonId,
        enabled: true
      };

      // Aggiungi campi opzionali se la tabella li supporta
      try {
        const { data: newSettings, error: createError } = await supabaseAdmin
          .from('online_booking_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) {
          console.error('Bookings API - Error creating default settings:', createError);
          return NextResponse.json(
            { error: 'Errore nella creazione delle impostazioni di default' },
            { status: 500 }
          );
        }

        console.log('Bookings API - Default settings created:', newSettings);
        settings = newSettings;
      } catch (error) {
        console.error('Bookings API - Error in settings creation:', error);
        // Se non riusciamo a creare le impostazioni, usa valori di default
        settings = {
          salon_id: salonId,
          enabled: true,
          booking_start_time: '09:00',
          booking_end_time: '18:00',
          slot_duration: 15
        };
      }
    }

    // Recupera il servizio se specificato
    let serviceDuration = 30; // default
    if (serviceId) {
      console.log('Bookings API - Fetching service:', serviceId);
      const { data: service, error: serviceError } = await supabaseAdmin
        .from('services')
        .select('duration')
        .eq('id', serviceId)
        .single();
      
      console.log('Bookings API - Service result:', { service, error: serviceError });
      
      if (service?.duration) {
        serviceDuration = service.duration;
      }
    }

    console.log('Bookings API - Generating slots with params:', {
      date,
      startTime: settings.booking_start_time,
      endTime: settings.booking_end_time,
      slotDuration: settings.slot_duration,
      serviceDuration
    });

    // Genera slot disponibili usando i campi corretti
    // Usa valori di default se i campi non esistono
    const startTime = teamMemberWorkingHours?.start_hour || workingHours?.start_hour || settings.booking_start_time || '09:00';
    const endTime = teamMemberWorkingHours?.finish_hour || workingHours?.finish_hour || settings.booking_end_time || '18:00';
    const slotDuration = settings.slot_duration || 15;

    console.log('Bookings API - Using settings:', {
      startTime,
      endTime,
      slotDuration,
      serviceDuration,
      workingHours: !!workingHours,
      teamMemberWorkingHours: !!teamMemberWorkingHours,
      settings_booking_start_time: settings?.booking_start_time,
      settings_booking_end_time: settings?.booking_end_time,
      settings_slot_duration: settings?.slot_duration
    });

    const availableSlots = await generateAvailableSlots(
      date,
      startTime,
      endTime,
      slotDuration,
      serviceDuration,
      salonId,
      teamMemberId,
      settings
    );

    console.log('Bookings API - Generated slots:', availableSlots);

    return NextResponse.json({
      available_slots: availableSlots,
      settings: {
        slot_duration: settings.slot_duration,
        max_bookings_per_day: settings.max_bookings_per_day,
        min_notice_hours: settings.min_notice_hours,
        allow_same_day_booking: settings.allow_same_day_booking
      }
    });

  } catch (error) {
    console.error('Errore nel recupero slot disponibili:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// POST - Crea una nuova prenotazione online
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      salon_id, 
      customer_name, 
      customer_email, 
      customer_phone,
      service_id,
      service_name,
      appointment_date,
      appointment_time,
      team_member_id,
      notes 
    } = body;

    // Validazione dei dati
    if (!salon_id || !customer_name || !customer_email || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: 'Dati mancanti per la prenotazione' },
        { status: 400 }
      );
    }

    // Verifica che il salone esista e abbia le prenotazioni abilitate
    const { data: salon, error: salonError } = await supabaseAdmin
      .from('salon_web_settings')
      .select('web_booking_enabled')
      .eq('salon_id', salon_id)
      .eq('web_enabled', true)
      .single();

    if (salonError || !salon) {
      return NextResponse.json(
        { error: 'Salone non trovato o pagina web non abilitata' },
        { status: 404 }
      );
    }

    if (!salon.web_booking_enabled) {
      return NextResponse.json(
        { error: 'Prenotazioni online non abilitate per questo salone' },
        { status: 403 }
      );
    }

    // Recupera l'IP del client
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Recupera durata e prezzo del servizio
    let serviceDuration = 30;
    let servicePrice = 0;
    
    if (service_id) {
      const { data: service } = await supabaseAdmin
        .from('services')
        .select('duration, price')
        .eq('id', service_id)
        .single();
      
      if (service) {
        serviceDuration = service.duration || 30;
        servicePrice = service.price || 0;
      }
    }

    // Calcola orario di fine
    const endTime = calculateEndTime(appointment_time, serviceDuration);

    // Crea la prenotazione direttamente nella tabella online_bookings
    const { data: bookingResult, error: bookingError } = await supabaseAdmin
      .from('online_bookings')
      .insert({
        salon_id: salon_id,
        customer_name: customer_name,
        customer_email: customer_email,
        customer_phone: customer_phone || null,
        requested_date: appointment_date,
        requested_time: appointment_time,
        booking_date: appointment_date,
        start_time: appointment_time,
        end_time: endTime,
        service_id: service_id || null,
        service_name: service_name || 'Servizio generico',
        service_duration: serviceDuration,
        service_price: servicePrice,
        team_member_id: team_member_id || null,
        status: 'pending',
        notes: notes || null,
        ip_address: ip,
        user_agent: userAgent
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Errore nella creazione prenotazione:', bookingError);
      return NextResponse.json(
        { error: 'Errore nella creazione della prenotazione' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking_id: bookingResult.id,
      message: 'Prenotazione creata con successo'
    });

  } catch (error) {
    console.error('Errore nella creazione prenotazione:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// PUT - Aggiorna lo stato di una prenotazione
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      booking_id, 
      status, 
      admin_notes 
    } = body;

    if (!booking_id || !status) {
      return NextResponse.json(
        { error: 'Booking ID e status sono obbligatori' },
        { status: 400 }
      );
    }

    let updateData: any = { status };

    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    const { data, error } = await supabaseAdmin
      .from('online_bookings')
      .update(updateData)
      .eq('id', booking_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento della prenotazione' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Prenotazione non trovata' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: data,
      message: 'Prenotazione aggiornata con successo'
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 

// Funzioni helper
async function generateAvailableSlots(
  date: string,
  startTime: string,
  endTime: string,
  slotDuration: number,
  serviceDuration: number,
  salonId: string,
  teamMemberId?: string | null,
  settings?: any
): Promise<string[]> {
  console.log('generateAvailableSlots - Input params:', {
    date,
    startTime,
    endTime,
    slotDuration,
    serviceDuration,
    salonId,
    teamMemberId,
    settings: !!settings
  });

  try {
    // Debug logging for slot generation
    console.log('generateAvailableSlots - Starting slot generation for date:', date);
    
    // Calcola il giorno della settimana
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato
    
    console.log('generateAvailableSlots - Day of week:', dayOfWeek, '(0=Sunday, 1=Monday, ..., 6=Saturday)');

    // Recupera tutti i membri del team del salone
    const { data: teamMembers, error: teamError } = await supabaseAdmin
      .from('team')
      .select('id, name, user_id')
      .eq('salon_id', salonId)
      .eq('is_active', true);

    console.log('generateAvailableSlots - Team members query:', {
      salonId,
      teamMembers: teamMembers?.length || 0,
      error: teamError
    });

    if (teamError) {
      console.error('generateAvailableSlots - Error fetching team members:', teamError);
      return [];
    }

    if (!teamMembers || teamMembers.length === 0) {
      console.log('generateAvailableSlots - No team members found for salon:', salonId);
      return [];
    }

    console.log('generateAvailableSlots - Team members:', teamMembers);

    // Filtra i membri del team se è specificato uno specifico
    const availableTeamMembers = teamMemberId 
      ? teamMembers.filter(member => member.id === teamMemberId)
      : teamMembers;

    if (availableTeamMembers.length === 0) {
      console.log('generateAvailableSlots - No available team members after filtering');
      return [];
    }

    // Recupera gli orari di lavoro per il giorno specifico dalla tabella working_hours
    console.log('generateAvailableSlots - Fetching working hours for day:', dayOfWeek);
    const { data: workingHours, error: workingHoursError } = await supabaseAdmin
      .from('working_hours')
      .select('team_member_id, start_time, end_time, is_active')
      .eq('salon_id', salonId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (workingHoursError) {
      console.error('generateAvailableSlots - Error fetching working hours:', workingHoursError);
      return [];
    }

    console.log('generateAvailableSlots - Working hours for day', dayOfWeek, ':', workingHours);

    // Se non ci sono orari di lavoro configurati per questo giorno, non ci sono slot disponibili
    if (!workingHours || workingHours.length === 0) {
      console.log('generateAvailableSlots - No working hours configured for day', dayOfWeek);
      return [];
    }

    // Filtra i membri del team che hanno orari di lavoro per questo giorno
    const membersWithWorkingHours = availableTeamMembers.filter(member => 
      workingHours.some(wh => wh.team_member_id === member.id)
    );

    if (membersWithWorkingHours.length === 0) {
      console.log('generateAvailableSlots - No team members have working hours for day', dayOfWeek);
      return [];
    }

    console.log('generateAvailableSlots - Members with working hours:', membersWithWorkingHours);

    // Recupera gli appuntamenti esistenti per questa data e salone
    const { data: existingAppointments, error: appointmentsError } = await supabaseAdmin
      .from('orders')
      .select('orarioInizio, orarioFine, team_id, status')
      .eq('data', date)
      .eq('salon_id', salonId)
      .neq('status', 'Eliminato') // Esclude appuntamenti eliminati
      .neq('status', 'Annullato'); // Esclude appuntamenti annullati

    if (appointmentsError) {
      console.error('generateAvailableSlots - Error fetching existing appointments:', appointmentsError);
      return [];
    }

    // Recupera anche le prenotazioni online esistenti per questa data e salone
    const { data: existingOnlineBookings, error: onlineBookingsError } = await supabaseAdmin
      .from('online_bookings')
      .select('start_time, end_time, team_member_id, status')
      .eq('booking_date', date)
      .eq('salon_id', salonId)
      .in('status', ['pending', 'confirmed']); // Solo prenotazioni attive

    if (onlineBookingsError) {
      console.error('generateAvailableSlots - Error fetching existing online bookings:', onlineBookingsError);
      return [];
    }

    console.log('generateAvailableSlots - Existing appointments:', existingAppointments);
    console.log('generateAvailableSlots - Existing online bookings:', existingOnlineBookings);

    // Recupera permessi e ferie per questa data
    let timeOffQuery = supabaseAdmin
      .from('permessiferie')
      .select('start_date, end_date, start_time, end_time, member_id, status')
      .eq('salon_id', salonId)
      .eq('status', 'approved')
      .lte('start_date', date)
      .gte('end_date', date);

    const { data: timeOff, error: timeOffError } = await timeOffQuery;

    if (timeOffError) {
      console.error('generateAvailableSlots - Error fetching time off:', timeOffError);
      return [];
    }

    console.log('generateAvailableSlots - Time off data:', timeOff);

    // Genera tutti i possibili slot basati sugli orari di lavoro configurati
    const allSlots: string[] = [];
    
    // Usa gli orari di lavoro configurati invece degli orari di default
    const workingHoursForMembers = workingHours.filter(wh => 
      membersWithWorkingHours.some(member => member.id === wh.team_member_id)
    );

    if (workingHoursForMembers.length === 0) {
      console.log('generateAvailableSlots - No working hours found for available team members');
      return [];
    }

    // Trova l'orario di inizio e fine più ampio tra tutti i membri del team
    const earliestStart = workingHoursForMembers.reduce((earliest, wh) => 
      wh.start_time < earliest ? wh.start_time : earliest, 
      workingHoursForMembers[0].start_time
    );
    
    const latestEnd = workingHoursForMembers.reduce((latest, wh) => 
      wh.end_time > latest ? wh.end_time : latest, 
      workingHoursForMembers[0].end_time
    );

    console.log('generateAvailableSlots - Using working hours range:', {
      earliestStart,
      latestEnd,
      slotDuration
    });

    const [startHour, startMinute] = earliestStart.split(':').map(Number);
    const [endHour, endMinute] = latestEnd.split(':').map(Number);

    console.log('generateAvailableSlots - Parsed times:', {
      startHour,
      startMinute,
      endHour,
      endMinute
    });

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const slotTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      allSlots.push(slotTime);

      // Avanza al prossimo slot
      currentMinute += slotDuration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    console.log('generateAvailableSlots - All possible slots:', allSlots);

    // Filtra gli slot occupati considerando la disponibilità di ogni membro del team
    const availableSlots = allSlots.filter(slotTime => {
      // Calcola l'orario di fine per questo slot considerando la durata del servizio
      const slotEndTime = calculateEndTime(slotTime, serviceDuration);
      
      // Verifica se almeno un membro del team è disponibile in questo slot
      const hasAvailableTeamMember = membersWithWorkingHours.some(teamMember => {
        // Trova gli orari di lavoro per questo membro del team
        const memberWorkingHours = workingHours.find(wh => wh.team_member_id === teamMember.id);
        
        if (!memberWorkingHours) {
          console.log(`generateAvailableSlots - No working hours found for team member ${teamMember.name}`);
          return false;
        }

        // Verifica se lo slot è all'interno degli orari di lavoro del membro
        if (slotTime < memberWorkingHours.start_time || slotEndTime > memberWorkingHours.end_time) {
          console.log(`generateAvailableSlots - Slot ${slotTime}-${slotEndTime} outside working hours ${memberWorkingHours.start_time}-${memberWorkingHours.end_time} for ${teamMember.name}`);
          return false;
        }

        // Verifica se il membro del team ha permessi/ferie
        const hasTimeOff = timeOff?.some(off => 
          off.member_id === teamMember.id
        );

        if (hasTimeOff) {
          console.log(`generateAvailableSlots - Team member ${teamMember.name} has time off`);
          return false;
        }

        // Verifica se il membro del team ha appuntamenti in questo slot
        const hasAppointment = existingAppointments?.some(appointment => {
          if (appointment.team_id !== teamMember.id) {
            return false;
          }

          // Verifica sovrapposizione temporale
          const appointmentStart = appointment.orarioInizio;
          const appointmentEnd = appointment.orarioFine;
          
          // Due intervalli si sovrappongono se:
          // slotStart < appointmentEnd AND appointmentStart < slotEnd
          return slotTime < appointmentEnd && appointmentStart < slotEndTime;
        });

        if (hasAppointment) {
          console.log(`generateAvailableSlots - Team member ${teamMember.name} has appointment at ${slotTime}`);
          return false;
        }

        // Verifica se il membro del team ha prenotazioni online in questo slot
        const hasOnlineBooking = existingOnlineBookings?.some(onlineBooking => {
          if (onlineBooking.team_member_id !== teamMember.id) {
            return false;
          }

          // Verifica sovrapposizione temporale
          const bookingStart = onlineBooking.start_time;
          const bookingEnd = onlineBooking.end_time;
          
          // Due intervalli si sovrappongono se:
          // slotStart < bookingEnd AND bookingStart < slotEnd
          return slotTime < bookingEnd && bookingStart < slotEndTime;
        });

        if (hasOnlineBooking) {
          console.log(`generateAvailableSlots - Team member ${teamMember.name} has online booking at ${slotTime}`);
          return false;
        }

        // Se arriviamo qui, il membro del team è disponibile
        console.log(`generateAvailableSlots - Team member ${teamMember.name} is available at ${slotTime}`);
        return true;
      });

      return hasAvailableTeamMember;
    });

    console.log('generateAvailableSlots - Available slots after filtering:', availableSlots);
    return availableSlots;
  } catch (error) {
    console.error('generateAvailableSlots - Error:', error);
    return [];
  }
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
} 
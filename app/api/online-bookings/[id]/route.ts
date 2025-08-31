import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    const { action } = body; // 'approve' o 'reject'
    const bookingId = params.id;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Azione non valida' },
        { status: 400 }
      );
    }

    // Recupera la prenotazione
    const { data: booking, error: fetchError } = await supabase
      .from('online_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Prenotazione non trovata' },
        { status: 404 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Aggiorna lo status della prenotazione
    const { error: updateError } = await supabase
      .from('online_bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento della prenotazione' },
        { status: 500 }
      );
    }

    // Se approvata, crea l'appuntamento nella tabella orders
    if (action === 'approve') {
      const endTime = calculateEndTime(booking.requested_time, booking.service_duration);
      
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          nome: booking.customer_name,
          email: booking.customer_email,
          telefono: booking.customer_phone,
          data: booking.requested_date,
          orarioInizio: booking.requested_time,
          orarioFine: endTime,
          prezzo: booking.service_price,
          status: 'Prenotato',
          team_id: booking.team_member_id,
          salon_id: booking.salon_id,
          note: `Prenotazione online approvata - ${booking.notes || ''}`,
        });

      if (orderError) {
        console.error('Error creating order:', orderError);
        return NextResponse.json(
          { error: 'Prenotazione approvata ma errore nella creazione dell\'appuntamento' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Prenotazione approvata con successo' 
        : 'Prenotazione rifiutata con successo'
    });

  } catch (error) {
    console.error('Error in booking action API:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const bookingId = params.id;

    // Verifica se la prenotazione esiste
    const { data: booking, error: fetchError } = await supabase
      .from('online_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Prenotazione non trovata' },
        { status: 404 }
      );
    }

    // Elimina la prenotazione
    const { error: deleteError } = await supabase
      .from('online_bookings')
      .delete()
      .eq('id', bookingId);

    if (deleteError) {
      console.error('Error deleting booking:', deleteError);
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione della prenotazione' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Prenotazione eliminata con successo'
    });

  } catch (error) {
    console.error('Error in booking delete API:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
} 
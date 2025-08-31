import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Recupera i messaggi di contatto di un salone
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salon_id');
    const status = searchParams.get('status'); // 'unread', 'read', 'replied'
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!salonId) {
      return NextResponse.json(
        { error: 'Salon ID richiesto' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('web_contact_messages')
      .select('*')
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false });

    if (status === 'unread') {
      query = query.eq('is_read', false);
    } else if (status === 'read') {
      query = query.eq('is_read', true).eq('is_replied', false);
    } else if (status === 'replied') {
      query = query.eq('is_replied', true);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Errore nel recupero dei messaggi' },
        { status: 500 }
      );
    }

    return NextResponse.json(messages || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// POST - Crea un nuovo messaggio di contatto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      salon_id, 
      customer_name, 
      customer_email, 
      customer_phone,
      subject,
      message 
    } = body;

    if (!salon_id || !customer_name || !customer_email || !message) {
      return NextResponse.json(
        { error: 'Dati mancanti per il messaggio' },
        { status: 400 }
      );
    }

    // Verifica che il salone esista e abbia il form di contatto abilitato
    const { data: salon, error: salonError } = await supabaseAdmin
      .from('salon_web_settings')
      .select('web_contact_form_enabled')
      .eq('salon_id', salon_id)
      .eq('web_enabled', true)
      .single();

    if (salonError || !salon) {
      return NextResponse.json(
        { error: 'Salone non trovato o form di contatto non abilitato' },
        { status: 404 }
      );
    }

    if (!salon.web_contact_form_enabled) {
      return NextResponse.json(
        { error: 'Form di contatto non abilitato per questo salone' },
        { status: 403 }
      );
    }

    // Recupera l'IP del client
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Crea il messaggio
    const { data: contactMessage, error: messageError } = await supabaseAdmin
      .from('web_contact_messages')
      .insert({
        salon_id,
        customer_name,
        customer_email,
        customer_phone,
        subject: subject || 'Messaggio dal sito web',
        message,
        ip_address: ip,
        user_agent: userAgent,
        is_read: false,
        is_replied: false
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating contact message:', messageError);
      return NextResponse.json(
        { error: 'Errore nella creazione del messaggio' },
        { status: 500 }
      );
    }

    // TODO: Invia email di notifica al salone
    // TODO: Invia email di conferma al cliente

    return NextResponse.json({
      success: true,
      message_id: contactMessage.id,
      message: 'Messaggio inviato con successo'
    });

  } catch (error) {
    console.error('Error creating contact message:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// PUT - Marca un messaggio come letto o risposto
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message_id, 
      action, // 'mark_read' o 'mark_replied'
      admin_notes 
    } = body;

    if (!message_id || !action) {
      return NextResponse.json(
        { error: 'Message ID e action sono obbligatori' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    if (action === 'mark_read') {
      updateData.is_read = true;
      updateData.read_at = new Date().toISOString();
    } else if (action === 'mark_replied') {
      updateData.is_replied = true;
      updateData.replied_at = new Date().toISOString();
    } else {
      return NextResponse.json(
        { error: 'Action non valida. Usa "mark_read" o "mark_replied"' },
        { status: 400 }
      );
    }

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    const { data, error } = await supabaseAdmin
      .from('web_contact_messages')
      .update(updateData)
      .eq('id', message_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating message:', error);
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento del messaggio' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Messaggio non trovato' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data,
      message_text: 'Messaggio aggiornato con successo'
    });

  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina un messaggio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('message_id');

    if (!messageId) {
      return NextResponse.json(
        { error: 'message_id richiesto' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('web_contact_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Errore nell\'eliminazione messaggio:', error);
      return NextResponse.json(
        { error: 'Errore nell\'eliminazione del messaggio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Messaggio eliminato con successo'
    });

  } catch (error) {
    console.error('Errore nell\'eliminazione messaggio:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 
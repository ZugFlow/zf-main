import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Invia un messaggio di contatto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      salon_id, 
      name, 
      email, 
      phone, 
      subject, 
      message 
    } = body;

    // Validazione dei dati
    if (!salon_id || !name || !email || !message) {
      return NextResponse.json(
        { error: 'Dati mancanti per il messaggio' },
        { status: 400 }
      );
    }

    // Verifica che il salone esista e abbia il form di contatto abilitato
    const { data: salon, error: salonError } = await supabaseAdmin
      .from('salon_web_settings')
      .select('web_contact_form_enabled, web_contact_email')
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

    // Salva il messaggio
    const { data: contactMessage, error: messageError } = await supabaseAdmin
      .from('web_contact_messages')
      .insert({
        salon_id,
        name,
        email,
        phone,
        subject,
        message,
        ip_address: ip,
        user_agent: userAgent
      })
      .select()
      .single();

    if (messageError) {
      console.error('Errore nel salvataggio messaggio:', messageError);
      return NextResponse.json(
        { error: 'Errore nell\'invio del messaggio' },
        { status: 500 }
      );
    }

    // TODO: Invia email di notifica al salone
    // TODO: Invia email di conferma al mittente

    return NextResponse.json({
      success: true,
      message_id: contactMessage.id,
      message: 'Messaggio inviato con successo'
    });

  } catch (error) {
    console.error('Errore nell\'invio messaggio:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 
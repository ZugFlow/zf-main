import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Recupera le statistiche di un salone
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salon_id');
    const period = searchParams.get('period') || '30'; // giorni

    if (!salonId) {
      return NextResponse.json(
        { error: 'Salon ID richiesto' },
        { status: 400 }
      );
    }

    // Calcola la data di inizio del periodo
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Recupera le statistiche
    const [visitsResult, bookingsResult, messagesResult, testimonialsResult] = await Promise.all([
      // Visite alla pagina
      supabaseAdmin
        .from('web_analytics')
        .select('*')
        .eq('salon_id', salonId)
        .gte('visit_date', startDate.toISOString()),
      
      // Prenotazioni online
      supabaseAdmin
        .from('web_bookings')
        .select('*')
        .eq('salon_id', salonId)
        .gte('created_at', startDate.toISOString()),
      
      // Messaggi di contatto
      supabaseAdmin
        .from('web_contact_messages')
        .select('*')
        .eq('salon_id', salonId)
        .gte('created_at', startDate.toISOString()),
      
      // Testimonial
      supabaseAdmin
        .from('salon_testimonials')
        .select('*')
        .eq('salon_id', salonId)
        .gte('created_at', startDate.toISOString())
    ]);

    if (visitsResult.error || bookingsResult.error || messagesResult.error || testimonialsResult.error) {
      console.error('Error fetching analytics:', {
        visits: visitsResult.error,
        bookings: bookingsResult.error,
        messages: messagesResult.error,
        testimonials: testimonialsResult.error
      });
      return NextResponse.json(
        { error: 'Errore nel recupero delle statistiche' },
        { status: 500 }
      );
    }

    // Calcola le statistiche
    const visits = visitsResult.data || [];
    const bookings = bookingsResult.data || [];
    const messages = messagesResult.data || [];
    const testimonials = testimonialsResult.data || [];

    // Statistiche per giorno
    const dailyStats: Record<string, {
      visits: number;
      bookings: number;
      messages: number;
      testimonials: number;
    }> = {};
    const today = new Date();
    
    for (let i = 0; i < parseInt(period); i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      dailyStats[dateStr] = {
        visits: visits.filter(v => v.visit_date.startsWith(dateStr)).length,
        bookings: bookings.filter(b => b.created_at.startsWith(dateStr)).length,
        messages: messages.filter(m => m.created_at.startsWith(dateStr)).length,
        testimonials: testimonials.filter(t => t.created_at.startsWith(dateStr)).length
      };
    }

    // Statistiche totali
    const totalStats = {
      total_visits: visits.length,
      total_bookings: bookings.length,
      total_messages: messages.length,
      total_testimonials: testimonials.length,
      approved_testimonials: testimonials.filter(t => t.is_approved).length,
      pending_testimonials: testimonials.filter(t => !t.is_approved).length,
      confirmed_bookings: bookings.filter(b => b.status === 'confirmed').length,
      pending_bookings: bookings.filter(b => b.status === 'pending').length,
      conversion_rate: visits.length > 0 ? ((bookings.length / visits.length) * 100).toFixed(2) : '0'
    };

    // Statistiche per fonte di traffico
    const trafficSources: Record<string, number> = {};
    visits.forEach(visit => {
      const source = visit.referrer || 'direct';
      trafficSources[source] = (trafficSources[source] || 0) + 1;
    });

    // Statistiche per dispositivo
    const deviceStats: Record<string, number> = {};
    visits.forEach(visit => {
      const device = visit.user_agent?.includes('Mobile') ? 'mobile' : 'desktop';
      deviceStats[device] = (deviceStats[device] || 0) + 1;
    });

    return NextResponse.json({
      period: parseInt(period),
      start_date: startDate.toISOString(),
      daily_stats: dailyStats,
      total_stats: totalStats,
      traffic_sources: trafficSources,
      device_stats: deviceStats
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// POST - Registra una visita alla pagina
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      salon_id, 
      page_url, 
      referrer, 
      user_agent, 
      ip_address 
    } = body;

    if (!salon_id || !page_url) {
      return NextResponse.json(
        { error: 'Salon ID e URL pagina sono obbligatori' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc('record_page_visit', {
      p_salon_id: salon_id,
      p_page_url: page_url,
      p_referrer: referrer,
      p_user_agent: user_agent,
      p_ip_address: ip_address
    });

    if (error) {
      console.error('Error recording page visit:', error);
      return NextResponse.json(
        { error: 'Errore nella registrazione della visita' },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 
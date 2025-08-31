import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Recupera i dati di un salone per la pagina web
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');
    const domain = searchParams.get('domain');
    const debug = searchParams.get('debug');

    console.log('API Salon Web - Request params:', { subdomain, domain, debug });

    if (!subdomain && !domain) {
      console.log('API Salon Web - Missing subdomain or domain');
      return NextResponse.json(
        { error: 'Subdomain o domain richiesto' },
        { status: 400 }
      );
    }

    // Prima recupera le impostazioni web del salone
    let webSettingsQuery = supabaseAdmin
      .from('salon_web_settings')
      .select('*')
      .eq('web_enabled', true);

    if (subdomain) {
      webSettingsQuery = webSettingsQuery.eq('web_subdomain', subdomain);
    } else if (domain) {
      webSettingsQuery = webSettingsQuery.eq('web_domain', domain);
    }

    const { data: webSettings, error: webSettingsError } = await webSettingsQuery.single();

    console.log('API Salon Web - Web settings result:', { webSettings: !!webSettings, error: webSettingsError });

    if (webSettingsError) {
      console.error('API Salon Web - Database error:', webSettingsError);
      return NextResponse.json(
        { error: 'Errore nel database' },
        { status: 500 }
      );
    }

    if (!webSettings) {
      console.log('API Salon Web - Salon not found');
      return NextResponse.json(
        { error: 'Salone non trovato o pagina web non abilitata' },
        { status: 404 }
      );
    }

    // Ora recupera i dati correlati usando il salon_id
    const salonId = webSettings.salon_id;

    // Se debug=true, restituisci solo informazioni sui servizi
    if (debug === 'true') {
      const { data: allServices, error: allServicesError } = await supabaseAdmin
        .from('services')
        .select('*')
        .eq('salon_id', salonId);

      const { data: visibleServices, error: visibleServicesError } = await supabaseAdmin
        .from('services')
        .select('*')
        .eq('salon_id', salonId)
        .eq('status', 'Attivo')
        .eq('visible_online', true);

      const { data: bookingServices, error: bookingServicesError } = await supabaseAdmin
        .from('services')
        .select('*')
        .eq('salon_id', salonId)
        .eq('status', 'Attivo')
        .eq('visible_online', true)
        .eq('online_booking_enabled', true);

      return NextResponse.json({
        salon_id: salonId,
        all_services_count: allServices?.length || 0,
        visible_services_count: visibleServices?.length || 0,
        booking_services_count: bookingServices?.length || 0,
        all_services: allServices,
        visible_services: visibleServices,
        booking_services: bookingServices,
        errors: {
          all_services: allServicesError,
          visible_services: visibleServicesError,
          booking_services: bookingServicesError
        }
      });
    }

    // Recupera team, servizi, gallerie, testimonial e impostazioni prenotazioni in parallelo
    const [teamResult, servicesResult, galleriesResult, testimonialsResult, bookingSettingsResult] = await Promise.all([
      supabaseAdmin
        .from('team')
        .select('id, name, avatar_url, role, is_active')
        .eq('salon_id', salonId)
        .eq('is_active', true),
      
      supabaseAdmin
        .from('services')
        .select('id, name, description, price, duration, category, status, visible_online, online_booking_enabled')
        .eq('salon_id', salonId)
        .eq('status', 'Attivo')
        .eq('visible_online', true)
        .eq('online_booking_enabled', true),
      
      supabaseAdmin
        .from('salon_galleries')
        .select('id, title, description, image_url, image_alt, category, sort_order, is_active')
        .eq('salon_id', salonId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabaseAdmin
        .from('salon_testimonials')
        .select('id, client_name, rating, comment, service_name, is_approved, is_featured')
        .eq('salon_id', salonId)
        .eq('is_approved', true)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false }),
      
      supabaseAdmin
        .from('online_booking_settings')
        .select('allow_same_day_booking')
        .eq('salon_id', salonId)
        .single()
    ]);

    console.log('API Salon Web - Query results:', {
      team: { data: teamResult.data?.length || 0, error: teamResult.error },
      services: { data: servicesResult.data?.length || 0, error: servicesResult.error },
      galleries: { data: galleriesResult.data?.length || 0, error: galleriesResult.error },
      testimonials: { data: testimonialsResult.data?.length || 0, error: testimonialsResult.error },
      booking_settings: { data: bookingSettingsResult.data, error: bookingSettingsResult.error }
    });

    // Debug specifico per servizi
    if (servicesResult.error) {
      console.error('API Salon Web - Services query error:', servicesResult.error);
    } else {
      console.log('API Salon Web - Services found:', servicesResult.data?.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        status: s.status,
        visible_online: s.visible_online
      })));
    }

    // Combina tutti i dati
    const salonData = {
      ...webSettings,
      team: teamResult.data || [],
      services: servicesResult.data || [],
      galleries: galleriesResult.data || [],
      testimonials: testimonialsResult.data || [],
      booking_settings: bookingSettingsResult.data || { allow_same_day_booking: true }
    };

    console.log('API Salon Web - Returning data for salon:', salonId, {
      team_count: salonData.team.length,
      services_count: salonData.services.length,
      galleries_count: salonData.galleries.length,
      testimonials_count: salonData.testimonials.length
    });

    return NextResponse.json(salonData);
  } catch (error) {
    console.error('API Salon Web - Unexpected error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 
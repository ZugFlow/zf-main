import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salon_id');

    if (!salonId) {
      return NextResponse.json({ error: 'salon_id required' }, { status: 400 });
    }

    // Check all the data that might be missing
    const [
      webSettings,
      bookingSettings,
      teamMembers,
      workingHours,
      services,
      salonData
    ] = await Promise.all([
      supabaseAdmin
        .from('salon_web_settings')
        .select('*')
        .eq('salon_id', salonId)
        .single(),
      
      supabaseAdmin
        .from('online_booking_settings')
        .select('*')
        .eq('salon_id', salonId)
        .single(),
      
      supabaseAdmin
        .from('team')
        .select('id, name, user_id, is_active')
        .eq('salon_id', salonId)
        .eq('is_active', true),
      
      supabaseAdmin
        .from('hoursettings')
        .select('start_hour, finish_hour')
        .eq('salon_id', salonId)
        .single(),
      
      supabaseAdmin
        .from('services')
        .select('id, name, duration, status, visible_online, online_booking_enabled')
        .eq('salon_id', salonId)
        .eq('status', 'Attivo')
        .eq('visible_online', true)
        .eq('online_booking_enabled', true),
      
      supabaseAdmin
        .from('salon')
        .select('id, name, user_id')
        .eq('id', salonId)
        .single()
    ]);

    return NextResponse.json({
      salon_id: salonId,
      web_settings: {
        exists: !!webSettings.data,
        error: webSettings.error,
        data: webSettings.data
      },
      booking_settings: {
        exists: !!bookingSettings.data,
        error: bookingSettings.error,
        data: bookingSettings.data
      },
      team_members: {
        count: teamMembers.data?.length || 0,
        error: teamMembers.error,
        data: teamMembers.data
      },
      working_hours: {
        exists: !!workingHours.data,
        error: workingHours.error,
        data: workingHours.data
      },
      services: {
        count: services.data?.length || 0,
        error: services.error,
        data: services.data
      },
      salon: {
        exists: !!salonData.data,
        error: salonData.error,
        data: salonData.data
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
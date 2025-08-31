import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data: webSettings, error } = await supabaseAdmin
      .from('salon_web_settings')
      .select('salon_id, web_subdomain, web_domain, web_enabled')
      .eq('web_enabled', true);

    if (error) {
      console.error('List API error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      count: webSettings?.length || 0,
      salons: webSettings || []
    });

  } catch (error) {
    console.error('List API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
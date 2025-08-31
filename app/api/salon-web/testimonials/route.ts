import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Recupera i testimonial di un salone
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salon_id');
    const approved = searchParams.get('approved');
    const featured = searchParams.get('featured');

    if (!salonId) {
      return NextResponse.json(
        { error: 'Salon ID richiesto' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('salon_testimonials')
      .select('*')
      .eq('salon_id', salonId);

    if (approved === 'true') {
      query = query.eq('is_approved', true);
    } else if (approved === 'false') {
      query = query.eq('is_approved', false);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    query = query.order('is_featured', { ascending: false })
                 .order('rating', { ascending: false })
                 .order('created_at', { ascending: false });

    const { data: testimonials, error } = await query;

    if (error) {
      console.error('Error fetching testimonials:', error);
      return NextResponse.json(
        { error: 'Errore nel recupero dei testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json(testimonials || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// POST - Aggiunge un nuovo testimonial
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      salon_id, 
      client_name, 
      client_email, 
      rating = 5, 
      comment, 
      service_name 
    } = body;

    if (!salon_id || !client_name || !comment) {
      return NextResponse.json(
        { error: 'Salon ID, nome cliente e commento sono obbligatori' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc('add_testimonial', {
      p_salon_id: salon_id,
      p_client_name: client_name,
      p_client_email: client_email,
      p_rating: rating,
      p_comment: comment,
      p_service_name: service_name
    });

    if (error) {
      console.error('Error adding testimonial:', error);
      return NextResponse.json(
        { error: 'Errore nell\'aggiunta del testimonial' },
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

// PUT - Approva/disapprova un testimonial
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      testimonial_id, 
      is_approved = true, 
      is_featured = false 
    } = body;

    if (!testimonial_id) {
      return NextResponse.json(
        { error: 'Testimonial ID richiesto' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc('approve_testimonial', {
      p_testimonial_id: testimonial_id,
      p_is_approved: is_approved,
      p_is_featured: is_featured
    });

    if (error) {
      console.error('Error approving testimonial:', error);
      return NextResponse.json(
        { error: 'Errore nell\'approvazione del testimonial' },
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

// DELETE - Elimina un testimonial
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testimonialId = searchParams.get('testimonial_id');

    if (!testimonialId) {
      return NextResponse.json(
        { error: 'Testimonial ID richiesto' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc('delete_testimonial', {
      p_testimonial_id: testimonialId
    });

    if (error) {
      console.error('Error deleting testimonial:', error);
      return NextResponse.json(
        { error: 'Errore nell\'eliminazione del testimonial' },
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
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Recupera le immagini della galleria di un salone
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salon_id');
    const category = searchParams.get('category');

    if (!salonId) {
      return NextResponse.json(
        { error: 'Salon ID richiesto' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('salon_galleries')
      .select('*')
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: galleries, error } = await query;

    if (error) {
      console.error('Error fetching galleries:', error);
      return NextResponse.json(
        { error: 'Errore nel recupero della galleria' },
        { status: 500 }
      );
    }

    return NextResponse.json(galleries || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// POST - Aggiunge una nuova immagine alla galleria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      salon_id, 
      title, 
      description, 
      image_url, 
      image_alt, 
      category = 'general',
      sort_order = 0 
    } = body;

    if (!salon_id || !title || !image_url) {
      return NextResponse.json(
        { error: 'Salon ID, titolo e URL immagine sono obbligatori' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc('add_gallery_image', {
      p_salon_id: salon_id,
      p_title: title,
      p_description: description,
      p_image_url: image_url,
      p_image_alt: image_alt,
      p_category: category,
      p_sort_order: sort_order
    });

    if (error) {
      console.error('Error adding gallery image:', error);
      return NextResponse.json(
        { error: 'Errore nell\'aggiunta dell\'immagine' },
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

// PUT - Aggiorna un'immagine della galleria
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      gallery_id, 
      title, 
      description, 
      image_url, 
      image_alt, 
      category,
      sort_order,
      is_active 
    } = body;

    if (!gallery_id) {
      return NextResponse.json(
        { error: 'Gallery ID richiesto' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc('update_gallery_image', {
      p_gallery_id: gallery_id,
      p_title: title,
      p_description: description,
      p_image_url: image_url,
      p_image_alt: image_alt,
      p_category: category,
      p_sort_order: sort_order,
      p_is_active: is_active
    });

    if (error) {
      console.error('Error updating gallery image:', error);
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento dell\'immagine' },
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

// DELETE - Elimina un'immagine dalla galleria
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const galleryId = searchParams.get('gallery_id');

    if (!galleryId) {
      return NextResponse.json(
        { error: 'Gallery ID richiesto' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc('delete_gallery_image', {
      p_gallery_id: galleryId
    });

    if (error) {
      console.error('Error deleting gallery image:', error);
      return NextResponse.json(
        { error: 'Errore nell\'eliminazione dell\'immagine' },
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
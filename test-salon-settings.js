const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestSettings() {
  try {
    // First, let's get a salon_id from the profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('salon_id')
      .not('salon_id', 'is', null)
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('No profiles with salon_id found');
      return;
    }

    const salonId = profiles[0].salon_id;

    // Create test web settings
    const { data, error } = await supabase
      .from('salon_web_settings')
      .upsert({
        salon_id: salonId,
        web_enabled: true,
        web_subdomain: 'test',
        web_title: 'Salon di Test',
        web_description: 'Un salone di bellezza professionale per test',
        web_logo_url: null,
        web_primary_color: '#ff6b6b',
        web_secondary_color: '#4ecdc4',
        web_theme: 'modern',
        web_booking_enabled: true,
        web_services_visible: true,
        web_team_visible: true,
        web_gallery_visible: true,
        web_testimonials_visible: true,
        web_contact_form_enabled: true,
        web_social_facebook: 'https://facebook.com/testsalon',
        web_social_instagram: 'https://instagram.com/testsalon',
        web_social_twitter: 'https://twitter.com/testsalon',
        web_contact_email: 'info@testsalon.com',
        web_contact_phone: '+39 123 456 789',
        web_address: 'Via Roma 123, Milano, Italia',
        web_meta_title: 'Salon di Test - Bellezza Professionale',
        web_meta_description: 'Scopri i nostri servizi di bellezza professionali a Milano',
        web_meta_keywords: 'salon, bellezza, milano, parrucchiere, estetista',
        web_animation_enabled: true,
        web_transition_speed: 'normal',
        web_show_back_to_top: true,
        web_layout_style: 'default',
        web_header_style: 'default',
        web_footer_style: 'default',
        web_custom_font: 'sans-serif',
        web_font_size: 'medium',
        web_border_radius: 'medium',
        web_shadow_style: 'medium'
      }, {
        onConflict: 'salon_id'
      });

    if (error) {
      console.error('Error creating test settings:', error);
    } else {
      console.log('Test settings created successfully:', data);
      console.log('You can now test the page at: http://localhost:3000/salon/test');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestSettings();

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running font family migration...');
    
    // Add the new font family columns
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE public.salon_web_settings
          ADD COLUMN IF NOT EXISTS web_title_font_family VARCHAR(20) DEFAULT 'default',
          ADD COLUMN IF NOT EXISTS web_subtitle_font_family VARCHAR(20) DEFAULT 'default',
          ADD COLUMN IF NOT EXISTS web_description_color VARCHAR(7) DEFAULT '#374151',
          ADD COLUMN IF NOT EXISTS web_description_font_family VARCHAR(20) DEFAULT 'default',
          ADD COLUMN IF NOT EXISTS web_button_size VARCHAR(10) DEFAULT 'medium',
          ADD COLUMN IF NOT EXISTS web_button_border_radius VARCHAR(10) DEFAULT 'medium',
          ADD COLUMN IF NOT EXISTS web_button_color VARCHAR(7) DEFAULT '#6366f1',
          ADD COLUMN IF NOT EXISTS web_button_border_color VARCHAR(7) DEFAULT '#6366f1',
          ADD COLUMN IF NOT EXISTS web_button_border_width VARCHAR(5) DEFAULT '1px',
          ADD COLUMN IF NOT EXISTS web_button_type VARCHAR(20) DEFAULT 'primary-secondary',
          ADD COLUMN IF NOT EXISTS web_button_quantity INTEGER DEFAULT 2,
          ADD COLUMN IF NOT EXISTS web_button_primary_text VARCHAR(50) DEFAULT 'Prenota Ora',
          ADD COLUMN IF NOT EXISTS web_button_secondary_text VARCHAR(50) DEFAULT 'Contattaci';
      `
    });

    if (error) {
      console.error('Migration error:', error);
    } else {
      console.log('Font family migration completed successfully!');
    }
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

runMigration();

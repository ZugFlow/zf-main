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
    console.log('Running font size migration...');
    
    // Add the new font size columns
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE public.salon_web_settings
          ADD COLUMN IF NOT EXISTS web_salon_name_font_size VARCHAR(20) DEFAULT 'large',
          ADD COLUMN IF NOT EXISTS web_subtitle_font_size VARCHAR(20) DEFAULT 'medium',
          ADD COLUMN IF NOT EXISTS web_studio_text_font_size VARCHAR(20) DEFAULT 'small',
          ADD COLUMN IF NOT EXISTS web_description_font_size VARCHAR(20) DEFAULT 'x-large';
      `
    });

    if (error) {
      console.error('Migration error:', error);
    } else {
      console.log('Font size migration completed successfully!');
    }
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

runMigration();

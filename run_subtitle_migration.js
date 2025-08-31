const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running subtitle migration...');
    
    // Add the web_subtitle column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.salon_web_settings 
        ADD COLUMN IF NOT EXISTS web_subtitle VARCHAR(255) NULL;
      `
    });

    if (alterError) {
      console.error('Error adding column:', alterError);
      return;
    }

    // Add comment
    const { error: commentError } = await supabase.rpc('exec_sql', {
      sql: `
        COMMENT ON COLUMN public.salon_web_settings.web_subtitle IS 'Subtitle for the salon web page, displayed below the main title';
      `
    });

    if (commentError) {
      console.error('Error adding comment:', commentError);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();

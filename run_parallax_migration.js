const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runParallaxMigration() {
  try {
    console.log('🚀 Starting parallax migration...')
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'utils/supabase/db/add_parallax_fields.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration SQL loaded')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      return
    }
    
    console.log('✅ Parallax migration completed successfully!')
    console.log('📋 Added fields:')
    console.log('   - web_parallax_enabled (boolean)')
    console.log('   - web_parallax_image (text)')
    console.log('   - web_parallax_speed (decimal)')
    console.log('   - web_parallax_opacity (decimal)')
    console.log('   - web_parallax_sections (text array)')
    
  } catch (error) {
    console.error('❌ Error running migration:', error)
  }
}

// Run the migration
runParallaxMigration()

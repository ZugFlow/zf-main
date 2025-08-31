// Script per eseguire la migrazione del team table
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configura il client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('🚀 Iniziando migrazione team table...');
    
    // Leggi il file SQL
    const sqlPath = path.join(__dirname, 'utils/supabase/db/add_missing_team_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Eseguendo query SQL...');
    
    // Esegui la migrazione
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Errore durante la migrazione:', error);
      return;
    }
    
    console.log('✅ Migrazione completata con successo!');
    console.log('📊 Risultati:', data);
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

// Esegui la migrazione
runMigration(); 
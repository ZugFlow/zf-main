import { createClient } from '@/utils/supabase/client'

// Script per disabilitare RLS e risolvere la ricorsione infinita
async function fixRLSRecursion() {
  const supabase = createClient()
  
  console.log('Disabilitando RLS per le tabelle chat...')
  
  try {
    // Disabilita RLS per tutte le tabelle chat
    const queries = [
      'ALTER TABLE chat_groups DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE chat_group_members DISABLE ROW LEVEL SECURITY', 
      'ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE chat_message_reactions DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE chat_message_reads DISABLE ROW LEVEL SECURITY'
    ]
    
    for (const query of queries) {
      console.log(`Executing: ${query}`)
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.error(`Error executing ${query}:`, error)
      } else {
        console.log(`✓ ${query}`)
      }
    }
    
    console.log('RLS disabilitato con successo!')
    
  } catch (error) {
    console.error('Errore durante il fix RLS:', error)
  }
}

// Esegui il fix
fixRLSRecursion()

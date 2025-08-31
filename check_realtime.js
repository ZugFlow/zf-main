// Script per verificare la configurazione Real-Time di Supabase
// Esegui questo script con: node check_realtime.js

import { createClient } from '@supabase/supabase-js'

// Configura con le tue credenziali
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili di ambiente mancanti')
  console.log('Assicurati che NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY siano configurate')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRealtimeConfig() {
  console.log('🔍 Verificando configurazione Real-Time...\n')
  
  // Test connessione generale
  try {
    const { data, error } = await supabase.from('team_members').select('count').limit(1)
    if (error) {
      console.error('❌ Errore connessione database:', error.message)
      return
    }
    console.log('✅ Connessione database OK')
  } catch (error) {
    console.error('❌ Errore connessione:', error.message)
    return
  }

  // Test subscription per chat_messages
  console.log('\n📡 Testando subscription per chat_messages...')
  
  const channel1 = supabase
    .channel('test_chat_messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages'
    }, (payload) => {
      console.log('✅ Ricevuto evento chat_messages:', payload)
    })
    .subscribe((status) => {
      console.log('📡 Stato subscription chat_messages:', status)
    })

  // Test subscription per direct_messages
  console.log('\n📡 Testando subscription per direct_messages...')
  
  const channel2 = supabase
    .channel('test_direct_messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages'
    }, (payload) => {
      console.log('✅ Ricevuto evento direct_messages:', payload)
    })
    .subscribe((status) => {
      console.log('📡 Stato subscription direct_messages:', status)
    })

  // Attendi 5 secondi per vedere i risultati
  setTimeout(() => {
    console.log('\n🔧 Per abilitare Real-Time nel dashboard Supabase:')
    console.log('1. Vai su dashboard.supabase.com')
    console.log('2. Seleziona il tuo progetto')
    console.log('3. Vai su Database > Replication')
    console.log('4. Abilita Real-time per le tabelle:')
    console.log('   - chat_messages')
    console.log('   - direct_messages')
    console.log('   - team_members (se necessario)')
    
    // Cleanup
    channel1.unsubscribe()
    channel2.unsubscribe()
    process.exit(0)
  }, 5000)
}

checkRealtimeConfig()

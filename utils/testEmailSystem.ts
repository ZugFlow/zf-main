import { createClient } from "@/utils/supabase/client";
import { getSalonId } from "@/utils/getSalonId";
import { testEmailConnection } from "@/utils/emailService";

/**
 * Script di test per verificare il sistema email
 * Esegui questo script per diagnosticare problemi email
 */
export async function testEmailSystem() {
  const supabase = createClient();
  
  console.log("🧪 Iniziando test del sistema email...");
  
  try {
    // 1. Verifica autenticazione utente
    console.log("1. Verificando autenticazione utente...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("❌ Errore autenticazione:", userError?.message || "Utente non autenticato");
      return false;
    }
    console.log("✅ Utente autenticato:", user.email);
    
    // 2. Verifica salon_id
    console.log("2. Verificando salon_id...");
    const salonId = await getSalonId();
    if (!salonId) {
      console.error("❌ Impossibile determinare il salon_id");
      return false;
    }
    console.log("✅ Salon ID trovato:", salonId);
    
    // 3. Verifica impostazioni email
    console.log("3. Verificando impostazioni email...");
    const { data: emailSettings, error: emailError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('salon_id', salonId)
      .single();
    
    if (emailError || !emailSettings) {
      console.error("❌ Impostazioni email non trovate:", emailError?.message);
      console.log("💡 Assicurati di aver configurato le impostazioni email in Impostazioni > Email");
      return false;
    }
    
    console.log("✅ Impostazioni email trovate:");
    console.log("   - Provider:", emailSettings.provider);
    console.log("   - Host:", emailSettings.smtp_host);
    console.log("   - Port:", emailSettings.smtp_port);
    console.log("   - User:", emailSettings.smtp_user);
    console.log("   - Enabled:", emailSettings.enabled);
    console.log("   - Secure:", emailSettings.secure);
    console.log("   - Require TLS:", emailSettings.require_tls);
    
    if (!emailSettings.enabled) {
      console.warn("⚠️  Le notifiche email sono disabilitate");
    }
    
    // 4. Verifica template email
    console.log("4. Verificando template email...");
    const { data: templates, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('salon_id', salonId)
      .eq('is_active', true);
    
    if (templateError) {
      console.error("❌ Errore nel caricamento template:", templateError.message);
    } else if (!templates || templates.length === 0) {
      console.log("ℹ️  Nessun template personalizzato trovato, verranno usati i template di default");
    } else {
      console.log("✅ Template personalizzati trovati:", templates.length);
      templates.forEach(t => console.log(`   - ${t.template_type}`));
    }
    
    // 5. Test connessione email
    console.log("5. Testando connessione email...");
    const testResult = await testEmailConnection();
    if (testResult.success) {
      console.log("✅ Test connessione email riuscito!");
    } else {
      console.error("❌ Test connessione email fallito:", testResult.error);
      return false;
    }
    
    // 6. Verifica informazioni salone
    console.log("6. Verificando informazioni salone...");
    const { data: salon, error: salonError } = await supabase
      .from('salon')
      .select('name, address, phone')
      .eq('id', salonId)
      .single();
    
    if (salonError) {
      console.error("❌ Errore nel caricamento informazioni salone:", salonError.message);
    } else {
      console.log("✅ Informazioni salone trovate:");
      console.log("   - Nome:", salon.name);
      console.log("   - Indirizzo:", salon.address || "Non specificato");
      console.log("   - Telefono:", salon.phone || "Non specificato");
    }
    
    console.log("🎉 Test del sistema email completato con successo!");
    return true;
    
  } catch (error) {
    console.error("❌ Errore durante il test:", error);
    return false;
  }
}

/**
 * Funzione per eseguire il test dalla console del browser
 * Copia e incolla questo nel browser console per testare:
 * 
 * import('/utils/testEmailSystem.js').then(m => m.testEmailSystem())
 */
export function runEmailTest() {
  testEmailSystem().then(success => {
    if (success) {
      console.log("🎉 Sistema email funzionante!");
    } else {
      console.log("❌ Sistema email con problemi - controlla i log sopra");
    }
  });
} 
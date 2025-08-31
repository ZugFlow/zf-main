import { createClient } from "@/utils/supabase/client";
import { addDays } from "date-fns";
import { getUserDataWithCache } from "../(dashboard)/(private)/crm/dashboard/query/query"; // Assicurati che il percorso sia corretto

const supabase = createClient();

async function getNextInvoiceNumber() {
  const { data, error } = await supabase
    .from("fatture")
    .select("numero")
    .order('numero', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) return 1;

  const lastInvoice = data[0].numero;
  const match = lastInvoice.match(/INV-(\d+)/);
  if (!match) return 1;

  return parseInt(match[1]) + 1;
}

export async function saveInvoiceToSupabase(order: any) {
  try {
    const user = await getUserDataWithCache();
    if (!user) throw new Error("Utente non autenticato");

    const { data: existingInvoice } = await supabase
      .from("fatture")
      .select("id")
      .eq("ordine_id", order.id)
      .single();

    if (existingInvoice) {
      throw new Error("Esiste già una fattura per questo ordine!");
    }

    const nextNumber = await getNextInvoiceNumber();
    const today = new Date();
    const dueDate = addDays(today, 30);

    const { error } = await supabase.from("fatture").insert({
      user_id: user.id,
      ordine_id: order.id,
      numero: `INV-${nextNumber}`, // Removed String(nextNumber).padStart(6, '0')
      data_emissione: today.toISOString(),
      scadenza: dueDate.toISOString(),
      totale: Number((order.prezzo * 1.22).toFixed(2)),
      iva: Number((order.prezzo * 0.22).toFixed(2)),
      status: 'generata',
      cliente_nome: order.nome,
      pdf_url: null,
      note: 'Fattura generata manualmente'
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Errore durante il salvataggio della fattura:", error);
    throw error;
  }
}

export async function generateInvoice(order: any) {
  try {
    if (!order) {
      throw new Error("Nessun ordine selezionato");
    }

    const user = await getUserDataWithCache();
    if (!user) {
      throw new Error("Utente non autenticato");
    }

    // Verifica se l'ordine è stato pagato
    if (order.status !== 'pagato') {
      throw new Error("Non è possibile generare una fattura per un ordine non pagato");
    }

    // Verifica se l'ordine ha già una fattura
    const { data: existingInvoice, error: checkError } = await supabase
      .from("fatture")
      .select("id, numero, pdf_url")
      .eq("ordine_id", order.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingInvoice) {
      throw new Error(`Esiste già una fattura per questo ordine (${existingInvoice.numero})`);
    }

    // Genera il nuovo numero di fattura
    const nextNumber = await getNextInvoiceNumber();
    const invoiceNumber = `INV-${nextNumber}`;

    const today = new Date();
    const dueDate = addDays(today, 30);

    // Prepara i dati della fattura
    const invoiceData = {
      user_id: user.id,
      ordine_id: order.id,
      numero: invoiceNumber,
      data_emissione: today.toISOString(),
      scadenza: dueDate.toISOString(),
      totale: Number((order.prezzo * 1.22).toFixed(2)),
      iva: Number((order.prezzo * 0.22).toFixed(2)),
      imponibile: Number(order.prezzo.toFixed(2)),
      status: 'generata',
      cliente_nome: order.nome,
      pdf_url: null,
      note: 'Fattura generata automaticamente'
    };

    // Inserisci la fattura nel database
    const { error: insertError } = await supabase
      .from("fatture")
      .insert([invoiceData]);

    if (insertError) {
      throw new Error(`Errore durante l'inserimento della fattura: ${insertError.message}`);
    }

    // Aggiorna lo stato dell'ordine
    const { error: updateError } = await supabase
      .from("orders")
      .update({ fattura_generata: true })
      .eq("id", order.id);

    if (updateError) {
      throw new Error(`Errore durante l'aggiornamento dell'ordine: ${updateError.message}`);
    }

    return {
      success: true,
      invoice: invoiceData
    };

  } catch (error) {
    console.error("Errore durante la generazione della fattura:", error);
    throw error;
  }
}

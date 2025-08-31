export const APPOINTMENT_STATUSES = [
  { value: 'Prenotato', label: 'Prenotato', color: 'blue' },
  { value: 'Confermato', label: 'Confermato', color: 'sky' }, // es. conferma via WhatsApp
  { value: 'In attesa', label: 'In attesa', color: 'yellow' },
  { value: 'Arrivato', label: 'Arrivato', color: 'amber' },
  { value: 'In corso', label: 'In corso', color: 'indigo' },
  { value: 'Completato', label: 'Completato', color: 'green' },
  { value: 'Annullato', label: 'Annullato', color: 'red' },
  { value: 'Assente', label: 'Assente', color: 'rose' },
  { value: 'Riprogrammato', label: 'Riprogrammato', color: 'purple' },

  // Stati legati al pagamento/fattura
  { value: 'Non pagato', label: 'Non pagato', color: 'orange' },
  { value: 'Pagato in contanti', label: 'Pagato in contanti', color: 'emerald' },
  { value: 'paid_card', label: 'Pagato con carta', color: 'teal' },
  { value: 'paid_online', label: 'Pagato online', color: 'cyan' },
  { value: 'Fatturato', label: 'Fatturato', color: 'lime' },
  { value: 'Fattura da emettere', label: 'Fattura da emettere', color: 'zinc' },
  { value: 'Fattura inviata', label: 'Fattura inviata', color: 'green' },
  { value: 'Errore fattura', label: 'Errore fattura', color: 'red' },

  // Stato eliminato
  { value: 'Eliminato', label: 'Eliminato', color: 'red' },
];

// Funzione per ottenere il colore di uno stato specifico
export const getStatusColor = (statusValue: string): string | undefined => {
  const status = APPOINTMENT_STATUSES.find((s) => s.value === statusValue);
  return status?.color;
};
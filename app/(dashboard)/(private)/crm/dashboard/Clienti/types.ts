// Shared types for client management components

export interface ClientTag {
  id: string;
  name: string;
  category: 'profile' | 'frequency' | 'preferences' | 'payment' | 'marketing' | 'fiscal' | 'internal';
  color: string;
}

export interface Client {
  id: number;
  nome: string;
  telefono: string;
  email: string;
  note?: string;
  descrizione?: string;
  status?: string;
  customer_uuid: string;
  coupon_id?: string;
  coupon?: {
    code: string;
    description: string;
  } | null;
  richiede_fattura?: boolean;
  tipo_cliente?: 'privato' | 'azienda' | 'libero_professionista';
  intestazione_fattura?: string;
  codice_fiscale?: string;
  partita_iva?: string;
  pec?: string;
  codice_sdi?: string;
  indirizzo_fatturazione?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  nazione?: string;
  metodo_pagamento?: string;
  pagato?: boolean;
  data_pagamento?: string;
  iva_inclusa?: boolean;
  aliquota_iva?: number;
  ritenuta_acconto?: number;
  bollo?: boolean;
  note_fattura?: string;
  numero_fattura?: string;
  data_fattura?: string;
  totale?: number;
  totale_imponibile?: number;
  totale_iva?: number;
  totale_netto?: number;
  valuta?: string;
  fattura_emessa?: boolean;
  fattura_pdf_url?: string;
  user_id_emittente?: string;
  team_id?: string;
  cliente_id?: string;
  firma_cliente_url?: string;
  documento_identita_url?: string;
  telefono_fatturazione?: string;
  tag?: ClientTag[] | null;
  created_at?: string;
}

export interface Order {
  id: number;
  customer_uuid: string;
  data: string;
  orarioInizio: string;
  orarioFine: string;
  servizio: string;
  prezzo: number;
  status?: string;
  services?: Array<{
    id: number;
    order_id: string;
    service_id: string;
    servizio: string;
    price: number;
  }>;
} 
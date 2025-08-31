export interface Appointment {
  id: string;
  nome: string;
  orarioInizio: string;
  orarioFine: string;
  data: string;
  team_id: string;
  servizio?: string;
  services?: any[];
  status?: string;
  type?: 'appointment' | 'pause';
  color_card?: string; // Aggiunta per supportare il colore delle card
}

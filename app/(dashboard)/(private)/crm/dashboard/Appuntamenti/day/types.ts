// types.ts
export interface Appointment {
  id: string;
  data: string; // date in format YYYY-MM-DD
  orarioInizio: string; // time in format HH:MM
  orarioFine: string; // time in format HH:MM
  team_id: string;
  status?: string;
  type?: "pause" | "appointment"; // Restricted type field
  nome: string; // Customer name - made required
  services?: { id: string; order_id: string; servizio: string; prezzo: number }[]; // Services
  // Add other properties as needed
}

export interface Member {
  id: string;
  name: string;
  visible_users: boolean;
  avatar_url: string | null;
  order_column: number;
  ColorMember?: string;  // Added ColorMember property
  // Add other properties as needed
}

// Constants for storage keys
export const STORAGE_KEYS = {
  HOUR_HEIGHT: 'calendar_hour_height',
  USER_SELECTIONS: 'calendar_selections'
};

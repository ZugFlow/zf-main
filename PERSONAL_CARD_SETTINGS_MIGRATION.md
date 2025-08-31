# Migrazione Impostazioni Card Personalizzate

## Panoramica
Questa migrazione trasforma le impostazioni di dimensione e allineamento delle card appuntamenti da impostazioni di team a impostazioni personali per ogni membro.

## Modifiche Apportate

### 1. Database Schema
- **File**: `utils/supabase/db/add_card_settings_to_hoursettings.sql`
- **Azione**: Aggiunta delle colonne `SizeCard` e `CardAlignment` alla tabella `hoursettings`
- **Motivazione**: Permettere a ogni utente di personalizzare la visualizzazione delle card appuntamenti

### 2. TypeScript Types
- **File**: `types/database.types.ts`
- **Azione**: Aggiunta della definizione completa della tabella `hoursettings` con le nuove colonne
- **Colonne aggiunte**:
  - `SizeCard: string | null` - Controlla la dimensione delle card (compact, normal, expanded)
  - `CardAlignment: string | null` - Controlla l'allineamento delle card (left, center, right)

### 3. Componente Impostazioni
- **File**: `app/(dashboard)/(private)/crm/dashboard/Impostazioni/_component/Appuntamenti.tsx`
- **Modifiche**:
  - Rimosso il caricamento delle impostazioni dalla tabella `team`
  - Aggiornato il caricamento per usare la tabella `hoursettings`
  - Modificate le funzioni `updateCardSize` e `updateCardAlignment` per salvare in `hoursettings`
  - Aggiornate tutte le funzioni di salvataggio per includere le nuove colonne
  - Aggiunti messaggi informativi che indicano che le impostazioni sono personali

### 4. Componenti Calendario
- **File**: `app/(dashboard)/(private)/crm/dashboard/Appuntamenti/day_weekly_view/day.tsx`
- **File**: `app/(dashboard)/(private)/crm/dashboard/Appuntamenti/day_weekly_view/weekly.tsx`
- **Modifiche**:
  - Rimosso il caricamento delle impostazioni dalla tabella `team`
  - Aggiornato per caricare tutte le impostazioni dalla tabella `hoursettings`
  - Ora ogni utente vede le proprie impostazioni personali

## Vantaggi della Modifica

1. **Personalizzazione**: Ogni membro del team può personalizzare la visualizzazione delle card secondo le proprie preferenze
2. **Indipendenza**: Le impostazioni di un utente non influiscono sugli altri membri del team
3. **Flessibilità**: Maggiore flessibilità nella gestione delle preferenze di visualizzazione
4. **Consistenza**: Tutte le impostazioni del calendario sono ora centralizzate nella tabella `hoursettings`

## Impatto

- **Utenti esistenti**: Le impostazioni esistenti dalla tabella `team` non vengono migrate automaticamente. Gli utenti dovranno reimpostare le loro preferenze personali
- **Nuovi utenti**: Avranno valori di default (SizeCard: "normal", CardAlignment: "center")
- **Performance**: Nessun impatto negativo sulle performance, anzi miglioramento grazie alla riduzione delle query

## Come Applicare la Migrazione

1. Eseguire il file SQL: `utils/supabase/db/add_card_settings_to_hoursettings.sql`
2. Riavviare l'applicazione per applicare le modifiche TypeScript
3. Gli utenti potranno ora personalizzare le loro impostazioni dalle Impostazioni > Appuntamenti

## Note Tecniche

- Le colonne sono nullable con valori di default
- Viene usato `upsert` con `onConflict: "user_id"` per gestire aggiornamenti
- Tutte le funzioni di salvataggio mantengono le altre impostazioni esistenti
- I valori di default sono: SizeCard = "normal", CardAlignment = "center" 
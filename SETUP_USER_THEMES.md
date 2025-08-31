# Configurazione Temi Individuali Utenti

## Panoramica

Il sistema ora supporta temi individuali per ogni utente. Ogni utente può scegliere il proprio tema (chiaro, scuro, automatico) e la preferenza viene salvata nel database.

## Struttura Database

La tabella `team` è stata aggiornata con il campo `theme`:

```sql
ALTER TABLE public.team ADD COLUMN theme text NULL;
```

## Script di Setup

Esegui il seguente script SQL per configurare i temi di default:

```sql
-- Aggiorna il tema di default per gli utenti esistenti
UPDATE public.team 
SET theme = 'light' 
WHERE theme IS NULL 
AND user_id IS NOT NULL;

-- Aggiungi commento alla colonna
COMMENT ON COLUMN public.team.theme IS 'Tema preferito dell''utente: light, dark, system';

-- Crea indice per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_team_theme ON public.team USING btree (theme);

-- Funzioni helper
CREATE OR REPLACE FUNCTION get_user_theme(user_uuid uuid)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT theme 
    FROM public.team 
    WHERE user_id = user_uuid 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_theme(user_uuid uuid, new_theme text)
RETURNS boolean AS $$
BEGIN
  UPDATE public.team 
  SET theme = new_theme 
  WHERE user_id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Funzionalità

### 1. Tema Individuale
- Ogni utente ha il proprio tema salvato nel database
- Il tema viene caricato automaticamente al login
- Le modifiche vengono salvate immediatamente
- **Tema di default**: Chiaro (light)

### 2. Tre Modalità
- **Chiaro**: Interfaccia luminosa (default)
- **Scuro**: Interfaccia scura per ridurre l'affaticamento degli occhi
- **Automatico**: Segue le impostazioni del sistema operativo

### 3. Accesso Rapido
- **Navbar**: Toggle del tema sempre visibile
- **Impostazioni**: Sezione dedicata con informazioni dettagliate

### 4. Persistenza
- Il tema viene salvato nel database per ogni utente
- Fallback al localStorage se il database non è disponibile
- Caricamento automatico al login

## Componenti Aggiunti

1. **ThemeProvider**: Gestisce il tema globale dell'app
2. **useUserTheme**: Hook per gestire il tema dell'utente
3. **ThemeToggle**: Componente per cambiare tema
4. **UserThemeInfo**: Mostra informazioni sul tema corrente

## File Modificati

- `context/theme-provider.tsx`: Provider per il tema
- `hooks/useUserTheme.ts`: Hook per gestire il tema utente
- `components/ui/theme-toggle.tsx`: Toggle del tema
- `app/(dashboard)/(private)/crm/dashboard/Impostazioni/ImpostazioniAvanzate.tsx`: Sezione tema
- `app/(dashboard)/(private)/crm/dashboard/navbar.tsx`: Toggle nella navbar
- `app/globals.css`: Variabili CSS per dark mode

## Utilizzo

1. **Cambio Tema**: Clicca sul toggle nella navbar o vai in Impostazioni → Tema
2. **Tema Automatico**: Seleziona "Automatico" per seguire le preferenze del sistema
3. **Persistenza**: Il tema viene salvato automaticamente e ricaricato al prossimo login
4. **Default**: Gli utenti nuovi avranno il tema chiaro di default

## Note Tecniche

- Il sistema usa il campo `theme` nella tabella `team`
- **Tema di default**: Chiaro (light)
- Supporto per utenti non autenticati con localStorage
- Gestione errori con fallback al tema chiaro
- Ottimizzazione con indici database 
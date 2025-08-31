# Configurazione Storage Salon-Assets

## Panoramica
Questo documento descrive come configurare il bucket `salon-assets` per permettere agli utenti autenticati di caricare e gestire le immagini carousel per la loro pagina web del salone.

## File di Migrazione
Il file `utils/supabase/db/salon_assets_storage_policies.sql` contiene tutte le policy RLS necessarie.

## Esecuzione della Migrazione

### Opzione 1: Dashboard Supabase
1. Vai al dashboard di Supabase
2. Naviga su **SQL Editor**
3. Copia e incolla il contenuto del file `salon_assets_storage_policies.sql`
4. Esegui la query

### Opzione 2: Supabase CLI
```bash
# Se hai Supabase CLI installato
supabase db push
```

### Opzione 3: Esecuzione Manuale
Esegui le seguenti query nel SQL Editor di Supabase:

```sql
-- Abilita RLS sulla tabella storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Crea il bucket salon-assets se non esiste
INSERT INTO storage.buckets (id, name, public)
VALUES ('salon-assets', 'salon-assets', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  updated_at = NOW();

-- Policy per INSERT (upload)
CREATE POLICY "Users can upload files to their salon folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'salon-assets' 
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT salon_id::text 
        FROM profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Policy per SELECT (visualizzazione pubblica)
CREATE POLICY "Users can view files from their salon folder" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'salon-assets'
    AND true  -- Accesso pubblico a tutti i file
  );

-- Policy per UPDATE
CREATE POLICY "Users can update files in their salon folder" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'salon-assets'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT salon_id::text 
        FROM profiles 
        WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'salon-assets'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT salon_id::text 
        FROM profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Policy per DELETE
CREATE POLICY "Users can delete files from their salon folder" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'salon-assets'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT salon_id::text 
        FROM profiles 
        WHERE id = auth.uid()
      )
    )
  );
```

## Struttura delle Cartelle
```
salon-assets/
└── {salon_id}/
    ├── carousel_1_timestamp.jpg
    ├── carousel_2_timestamp.jpg
    ├── carousel_3_timestamp.jpg
    ├── carousel_4_timestamp.jpg
    ├── carousel_5_timestamp.jpg
    └── carousel_6_timestamp.jpg
```

## Sicurezza
- **Upload**: Solo utenti autenticati possono caricare file nella cartella del loro salone
- **Visualizzazione**: Tutti i file sono pubblicamente accessibili (necessario per la pagina web pubblica)
- **Modifica/Rimozione**: Solo gli utenti autenticati possono modificare/rimuovere file dalla cartella del loro salone

## Verifica
Dopo aver eseguito la migrazione, prova a:
1. Caricare un'immagine carousel dalla pagina di amministrazione
2. Verificare che l'immagine sia visibile nella pagina web pubblica
3. Rimuovere un'immagine per verificare che la policy DELETE funzioni

## Risoluzione Problemi

### Errore 403 - Unauthorized
Se ricevi errori 403, verifica che:
1. Le policy siano state create correttamente
2. L'utente sia autenticato
3. Il `salon_id` nel profilo utente sia corretto

### Errore 400 - Bad Request
Se ricevi errori 400, verifica che:
1. Il bucket `salon-assets` esista
2. Il bucket sia configurato come pubblico
3. Il percorso del file sia corretto

### File non visibili
Se i file non sono visibili nella pagina web:
1. Verifica che la policy SELECT permetta l'accesso pubblico
2. Controlla che gli URL generati siano corretti
3. Verifica che il bucket sia pubblico

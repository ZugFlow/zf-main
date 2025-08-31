# 🔧 Risoluzione Problema Abilitazione Sito

## Problema
Il pulsante "Abilita Sito" non funziona e non abilita la pagina web del salone.

## Causa
Le funzioni SQL `enable_salon_web_page` e `disable_salon_web_page` non sono state create o aggiornate nel database Supabase.

## Soluzione

### 1. Eseguire le Funzioni SQL Corrette

**PROBLEMA IDENTIFICATO**: Le funzioni SQL stanno cercando di accedere alla tabella `salon` che non esiste nel database.

**SOLUZIONE**: Usa le funzioni corrette che non dipendono dalla tabella `salon`.

Vai nel **Dashboard Supabase** del tuo progetto:

1. Apri il dashboard Supabase
2. Vai su **SQL Editor**
3. Crea una nuova query
4. Copia e incolla il contenuto del file: `utils/supabase/db/fix_salon_web_functions_correct_structure.sql`
5. Esegui la query

**IMPORTANTE**: Questo file contiene le funzioni corrette che non dipendono dalla tabella `salon` inesistente.

### 2. Verificare che la Tabella Esista

Prima di eseguire le funzioni, verifica che la tabella `salon_web_settings` esista:

```sql
-- Verifica che la tabella esista
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'salon_web_settings'
);

-- Se la tabella non esiste, creala con questa struttura:
CREATE TABLE IF NOT EXISTS public.salon_web_settings (
  id uuid not null default gen_random_uuid(),
  salon_id uuid not null,
  web_enabled boolean null default false,
  web_domain character varying(255) null,
  web_subdomain character varying(100) null,
  web_title character varying(255) null,
  web_description text null,
  web_logo_url text null,
  web_theme character varying(50) null default 'default'::character varying,
  web_primary_color character varying(7) null default '#6366f1'::character varying,
  web_secondary_color character varying(7) null default '#8b5cf6'::character varying,
  web_contact_email character varying(255) null,
  web_contact_phone character varying(50) null,
  web_address text null,
  web_social_facebook character varying(255) null,
  web_social_instagram character varying(255) null,
  web_social_twitter character varying(255) null,
  web_google_analytics_id character varying(50) null,
  web_meta_title character varying(255) null,
  web_meta_description text null,
  web_meta_keywords text null,
  web_og_image_url text null,
  web_favicon_url text null,
  web_custom_css text null,
  web_custom_js text null,
  web_booking_enabled boolean null default true,
  web_services_visible boolean null default true,
  web_team_visible boolean null default true,
  web_gallery_visible boolean null default true,
  web_testimonials_visible boolean null default true,
  web_contact_form_enabled boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint salon_web_settings_pkey primary key (id),
  constraint salon_web_settings_salon_id_key unique (salon_id),
  constraint salon_web_settings_web_domain_key unique (web_domain),
  constraint salon_web_settings_web_subdomain_key unique (web_subdomain)
);
```

### 3. Verificare l'Installazione

Dopo aver eseguito le funzioni, verifica che siano state create correttamente:

```sql
-- Verifica che le funzioni esistano
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('enable_salon_web_page', 'disable_salon_web_page', 'generate_unique_subdomain');
```

### 4. Testare le Funzioni

Esegui questo test per verificare che tutto funzioni:

```sql
-- Test delle funzioni (sostituisci con i tuoi ID reali)
SELECT enable_salon_web_page(
  'your-user-id-here'::uuid,
  'your-salon-id-here'::uuid,
  'Il Mio Salone',
  'Prenota il tuo appuntamento online'
);
```

### 5. Controllare i Log

Se il problema persiste, controlla i log della console del browser:

1. Apri gli **Strumenti per sviluppatori** (F12)
2. Vai su **Console**
3. Prova ad abilitare il sito
4. Cerca i messaggi che iniziano con `🔧 [PaginaWeb]`

### 6. Verificare la Tabella

Assicurati che la tabella `salon_web_settings` esista:

```sql
-- Verifica che la tabella esista
SELECT * FROM salon_web_settings LIMIT 1;

-- Se non esiste, creala
CREATE TABLE IF NOT EXISTS salon_web_settings (
  salon_id UUID PRIMARY KEY REFERENCES salon(id),
  web_enabled BOOLEAN DEFAULT false,
  web_subdomain VARCHAR(100) UNIQUE,
  web_domain VARCHAR(255),
  web_title TEXT,
  web_description TEXT,
  web_logo_url TEXT,
  web_theme VARCHAR(50),
  web_primary_color VARCHAR(7),
  web_secondary_color VARCHAR(7),
  web_contact_email VARCHAR(255),
  web_contact_phone VARCHAR(50),
  web_address TEXT,
  web_social_facebook VARCHAR(255),
  web_social_instagram VARCHAR(255),
  web_social_twitter VARCHAR(255),
  web_google_analytics_id VARCHAR(50),
  web_meta_title TEXT,
  web_meta_description TEXT,
  web_meta_keywords TEXT,
  web_og_image_url TEXT,
  web_favicon_url TEXT,
  web_custom_css TEXT,
  web_custom_js TEXT,
  web_booking_enabled BOOLEAN DEFAULT true,
  web_services_visible BOOLEAN DEFAULT true,
  web_team_visible BOOLEAN DEFAULT true,
  web_gallery_visible BOOLEAN DEFAULT true,
  web_testimonials_visible BOOLEAN DEFAULT true,
  web_contact_form_enabled BOOLEAN DEFAULT true,
  web_layout_style VARCHAR(50),
  web_header_style VARCHAR(50),
  web_footer_style VARCHAR(50),
  web_animation_enabled BOOLEAN DEFAULT true,
  web_parallax_enabled BOOLEAN DEFAULT false,
  web_dark_mode_enabled BOOLEAN DEFAULT false,
  web_show_search BOOLEAN DEFAULT false,
  web_show_breadcrumbs BOOLEAN DEFAULT false,
  web_show_social_share BOOLEAN DEFAULT true,
  web_show_back_to_top BOOLEAN DEFAULT true,
  web_show_loading_animation BOOLEAN DEFAULT true,
  web_custom_font VARCHAR(50),
  web_font_size VARCHAR(20),
  web_line_height VARCHAR(20),
  web_spacing VARCHAR(20),
  web_border_radius VARCHAR(20),
  web_shadow_style VARCHAR(20),
  web_transition_speed VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Debug Avanzato

### Controllare i Permessi

Verifica che l'utente abbia i permessi corretti:

```sql
-- Verifica il profilo utente
SELECT p.id, p.salon_id, s.name as salon_name
FROM profiles p
JOIN salon s ON p.salon_id = s.id
WHERE p.id = 'your-user-id-here';
```

### Controllare le Policy RLS

Assicurati che le policy RLS permettano l'accesso:

```sql
-- Verifica le policy sulla tabella salon_web_settings
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'salon_web_settings';
```

### Test Manuale

Esegui un test manuale della funzione:

```sql
-- Test manuale (sostituisci con i tuoi ID)
DO $$
DECLARE
  result JSON;
BEGIN
  result := enable_salon_web_page(
    'your-user-id-here'::uuid,
    'your-salon-id-here'::uuid,
    'Test Salone',
    'Descrizione test'
  );
  
  RAISE NOTICE 'Risultato: %', result;
END $$;
```

## Messaggi di Errore Comuni

### "Function not found"
- **Causa**: Le funzioni SQL non sono state create
- **Soluzione**: Esegui il file `salon_web_settings_functions_fixed.sql`

### "Unauthorized access to salon"
- **Causa**: L'utente non è associato al salone
- **Soluzione**: Verifica la tabella `profiles`

### "Subdomain already exists"
- **Causa**: Il subdomain generato è già in uso
- **Soluzione**: La funzione dovrebbe generarne uno nuovo automaticamente

### "Salon not found"
- **Causa**: Il salon_id non esiste
- **Soluzione**: Verifica che il salone esista nella tabella `salon`

## Contatto Supporto

Se il problema persiste dopo aver seguito questi passaggi, fornisci:

1. **Screenshot** della console del browser
2. **Log** degli errori
3. **ID utente** e **ID salone** (per debug)
4. **Risultato** del test manuale delle funzioni 
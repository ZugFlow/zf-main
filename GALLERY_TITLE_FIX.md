# Fix per il Titolo della Galleria

## Problema Identificato

Il titolo della galleria non veniva visualizzato correttamente e non era possibile rimuoverlo perché:

1. **Campi mancanti nel database**: I campi `web_gallery_title_enabled` e `web_gallery_title` potrebbero non essere presenti nella tabella `salon_web_settings`
2. **Logica di controllo errata**: La condizione `!== false` non gestiva correttamente i valori `null` o `undefined`
3. **Errore di linter**: Il campo `bulletActiveColor` non è valido nelle opzioni di paginazione di Swiper

## Soluzioni Implementate

### 1. Migrazione Database

Esegui la migrazione per aggiungere i campi mancanti:

```sql
-- File: utils/supabase/db/add_missing_gallery_fields.sql
-- Questo script aggiunge tutti i campi mancanti della galleria
```

### 2. Correzione Logica

**Prima:**
```typescript
checked={salonData.web_gallery_title_enabled !== false}
{(salonData.web_gallery_title_enabled !== false) && (
```

**Dopo:**
```typescript
checked={salonData.web_gallery_title_enabled ?? true}
{(salonData.web_gallery_title_enabled ?? true) && (
```

### 3. Correzione Errore Linter

**Prima:**
```typescript
pagination={{
  clickable: true,
  el: '.swiper-pagination',
  bulletActiveColor: salonData.web_primary_color || '#6366f1', // ❌ Campo non valido
}}
```

**Dopo:**
```typescript
pagination={{
  clickable: true,
  el: '.swiper-pagination',
}}
```

## Come Applicare le Correzioni

### 1. Esegui la Migrazione Database

```bash
# Se usi Supabase CLI
npx supabase db push --include-all

# Oppure esegui manualmente il file SQL
# utils/supabase/db/add_missing_gallery_fields.sql
```

### 2. Verifica i Campi nel Database

```sql
-- Verifica che i campi esistano
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'salon_web_settings' 
AND column_name LIKE 'web_gallery%'
ORDER BY column_name;
```

### 3. Testa la Funzionalità

1. Vai nel builder della pagina web
2. Nella sezione "Layout" > "Galleria Orizzontale"
3. Prova a disabilitare/abilitare il toggle "Mostra Titolo Galleria"
4. Verifica che il titolo appaia/scompaia correttamente

## Struttura Campi Galleria

I seguenti campi dovrebbero essere presenti nella tabella `salon_web_settings`:

- `web_gallery_enabled` (BOOLEAN) - Abilita/disabilita la galleria
- `web_gallery_title_enabled` (BOOLEAN) - Abilita/disabilita il titolo
- `web_gallery_title` (VARCHAR) - Testo del titolo
- `web_gallery_subtitle` (TEXT) - Testo del sottotitolo
- `web_gallery_image_1` a `web_gallery_image_8` (VARCHAR) - URL delle immagini

## Note Importanti

- Il valore di default per `web_gallery_title_enabled` è `true`
- Se il campo è `null` o `undefined`, viene considerato come `true` (mostra il titolo)
- Solo quando il campo è esplicitamente `false` il titolo viene nascosto
- Il titolo di default è "La Nostra Galleria" se non specificato

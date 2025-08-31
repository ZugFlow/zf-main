# 🗂️ Configurazione Storage Saloni

## Panoramica

Questo documento spiega come configurare Supabase Storage per gestire i file dei saloni (logo, immagini galleria, ecc.) in modo sicuro e organizzato.

## 📁 Struttura delle Cartelle

```
salon-assets/
├── salons/
│   ├── {salon_id_1}/
│   │   ├── logos/
│   │   │   ├── logo-1234567890.jpg
│   │   │   └── logo-1234567891.png
│   │   ├── gallery/
│   │   │   ├── image-1.jpg
│   │   │   └── image-2.png
│   │   └── other/
│   └── {salon_id_2}/
│       ├── logos/
│       └── gallery/
```

## 🔧 Configurazione Supabase

### 1. Creare il Bucket

Esegui il file SQL `utils/supabase/db/salon_storage_setup.sql` nel tuo progetto Supabase:

```sql
-- Crea il bucket salon-assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-assets',
  'salon-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);
```

### 2. Configurare le Policy di Sicurezza

Le policy garantiscono che:
- ✅ Gli utenti possono caricare solo nella cartella del proprio salone
- ✅ Gli utenti possono visualizzare solo i propri file
- ✅ I file sono accessibili pubblicamente per la pagina web
- ✅ Gli utenti possono eliminare solo i propri file

### 3. Verificare la Configurazione

Nel dashboard Supabase:
1. Vai su **Storage**
2. Verifica che esista il bucket `salon-assets`
3. Controlla che le policy siano attive
4. Testa l'upload di un file

## 🚀 Funzionalità Implementate

### Upload Logo
- **Validazione**: Solo JPG, PNG, WebP fino a 5MB
- **Organizzazione**: `salons/{salon_id}/logos/logo-{timestamp}.{ext}`
- **Preview**: Anteprima immediata prima del caricamento
- **Sicurezza**: Controllo accessi basato su salon_id

### Gestione File
- **Caricamento**: Drag & drop o click to upload
- **Sostituzione**: Possibilità di sostituire logo esistente
- **Rimozione**: Eliminazione sicura dal storage
- **Feedback**: Toast notifications per tutte le operazioni

### Sicurezza
- **Isolamento**: Ogni salone ha la sua cartella
- **Controllo Accessi**: Policy RLS per ogni operazione
- **Validazione**: Controlli lato client e server
- **Pulizia**: Rimozione automatica file obsoleti

## 📋 Esempi di Utilizzo

### Caricamento Logo
```typescript
const uploadLogo = async (file: File, salonId: string) => {
  const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
  const filePath = `salons/${salonId}/logos/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('salon-assets')
    .upload(filePath, file);
    
  if (error) throw error;
  
  return supabase.storage
    .from('salon-assets')
    .getPublicUrl(filePath);
};
```

### Eliminazione Logo
```typescript
const removeLogo = async (logoUrl: string, salonId: string) => {
  const url = new URL(logoUrl);
  const pathParts = url.pathname.split('/');
  const filePath = pathParts.slice(-3).join('/');
  
  const { error } = await supabase.storage
    .from('salon-assets')
    .remove([filePath]);
    
  if (error) throw error;
};
```

## 🔒 Sicurezza e Best Practices

### Policy di Sicurezza
- **RLS Attivo**: Row Level Security per tutti i bucket
- **Controllo Accessi**: Verifica salon_id per ogni operazione
- **Validazione File**: Controllo tipo e dimensione
- **Isolamento**: Separazione completa tra saloni

### Gestione Errori
- **Validazione Client**: Controlli immediati lato browser
- **Validazione Server**: Controlli di sicurezza lato Supabase
- **Feedback Utente**: Messaggi di errore chiari e specifici
- **Rollback**: Gestione errori con pulizia automatica

### Performance
- **Ottimizzazione**: Compressione automatica immagini
- **Cache**: Cache control headers per performance
- **CDN**: Distribuzione globale tramite Supabase CDN
- **Lazy Loading**: Caricamento on-demand delle immagini

## 🛠️ Troubleshooting

### Problemi Comuni

**Errore "Bucket not found"**
- Verifica che il bucket `salon-assets` sia stato creato
- Controlla le policy di accesso

**Errore "Access denied"**
- Verifica che l'utente sia autenticato
- Controlla che il salon_id sia corretto
- Verifica le policy RLS

**File non caricato**
- Controlla la dimensione del file (max 5MB)
- Verifica il formato (solo JPG, PNG, WebP)
- Controlla la connessione internet

### Debug
```typescript
// Abilita debug per storage
const { data, error } = await supabase.storage
  .from('salon-assets')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });

console.log('Upload result:', { data, error });
```

## 📈 Monitoraggio

### Metriche da Monitorare
- **Storage Usage**: Utilizzo spazio per salone
- **Upload Success Rate**: Percentuale upload riusciti
- **Error Rate**: Frequenza errori per tipo
- **Performance**: Tempo di caricamento file

### Logs
- **Access Logs**: Chi accede a quali file
- **Error Logs**: Errori di upload/eliminazione
- **Security Logs**: Tentativi di accesso non autorizzato

## 🔄 Aggiornamenti Futuri

### Funzionalità Pianificate
- **Compressione Automatica**: Riduzione dimensioni immagini
- **Watermark**: Aggiunta watermark automatica
- **Galleria Avanzata**: Gestione album e categorie
- **Backup**: Backup automatico file importanti
- **Analytics**: Statistiche utilizzo storage per salone 
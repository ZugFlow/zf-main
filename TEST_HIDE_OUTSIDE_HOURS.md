# Test Funzionalità: Nascondi Orari Fuori Orario

## Prerequisiti
1. Eseguire il file SQL: `utils/supabase/db/add_hide_outside_hours_column.sql`
2. Avere un account con accesso alle impostazioni
3. Avere orari di lavoro configurati (es. 08:00 - 20:00)

## Test Case 1: Attivazione Funzionalità

### Passi:
1. Andare in **Impostazioni** → **Appuntamenti**
2. Verificare che sia presente la sezione "Visualizzazione Orari Fuori Orario"
3. Attivare il toggle "Nascondi orari fuori dall'orario di lavoro"
4. Salvare l'impostazione

### Risultato Atteso:
- Toast di conferma: "Gli orari fuori dall'orario di lavoro sono ora nascosti"
- L'impostazione viene salvata nel database

## Test Case 2: Vista Giornaliera - Ore Nascoste

### Passi:
1. Andare in **Appuntamenti** → **Vista Giornaliera**
2. Verificare che vengano mostrate solo le ore nell'intervallo di lavoro
3. Verificare che le ore prima dell'orario di inizio siano nascoste
4. Verificare che le ore dopo l'orario di fine siano nascoste

### Risultato Atteso:
- Se orario di lavoro: 08:00 - 20:00
- Ore visibili: 08:00, 09:00, 10:00, ..., 19:00, 20:00
- Ore nascoste: 00:00, 01:00, ..., 07:00, 21:00, 22:00, 23:00

## Test Case 3: Vista Settimanale - Ore Nascoste

### Passi:
1. Andare in **Appuntamenti** → **Vista Settimanale**
2. Verificare che vengano mostrate solo le ore nell'intervallo di lavoro
3. Verificare che le ore prima dell'orario di inizio siano nascoste
4. Verificare che le ore dopo l'orario di fine siano nascoste

### Risultato Atteso:
- Stesso comportamento della vista giornaliera
- Tutti i giorni della settimana mostrano solo le ore di lavoro

## Test Case 4: Indicatore Ora Corrente

### Passi:
1. Verificare che l'indicatore dell'ora corrente sia visibile
2. Verificare che l'indicatore si posizioni correttamente anche con ore nascoste

### Risultato Atteso:
- L'indicatore dell'ora corrente è visibile
- La posizione è calcolata correttamente considerando solo le ore visibili

## Test Case 5: Disattivazione Funzionalità

### Passi:
1. Tornare in **Impostazioni** → **Appuntamenti**
2. Disattivare il toggle "Nascondi orari fuori dall'orario di lavoro"
3. Salvare l'impostazione

### Risultato Atteso:
- Toast di conferma: "Gli orari fuori dall'orario di lavoro sono ora visibili"
- Tutte le 24 ore vengono mostrate nel calendario

## Test Case 6: Cambio Orari di Lavoro

### Passi:
1. Cambiare l'orario di inizio (es. da 08:00 a 09:00)
2. Cambiare l'orario di fine (es. da 20:00 a 19:00)
3. Salvare le impostazioni
4. Verificare che le ore nascoste si aggiornino di conseguenza

### Risultato Atteso:
- Le ore nascoste si aggiornano automaticamente
- Se orario: 09:00 - 19:00, ore nascoste: 00:00-08:00 e 20:00-23:00

## Test Case 7: Appuntamenti Fuori Orario

### Passi:
1. Creare un appuntamento alle 07:00 (fuori orario)
2. Attivare la funzionalità "Nascondi orari fuori orario"
3. Verificare che l'appuntamento non sia visibile
4. Disattivare la funzionalità
5. Verificare che l'appuntamento sia di nuovo visibile

### Risultato Atteso:
- Gli appuntamenti fuori orario non sono visibili quando la funzionalità è attiva
- Gli appuntamenti riappaiono quando la funzionalità è disattivata

## Test Case 8: Performance

### Passi:
1. Verificare che il caricamento del calendario sia veloce
2. Verificare che non ci siano errori nella console del browser

### Risultato Atteso:
- Nessun errore JavaScript
- Caricamento fluido del calendario
- Nessun problema di performance

## Problemi Noti e Soluzioni

### Problema: Ore non vengono nascoste
**Causa**: Impostazione non salvata correttamente
**Soluzione**: Verificare che la colonna `hide_outside_hours` sia stata aggiunta al database

### Problema: Indicatore ora corrente posizionato male
**Causa**: Calcolo della posizione non aggiornato
**Soluzione**: Verificare che il calcolo tenga conto delle ore nascoste

### Problema: Appuntamenti non visibili
**Causa**: Filtro troppo restrittivo
**Soluzione**: Verificare che gli appuntamenti non vengano filtrati erroneamente

## Note per lo Sviluppatore

- La funzionalità è implementata sia in `day.tsx` che in `weekly.tsx`
- L'impostazione è condivisa a livello di salon
- Il calcolo della posizione dell'indicatore è stato aggiornato per funzionare con ore nascoste
- La logica di filtraggio è ottimizzata per evitare duplicazioni 
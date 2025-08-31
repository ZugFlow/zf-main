# Guida Sistema Pagine Web Saloni

## Panoramica

Il nuovo sistema permette ai saloni di creare e personalizzare completamente le loro pagine web attraverso un'interfaccia intuitiva. Ogni salone può avere una pagina web unica con dominio personalizzato (es: `mio-salone.zugflow.com`).

## Funzionalità Principali

### 1. Impostazioni Base
- **Nome del Salone**: Titolo principale della pagina
- **Sottotitolo**: Descrizione breve del salone
- **Descrizione**: Testo principale della hero section
- **Contatti**: Telefono, email, indirizzo
- **Social Media**: Link a Facebook, Instagram, etc.

### 2. Personalizzazione Design
- **Colori**: Primario e secondario personalizzabili
- **Tipografia**: Font, dimensioni, spaziature
- **Layout**: Sidebar o navbar
- **Tema**: Chiaro/scuro

### 3. Gestione Contenuti
- **Servizi**: Lista completa con prezzi, durate, descrizioni
- **Team**: Membri del team con foto, specialità, esperienza
- **Galleria**: Immagini del salone
- **Testimonial**: Recensioni clienti

### 4. Funzionalità Avanzate
- **CSS Personalizzato**: Stili completamente personalizzabili
- **JavaScript Personalizzato**: Funzionalità aggiuntive
- **SEO**: Meta title, description, keywords
- **Analytics**: Google Analytics integration

## Struttura Database

### Tabella `salon_web_settings`
Contiene tutte le impostazioni della pagina web del salone:

```sql
CREATE TABLE salon_web_settings (
    id UUID PRIMARY KEY,
    salon_id UUID NOT NULL,
    web_enabled BOOLEAN DEFAULT false,
    web_subdomain VARCHAR(100) UNIQUE,
    web_title VARCHAR(255),
    web_subtitle VARCHAR(255),
    web_description TEXT,
    web_primary_color VARCHAR(7),
    web_secondary_color VARCHAR(7),
    -- ... altre impostazioni
);
```

### Tabella `salon_services`
Gestisce i servizi offerti dal salone:

```sql
CREATE TABLE salon_services (
    id UUID PRIMARY KEY,
    salon_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    duration INTEGER DEFAULT 60,
    category VARCHAR(100),
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50) DEFAULT 'scissors'
);
```

### Tabella `salon_team_members`
Gestisce i membri del team:

```sql
CREATE TABLE salon_team_members (
    id UUID PRIMARY KEY,
    salon_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    experience VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    specialties TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    social_instagram VARCHAR(255),
    social_facebook VARCHAR(255)
);
```

## Componenti Principali

### 1. `PaginaWeb.tsx`
Interfaccia principale per la gestione della pagina web:
- **Tab Impostazioni**: Configurazione base
- **Tab Builder**: Builder visuale della pagina
- **Tab Servizi**: Gestione servizi
- **Tab Team**: Gestione team

### 2. `DynamicSalonPage.tsx`
Componente che renderizza la pagina web dinamica:
- Carica i dati dal database
- Applica le personalizzazioni
- Renderizza i contenuti dinamici

### 3. `ServicesManager.tsx`
Gestione completa dei servizi:
- Creazione/modifica servizi
- Upload icone
- Gestione prezzi e sconti
- Categorizzazione

### 4. `TeamManager.tsx`
Gestione del team:
- Aggiunta/modifica membri
- Upload foto profilo
- Gestione specialità
- Social media integration

## Come Utilizzare

### 1. Abilitare la Pagina Web
1. Vai su **Impostazioni > Pagina Web**
2. Compila le informazioni base (nome, descrizione, contatti)
3. Scegli un subdomain univoco
4. Clicca "Abilita Sito"

### 2. Personalizzare il Design
1. Vai alla tab **Design**
2. Scegli i colori primario e secondario
3. Personalizza la tipografia
4. Configura il layout

### 3. Aggiungere Servizi
1. Vai alla tab **Servizi**
2. Clicca "Nuovo Servizio"
3. Compila nome, descrizione, prezzo, durata
4. Scegli un'icona e categoria
5. Salva

### 4. Gestire il Team
1. Vai alla tab **Team**
2. Clicca "Nuovo Membro"
3. Aggiungi foto, nome, ruolo, esperienza
4. Seleziona le specialità
5. Aggiungi social media

### 5. Personalizzazioni Avanzate
1. Vai alla tab **Avanzato**
2. Aggiungi CSS personalizzato
3. Inserisci JavaScript personalizzato
4. Configura SEO

## URL Structure

Le pagine web sono accessibili tramite:
```
https://[subdomain].zugflow.com
```

Esempio:
- `https://bellezza-milano.zugflow.com`
- `https://salon-roma.zugflow.com`

## Permessi

Solo gli utenti con permesso `canEditSystemSettings` possono:
- Modificare le impostazioni della pagina web
- Gestire servizi e team
- Personalizzare il design

## Storage

Le immagini vengono salvate in Supabase Storage:
- **Bucket**: `salon-assets`
- **Path**: `{salon_id}/{category}/{filename}`
- **Categorie**: `team/`, `gallery/`, `logos/`

## Performance

- **Lazy Loading**: Le immagini si caricano solo quando necessarie
- **Caching**: I dati vengono cacheati per migliorare le performance
- **CDN**: Supabase Storage utilizza CDN globale
- **Optimization**: Immagini ottimizzate automaticamente

## SEO

Ogni pagina web include:
- Meta title personalizzabile
- Meta description personalizzabile
- Meta keywords
- Open Graph tags
- Structured data per servizi

## Analytics

Supporto per:
- Google Analytics
- Facebook Pixel
- Custom tracking

## Responsive Design

Tutte le pagine sono completamente responsive:
- **Mobile**: Layout ottimizzato per smartphone
- **Tablet**: Layout adattivo per tablet
- **Desktop**: Layout completo per desktop

## Browser Support

- Chrome (ultime 2 versioni)
- Firefox (ultime 2 versioni)
- Safari (ultime 2 versioni)
- Edge (ultime 2 versioni)

## Troubleshooting

### Pagina non si carica
1. Verifica che il subdomain sia corretto
2. Controlla che la pagina sia abilitata
3. Verifica i permessi utente

### Immagini non si caricano
1. Controlla i permessi del bucket storage
2. Verifica che le URL siano corrette
3. Controlla la dimensione dei file (max 5MB)

### Modifiche non si salvano
1. Verifica la connessione internet
2. Controlla i permessi utente
3. Verifica che tutti i campi obbligatori siano compilati

## Prossimi Sviluppi

- [ ] Sistema di prenotazioni online
- [ ] Integrazione con Google Calendar
- [ ] Sistema di recensioni clienti
- [ ] Blog integrato
- [ ] E-commerce per prodotti
- [ ] Sistema di newsletter
- [ ] Chat live
- [ ] App mobile

## Supporto

Per supporto tecnico:
- Email: support@zugflow.com
- Documentazione: docs.zugflow.com
- Community: community.zugflow.com 
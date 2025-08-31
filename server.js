require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');

const app = express();
const PORT = 3005;

// Configurazione OAuth2
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Endpoint per iniziare il flusso OAuth2
app.get('/auth', (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });

    res.redirect(url);
});

// Callback per gestire il token dopo l'autenticazione
app.get('/oauth2/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Stampa i token per debug
        console.log('Access Token:', tokens.access_token);
        console.log('Refresh Token:', tokens.refresh_token);

        res.send('Autenticazione completata! Puoi tornare all\'applicazione.');
    } catch (error) {
        console.error('Errore nella callback OAuth2:', error);
        res.status(500).send('Errore durante l\'autenticazione');
    }
});

app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});

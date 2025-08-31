
const express = require('express');
const session = require('express-session');
const app = express();

// ...existing code...

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Middleware per controllare se l'utente è loggato
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.status(403).send('Accesso negato. Devi essere loggato per accedere a questa risorsa.');
    }
}

// Applica il middleware alla cartella crm e alle sue sottocartelle
app.use('/crm', isAuthenticated, express.static(__dirname + '/crm'));

// ...existing code...

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
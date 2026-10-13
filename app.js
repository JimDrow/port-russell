// Charge les secrets du fichier .env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const auth = require('./middlewares/auth');
const authController = require('./controllers/authController');

const app = express();

// Permet de lire le JSON envoyé dans le corps des requêtes
app.use(express.json());
// Permet de lire les données envoyées par les formulaires HTML
app.use(express.urlencoded({ extended: false }));
// Permet de lire les cookies (où est rangé le jeton de connexion)
app.use(cookieParser());

// Connexion / déconnexion (routes publiques)
app.post('/login', authController.login);
app.get('/logout', authController.logout);

// Routes de l'API (protégées par le middleware auth)
app.use('/catways/:id/reservations', auth, require('./routes/reservations'));
app.use('/catways', auth, require('./routes/catways'));
app.use('/users', auth, require('./routes/users'));

// Route de test
app.get('/', (req, res) => {
  res.send('Bienvenue au port de Russell ⚓');
});

// Connexion à MongoDB, puis démarrage du serveur
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connecté à MongoDB');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion MongoDB :', err.message);
  });
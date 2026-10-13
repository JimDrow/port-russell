// Charge les secrets du fichier .env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');

const auth = require('./middlewares/auth');
const authController = require('./controllers/authController');

const app = express();

// Moteur de templates : les pages sont dans le dossier "views"
app.set('view engine', 'ejs');
app.set('views', './views');

// Fichiers statiques (CSS, images...) dans le dossier "public"
app.use(express.static('public'));

// Documentation du code (JSDoc), générée avec "npm run doc"
app.use('/jsdoc', express.static('jsdoc'));

// Permet de lire le JSON envoyé dans le corps des requêtes
app.use(express.json());
// Permet de lire les données envoyées par les formulaires HTML
app.use(express.urlencoded({ extended: false }));
// Permet de lire les cookies (où est rangé le jeton de connexion)
app.use(cookieParser());
// Permet aux formulaires HTML d'envoyer des PUT et DELETE (via ?_method=...)
app.use(methodOverride('_method'));

// Documentation de l'API (Swagger), accessible publiquement
const swaggerDocument = YAML.parse(
  fs.readFileSync(path.join(__dirname, 'docs', 'openapi.yaml'), 'utf8')
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Connexion / déconnexion (routes publiques)
app.post('/login', authController.login);
app.get('/logout', authController.logout);

// Routes de l'API (protégées par le middleware auth)
app.use('/catways/:id/reservations', auth, require('./routes/reservations'));
app.use('/catways', auth, require('./routes/catways'));
app.use('/users', auth, require('./routes/users'));

// Pages du tableau de bord (protégées)
app.use('/dashboard', auth, require('./routes/pages'));

// Page d'accueil (présentation + formulaire de connexion)
app.get('/', (req, res) => {
  res.render('index', { error: req.query.error });
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
/**
 * Script d'import des données de départ dans MongoDB.
 * Lancement : npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');

const Catway = require('./models/Catway');
const Reservation = require('./models/Reservation');
const User = require('./models/User');

const catways = require('./data/catways.json');
const reservations = require('./data/reservations.json');

/**
 * Vide les collections puis importe les catways,
 * les réservations et le compte administrateur.
 */
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. On vide tout
    await Catway.deleteMany();
    await Reservation.deleteMany();
    await User.deleteMany();
    console.log('🧹 Collections vidées');

    // 2. Import des catways
    await Catway.insertMany(catways);
    console.log(`⚓ ${catways.length} catways importés`);

    // 3. Import des réservations (les dates texte deviennent de vraies dates)
    await Reservation.insertMany(reservations);
    console.log(`📅 ${reservations.length} réservations importées`);

    // 4. Création du compte admin (create => le mot de passe est haché)
    await User.create({
      username: process.env.ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });
    console.log(`👤 Admin créé : ${process.env.ADMIN_EMAIL}`);
  } catch (err) {
    console.error('❌ Erreur :', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnecté');
  }
}

seed();
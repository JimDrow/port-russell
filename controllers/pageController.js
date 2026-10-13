const Reservation = require('../models/Reservation');
const Catway = require('../models/Catway');

/**
 * Redirige vers une page en ajoutant un message dans l'URL.
 * @param {import('express').Response} res
 * @param {string} path - Page de destination
 * @param {'success'|'error'} type - Type de message
 * @param {string} message - Texte du message
 */
function redirectWithMessage(res, path, type, message) {
  res.redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

/* ========== TABLEAU DE BORD ========== */

/**
 * Affiche le tableau de bord : utilisateur connecté,
 * date du jour et réservations en cours.
 * @route GET /dashboard
 */
exports.dashboard = async (req, res) => {
  const now = new Date();

  // En cours = a commencé ET n'est pas encore terminée
  const reservations = await Reservation.find({
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ catwayNumber: 1 });

  res.render('dashboard', {
    user: req.user,
    today: now.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }),
    reservations
  });
};

/* ========== CATWAYS ========== */

/**
 * Affiche la page de gestion des catways.
 * @route GET /dashboard/catways
 */
exports.catwaysPage = async (req, res) => {
  const catways = await Catway.find().sort({ catwayNumber: 1 });
  res.render('catways', {
    catways,
    success: req.query.success,
    error: req.query.error
  });
};

/**
 * Crée un catway depuis le formulaire.
 * @route POST /dashboard/catways
 */
exports.createCatway = async (req, res) => {
  try {
    const { catwayNumber, catwayType, catwayState } = req.body;
    await Catway.create({ catwayNumber, catwayType, catwayState });
    redirectWithMessage(res, '/dashboard/catways', 'success', `Catway ${catwayNumber} créé`);
  } catch (err) {
    const message = err.code === 11000 ? 'Ce numéro de catway existe déjà' : err.message;
    redirectWithMessage(res, '/dashboard/catways', 'error', message);
  }
};

/**
 * Modifie l'état d'un catway depuis le formulaire.
 * @route PUT /dashboard/catways/:id
 */
exports.updateCatway = async (req, res) => {
  try {
    const catway = await Catway.findOne({ catwayNumber: Number(req.params.id) });
    if (!catway) return redirectWithMessage(res, '/dashboard/catways', 'error', 'Catway introuvable');

    catway.catwayState = req.body.catwayState;
    await catway.save();
    redirectWithMessage(res, '/dashboard/catways', 'success', `Catway ${catway.catwayNumber} modifié`);
  } catch (err) {
    redirectWithMessage(res, '/dashboard/catways', 'error', err.message);
  }
};

/**
 * Supprime un catway depuis le formulaire.
 * @route DELETE /dashboard/catways/:id
 */
exports.deleteCatway = async (req, res) => {
  const catway = await Catway.findOneAndDelete({ catwayNumber: Number(req.params.id) });
  if (!catway) return redirectWithMessage(res, '/dashboard/catways', 'error', 'Catway introuvable');

  redirectWithMessage(res, '/dashboard/catways', 'success', `Catway ${catway.catwayNumber} supprimé`);
};
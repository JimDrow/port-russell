const Reservation = require('../models/Reservation');
const Catway = require('../models/Catway');
const mongoose = require('mongoose');
const { isOverlapping } = require('./reservationController');
const User = require('../models/User');

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

/* ========== RÉSERVATIONS ========== */

/**
 * Affiche la page de gestion des réservations.
 * @route GET /dashboard/reservations
 */
exports.reservationsPage = async (req, res) => {
  const reservations = await Reservation.find().sort({ startDate: -1 });
  const catways = await Catway.find().sort({ catwayNumber: 1 });
  res.render('reservations', {
    reservations,
    catways,
    success: req.query.success,
    error: req.query.error
  });
};

/**
 * Crée une réservation depuis le formulaire.
 * @route POST /dashboard/reservations
 */
exports.createReservation = async (req, res) => {
  const page = '/dashboard/reservations';
  try {
    const { catwayNumber, clientName, boatName, startDate, endDate } = req.body;

    const catway = await Catway.findOne({ catwayNumber: Number(catwayNumber) });
    if (!catway) return redirectWithMessage(res, page, 'error', 'Catway introuvable');

    const reservation = new Reservation({ catwayNumber, clientName, boatName, startDate, endDate });
    await reservation.validate();

    if (await isOverlapping(reservation.catwayNumber, reservation.startDate, reservation.endDate)) {
      return redirectWithMessage(res, page, 'error', 'Ce catway est déjà réservé sur cette période');
    }

    await reservation.save();
    redirectWithMessage(res, page, 'success', `Réservation de ${clientName} créée`);
  } catch (err) {
    redirectWithMessage(res, page, 'error', err.message);
  }
};

/**
 * Affiche le formulaire de modification d'une réservation.
 * @route GET /dashboard/reservations/:id/edit
 */
exports.editReservationPage = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return redirectWithMessage(res, '/dashboard/reservations', 'error', 'Réservation introuvable');
  }
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    return redirectWithMessage(res, '/dashboard/reservations', 'error', 'Réservation introuvable');
  }
  res.render('reservation-edit', { reservation, error: req.query.error });
};

/**
 * Modifie une réservation depuis le formulaire.
 * @route PUT /dashboard/reservations/:id
 */
exports.updateReservation = async (req, res) => {
  const listPage = '/dashboard/reservations';
  if (!mongoose.isValidObjectId(req.params.id)) {
    return redirectWithMessage(res, listPage, 'error', 'Réservation introuvable');
  }
  const editPage = `/dashboard/reservations/${req.params.id}/edit`;

  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return redirectWithMessage(res, listPage, 'error', 'Réservation introuvable');

    const { clientName, boatName, startDate, endDate } = req.body;
    reservation.clientName = clientName;
    reservation.boatName = boatName;
    reservation.startDate = startDate;
    reservation.endDate = endDate;
    await reservation.validate();

    if (await isOverlapping(reservation.catwayNumber, reservation.startDate, reservation.endDate, reservation._id)) {
      return redirectWithMessage(res, editPage, 'error', 'Ce catway est déjà réservé sur cette période');
    }

    await reservation.save();
    redirectWithMessage(res, listPage, 'success', 'Réservation modifiée');
  } catch (err) {
    redirectWithMessage(res, editPage, 'error', err.message);
  }
};

/**
 * Supprime une réservation depuis le formulaire.
 * @route DELETE /dashboard/reservations/:id
 */
exports.deleteReservation = async (req, res) => {
  const page = '/dashboard/reservations';
  if (!mongoose.isValidObjectId(req.params.id)) {
    return redirectWithMessage(res, page, 'error', 'Réservation introuvable');
  }
  const reservation = await Reservation.findByIdAndDelete(req.params.id);
  if (!reservation) return redirectWithMessage(res, page, 'error', 'Réservation introuvable');

  redirectWithMessage(res, page, 'success', `Réservation de ${reservation.clientName} supprimée`);
};

/* ========== UTILISATEURS ========== */

/**
 * Affiche la page de gestion des utilisateurs.
 * @route GET /dashboard/users
 */
exports.usersPage = async (req, res) => {
  const users = await User.find().select('-password').sort({ username: 1 });
  res.render('users', {
    users,
    success: req.query.success,
    error: req.query.error
  });
};

/**
 * Crée un utilisateur depuis le formulaire.
 * @route POST /dashboard/users
 */
exports.createUser = async (req, res) => {
  const page = '/dashboard/users';
  try {
    const { username, email, password } = req.body;
    await User.create({ username, email, password });
    redirectWithMessage(res, page, 'success', `Utilisateur ${email} créé`);
  } catch (err) {
    const message = err.code === 11000 ? 'Cet e-mail est déjà utilisé' : err.message;
    redirectWithMessage(res, page, 'error', message);
  }
};

/**
 * Affiche le formulaire de modification d'un utilisateur.
 * @route GET /dashboard/users/:email/edit
 */
exports.editUserPage = async (req, res) => {
  const editedUser = await User.findOne({ email: req.params.email.toLowerCase() }).select('-password');
  if (!editedUser) {
    return redirectWithMessage(res, '/dashboard/users', 'error', 'Utilisateur introuvable');
  }
  res.render('user-edit', { editedUser, error: req.query.error });
};

/**
 * Modifie un utilisateur depuis le formulaire.
 * Si l'utilisateur modifie son propre compte, il est déconnecté
 * pour se reconnecter avec ses nouvelles informations.
 * @route PUT /dashboard/users/:email
 */
exports.updateUser = async (req, res) => {
  const listPage = '/dashboard/users';
  const editPage = `/dashboard/users/${encodeURIComponent(req.params.email)}/edit`;

  try {
    const editedUser = await User.findOne({ email: req.params.email.toLowerCase() });
    if (!editedUser) return redirectWithMessage(res, listPage, 'error', 'Utilisateur introuvable');

    const isSelf = editedUser.email === req.user.email;

    const { username, email, password } = req.body;
    editedUser.username = username;
    editedUser.email = email;
    if (password) editedUser.password = password; // re-haché par le modèle

    await editedUser.save();

    if (isSelf) {
      // Ses infos ont changé : on le déconnecte pour qu'il récupère un jeton à jour
      res.clearCookie('token');
      return res.redirect('/');
    }
    redirectWithMessage(res, listPage, 'success', `Utilisateur ${editedUser.email} modifié`);
  } catch (err) {
    const message = err.code === 11000 ? 'Cet e-mail est déjà utilisé' : err.message;
    redirectWithMessage(res, editPage, 'error', message);
  }
};

/**
 * Supprime un utilisateur depuis le formulaire.
 * Impossible de supprimer son propre compte.
 * @route DELETE /dashboard/users/:email
 */
exports.deleteUser = async (req, res) => {
  const page = '/dashboard/users';
  const email = req.params.email.toLowerCase();

  if (email === req.user.email) {
    return redirectWithMessage(res, page, 'error', 'Vous ne pouvez pas supprimer votre propre compte');
  }

  const deleted = await User.findOneAndDelete({ email });
  if (!deleted) return redirectWithMessage(res, page, 'error', 'Utilisateur introuvable');

  redirectWithMessage(res, page, 'success', `Utilisateur ${deleted.email} supprimé`);
};
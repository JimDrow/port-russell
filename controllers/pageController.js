const Reservation = require('../models/Reservation');

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
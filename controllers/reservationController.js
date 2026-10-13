const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Catway = require('../models/Catway');

/**
 * Transforme le paramètre :id de l'URL en numéro de catway.
 * @param {string} id - Valeur reçue dans l'URL
 * @returns {number|null} Le numéro, ou null s'il est invalide
 */
function parseCatwayNumber(id) {
  const number = Number(id);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/**
 * Vérifie si le catway est déjà réservé sur la période demandée.
 * @param {number} catwayNumber - Numéro du catway
 * @param {Date} startDate - Début de la période
 * @param {Date} endDate - Fin de la période
 * @param {string} [excludeId] - Réservation à ignorer (utile lors d'une modification)
 * @returns {Promise<boolean>} true si la période chevauche une autre réservation
 */
async function isOverlapping(catwayNumber, startDate, endDate, excludeId) {
  const filter = {
    catwayNumber,
    startDate: { $lt: endDate },
    endDate: { $gt: startDate }
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return (await Reservation.exists(filter)) !== null;
}

/**
 * Liste les réservations d'un catway.
 * @route GET /catways/:id/reservations
 */
exports.getAll = async (req, res) => {
  const number = parseCatwayNumber(req.params.id);
  if (!number) return res.status(400).json({ message: 'Numéro de catway invalide' });

  const reservations = await Reservation.find({ catwayNumber: number }).sort({ startDate: 1 });
  res.status(200).json(reservations);
};

/**
 * Récupère une réservation précise d'un catway.
 * @route GET /catways/:id/reservations/:idReservation
 */
exports.getById = async (req, res) => {
  const number = parseCatwayNumber(req.params.id);
  if (!number) return res.status(400).json({ message: 'Numéro de catway invalide' });
  if (!mongoose.isValidObjectId(req.params.idReservation)) {
    return res.status(400).json({ message: 'Identifiant de réservation invalide' });
  }

  const reservation = await Reservation.findOne({
    _id: req.params.idReservation,
    catwayNumber: number
  });
  if (!reservation) return res.status(404).json({ message: 'Réservation introuvable' });

  res.status(200).json(reservation);
};

/**
 * Crée une réservation pour un catway.
 * @route POST /catways/:id/reservations
 */
exports.create = async (req, res) => {
  const number = parseCatwayNumber(req.params.id);
  if (!number) return res.status(400).json({ message: 'Numéro de catway invalide' });

  // Le catway doit exister
  const catway = await Catway.findOne({ catwayNumber: number });
  if (!catway) return res.status(404).json({ message: 'Catway introuvable' });

  try {
    const { clientName, boatName, startDate, endDate } = req.body;
    const reservation = new Reservation({
      catwayNumber: number,
      clientName,
      boatName,
      startDate,
      endDate
    });

    // Vérifie les règles du modèle (champs obligatoires, dates...)
    await reservation.validate();

    if (await isOverlapping(number, reservation.startDate, reservation.endDate)) {
      return res.status(409).json({ message: 'Ce catway est déjà réservé sur cette période' });
    }

    await reservation.save();
    res.status(201).json(reservation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Modifie une réservation (client, bateau, dates).
 * @route PUT /catways/:id/reservations/:idReservation
 */
exports.update = async (req, res) => {
  const number = parseCatwayNumber(req.params.id);
  if (!number) return res.status(400).json({ message: 'Numéro de catway invalide' });
  if (!mongoose.isValidObjectId(req.params.idReservation)) {
    return res.status(400).json({ message: 'Identifiant de réservation invalide' });
  }

  const reservation = await Reservation.findOne({
    _id: req.params.idReservation,
    catwayNumber: number
  });
  if (!reservation) return res.status(404).json({ message: 'Réservation introuvable' });

  try {
    // On ne modifie que les champs envoyés
    const { clientName, boatName, startDate, endDate } = req.body;
    if (clientName !== undefined) reservation.clientName = clientName;
    if (boatName !== undefined) reservation.boatName = boatName;
    if (startDate !== undefined) reservation.startDate = startDate;
    if (endDate !== undefined) reservation.endDate = endDate;

    await reservation.validate();

    if (await isOverlapping(number, reservation.startDate, reservation.endDate, reservation._id)) {
      return res.status(409).json({ message: 'Ce catway est déjà réservé sur cette période' });
    }

    await reservation.save();
    res.status(200).json(reservation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Supprime une réservation.
 * @route DELETE /catways/:id/reservations/:idReservation
 */
exports.remove = async (req, res) => {
  const number = parseCatwayNumber(req.params.id);
  if (!number) return res.status(400).json({ message: 'Numéro de catway invalide' });
  if (!mongoose.isValidObjectId(req.params.idReservation)) {
    return res.status(400).json({ message: 'Identifiant de réservation invalide' });
  }

  const reservation = await Reservation.findOneAndDelete({
    _id: req.params.idReservation,
    catwayNumber: number
  });
  if (!reservation) return res.status(404).json({ message: 'Réservation introuvable' });

  res.status(200).json({ message: 'Réservation supprimée' });
};
const express = require('express');
// mergeParams : permet de récupérer le :id du catway défini dans app.js
const router = express.Router({ mergeParams: true });
const reservationController = require('../controllers/reservationController');

/**
 * Routes de gestion des réservations (sous-ressource des catways).
 * :id représente le numéro du catway.
 * :idReservation représente l'identifiant MongoDB de la réservation.
 */
router.get('/', reservationController.getAll);
router.get('/:idReservation', reservationController.getById);
router.post('/', reservationController.create);
router.put('/:idReservation', reservationController.update);
router.delete('/:idReservation', reservationController.remove);

module.exports = router;
const express = require('express');
const router = express.Router();
const catwayController = require('../controllers/catwayController');

/**
 * Routes de gestion des catways.
 * :id représente le numéro du catway.
 */
router.get('/', catwayController.getAll);
router.get('/:id', catwayController.getById);
router.post('/', catwayController.create);
router.put('/:id', catwayController.update);
router.delete('/:id', catwayController.remove);

module.exports = router;
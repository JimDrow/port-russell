const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/**
 * Routes de gestion des utilisateurs.
 * :email représente l'adresse e-mail de l'utilisateur.
 */
router.get('/', userController.getAll);
router.get('/:email', userController.getByEmail);
router.post('/', userController.create);
router.put('/:email', userController.update);
router.delete('/:email', userController.remove);

module.exports = router;
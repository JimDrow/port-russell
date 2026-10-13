const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

/**
 * Rend l'utilisateur connecté disponible dans toutes les vues
 * (utile pour afficher le menu dans le header).
 */
router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

/**
 * Routes des pages du tableau de bord (HTML).
 */
router.get('/', pageController.dashboard);

// Catways
router.get('/catways', pageController.catwaysPage);
router.post('/catways', pageController.createCatway);
router.put('/catways/:id', pageController.updateCatway);
router.delete('/catways/:id', pageController.deleteCatway);

module.exports = router;
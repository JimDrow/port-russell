const jwt = require('jsonwebtoken');

/**
 * Middleware de protection des routes.
 * Vérifie la présence et la validité du jeton JWT (cookie ou en-tête Authorization).
 * Si le jeton est valide, les infos de l'utilisateur sont placées dans req.user.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
module.exports = (req, res, next) => {
  // 1. On cherche le bracelet : d'abord dans le cookie...
  let token = req.cookies?.token;

  // ...sinon dans l'en-tête "Authorization: Bearer xxx"
  const header = req.headers.authorization;
  if (!token && header && header.startsWith('Bearer ')) {
    token = header.slice(7);
  }

  // 2. On vérifie le bracelet
  try {
    if (!token) throw new Error('Aucun jeton');
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next(); // ✅ Accès autorisé, on passe à la suite
  } catch (err) {
    // ❌ Pas de bracelet ou bracelet invalide
    if (req.accepts(['json', 'html']) === 'html') {
      return res.redirect('/'); // un humain dans un navigateur → page d'accueil
    }
    res.status(401).json({ message: 'Authentification requise' });
  }
};
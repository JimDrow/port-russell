const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/** Durée de validité du jeton : 2 heures */
const TOKEN_DURATION_MS = 2 * 60 * 60 * 1000;

/**
 * Connecte un utilisateur : vérifie e-mail + mot de passe,
 * puis dépose un jeton JWT dans un cookie.
 * Répond en JSON (appel API) ou redirige vers le tableau de bord (formulaire).
 * @route POST /login
 */
exports.login = async (req, res) => {
  const isApiCall = req.is('application/json');
  const { email, password } = req.body;

  // Fonction utilitaire pour répondre en cas d'échec
  const fail = () => {
    if (isApiCall) return res.status(401).json({ message: 'E-mail ou mot de passe incorrect' });
    return res.redirect('/?error=1');
  };

  if (!email || !password) return fail();

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return fail();

  // Compare le mot de passe saisi avec l'empreinte en base
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return fail();

  // Fabrication du bracelet 🎫
  const token = jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  // Rangement du bracelet dans un cookie
  res.cookie('token', token, {
    httpOnly: true,                                  // illisible par le JavaScript de la page
    sameSite: 'lax',                                 // protège contre certaines attaques
    secure: process.env.NODE_ENV === 'production',   // HTTPS obligatoire une fois en ligne
    maxAge: TOKEN_DURATION_MS
  });

  if (isApiCall) return res.status(200).json({ message: 'Connexion réussie', token });
  res.redirect('/dashboard');
};

/**
 * Déconnecte l'utilisateur : supprime le cookie et renvoie à l'accueil.
 * @route GET /logout
 */
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};
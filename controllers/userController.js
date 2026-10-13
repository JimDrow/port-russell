const User = require('../models/User');

/**
 * Retire le mot de passe d'un utilisateur avant de l'envoyer.
 * @param {Object} user - Document utilisateur Mongoose
 * @returns {Object} Utilisateur sans mot de passe
 */
function withoutPassword(user) {
  const { password, ...rest } = user.toObject();
  return rest;
}

/**
 * Liste tous les utilisateurs (sans les mots de passe).
 * @route GET /users
 */
exports.getAll = async (req, res) => {
  const users = await User.find().select('-password').sort({ username: 1 });
  res.status(200).json(users);
};

/**
 * Récupère un utilisateur par son e-mail.
 * @route GET /users/:email
 */
exports.getByEmail = async (req, res) => {
  const user = await User.findOne({ email: req.params.email.toLowerCase() }).select('-password');
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

  res.status(200).json(user);
};

/**
 * Crée un utilisateur (le mot de passe est haché par le modèle).
 * @route POST /users
 */
exports.create = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.create({ username, email, password });
    res.status(201).json(withoutPassword(user));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Cet e-mail est déjà utilisé' });
    }
    res.status(400).json({ message: err.message });
  }
};

/**
 * Modifie un utilisateur (nom, e-mail et/ou mot de passe).
 * @route PUT /users/:email
 */
exports.update = async (req, res) => {
  const user = await User.findOne({ email: req.params.email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

  try {
    // On ne modifie que les champs envoyés
    const { username, email, password } = req.body;
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (password) user.password = password; // sera re-haché automatiquement

    await user.save();
    res.status(200).json(withoutPassword(user));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Cet e-mail est déjà utilisé' });
    }
    res.status(400).json({ message: err.message });
  }
};

/**
 * Supprime un utilisateur.
 * @route DELETE /users/:email
 */
exports.remove = async (req, res) => {
  const user = await User.findOneAndDelete({ email: req.params.email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

  res.status(200).json({ message: `Utilisateur ${user.email} supprimé` });
};
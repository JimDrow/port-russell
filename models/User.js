const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Schéma d'un utilisateur de la capitainerie.
 * @typedef {Object} User
 * @property {string} username - Nom d'utilisateur
 * @property {string} email - Adresse e-mail (unique)
 * @property {string} password - Mot de passe (stocké haché)
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Le nom d'utilisateur est obligatoire"],
    trim: true,
    minlength: [3, "Le nom d'utilisateur doit faire au moins 3 caractères"]
  },
  email: {
    type: String,
    required: [true, "L'e-mail est obligatoire"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Format d'e-mail invalide"]
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [8, 'Le mot de passe doit faire au moins 8 caractères']
  }
});

/**
 * Avant chaque sauvegarde, on hache le mot de passe
 * (seulement s'il a été modifié).
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);
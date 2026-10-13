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
 * Liste tous les catways.
 * @route GET /catways
 */
exports.getAll = async (req, res) => {
  const catways = await Catway.find().sort({ catwayNumber: 1 });
  res.status(200).json(catways);
};

/**
 * Récupère un catway par son numéro.
 * @route GET /catways/:id
 */
exports.getById = async (req, res) => {
  const number = parseCatwayNumber(req.params.id);
  if (!number) return res.status(400).json({ message: 'Numéro de catway invalide' });

  const catway = await Catway.findOne({ catwayNumber: number });
  if (!catway) return res.status(404).json({ message: 'Catway introuvable' });

  res.status(200).json(catway);
};

/**
 * Crée un nouveau catway.
 * @route POST /catways
 */
exports.create = async (req, res) => {
  try {
    // On ne prend que les champs attendus (style défensif)
    const { catwayNumber, catwayType, catwayState } = req.body;
    const catway = await Catway.create({ catwayNumber, catwayType, catwayState });
    res.status(201).json(catway);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Ce numéro de catway existe déjà' });
    }
    res.status(400).json({ message: err.message });
  }
};

/**
 * Modifie l'état d'un catway (le numéro et le type ne sont pas modifiables).
 * @route PUT /catways/:id
 */
exports.update = async (req, res) => {
  const number = parseCatwayNumber(req.params.id);
  if (!number) return res.status(400).json({ message: 'Numéro de catway invalide' });

  const catway = await Catway.findOne({ catwayNumber: number });
  if (!catway) return res.status(404).json({ message: 'Catway introuvable' });

  try {
    catway.catwayState = req.body.catwayState;
    await catway.save();
    res.status(200).json(catway);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Supprime un catway.
 * @route DELETE /catways/:id
 */
exports.remove = async (req, res) => {
  const number = parseCatwayNumber(req.params.id);
  if (!number) return res.status(400).json({ message: 'Numéro de catway invalide' });

  const catway = await Catway.findOneAndDelete({ catwayNumber: number });
  if (!catway) return res.status(404).json({ message: 'Catway introuvable' });

  res.status(200).json({ message: `Catway ${number} supprimé` });
};
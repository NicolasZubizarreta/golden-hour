const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // On récupère le header "Authorization"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Accès refusé. Token manquant." });
  }

  // On extrait le token (après le mot "Bearer")
  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT_SECRET manquant côté serveur.' });
  }

  try {
    // On vérifie si le token est valide avec notre clé secrète
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // On attache les infos de l'utilisateur à la requête
    next(); // On laisse passer
  } catch (error) {
    res.status(401).json({ message: "Token invalide." });
  }
};

module.exports = verifyToken;

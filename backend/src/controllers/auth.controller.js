const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return process.env.JWT_SECRET;
};

const normalizeEmail = (email) => {
  if (typeof email !== 'string') {
    return '';
  }

  return email.trim().toLowerCase();
};

// --- INSCRIPTION ---
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedEmail || typeof password !== 'string' || !password || !normalizedName) {
      return res.status(400).json({
        message: 'Les champs name, email et password sont obligatoires.',
      });
    }

    // 1. Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // 2. Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Créer l'utilisateur en BDD
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedName,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "Utilisateur créé avec succès !", userId: newUser.id });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// --- CONNEXION ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({
        message: 'Les champs email et password sont obligatoires.',
      });
    }

    // 1. Chercher l'utilisateur
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect." });
    }

    // 2. Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect." });
    }

    // 3. Générer le Token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email }, // Infos cachées dans le token
      getJwtSecret(), // Clé secrète du .env
      { expiresIn: '24h' } // Durée de vie du token
    );

    res.status(200).json({ 
        message: "Connexion réussie", 
        token, 
        user: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

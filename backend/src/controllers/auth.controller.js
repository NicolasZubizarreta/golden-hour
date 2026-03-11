const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/mailer');

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

// --- MOT DE PASSE OUBLIÉ (Générer le Token et envoyer l'email) ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Veuillez fournir un email valide." });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // RÈGLE DE SÉCURITÉ : Même si l'utilisateur n'existe pas, on renvoie un message de succès.
    if (!user) {
      return res.status(200).json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
    }

    // 1. Générer un Token sécurisé et unique de 32 octets
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 2. Définir la date d'expiration (Dans 1 heure)
    const resetPasswordExpires = new Date(Date.now() + 3600000); 

    // 3. Sauvegarder dans la base de données
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetPasswordExpires
      }
    });

    // 4. Envoi du mail
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      
      // Si l'email part bien, on répond au front-end que c'est un succès
      return res.status(200).json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
      
    } catch (emailError) {
      console.error("Erreur d'envoi d'email :", emailError);
      
      // SÉCURITÉ : Si l'email n'a pas pu partir (bug serveur), on efface le token de la BDD
      await prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: null, resetPasswordExpires: null }
      });
      
      return res.status(500).json({ message: "Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard." });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};


// --- RÉINITIALISER LE MOT DE PASSE (Valider le Token) ---
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (typeof token !== 'string' || !token.trim() || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: "Token invalide ou mot de passe trop court (min. 6 caractères)." });
    }

    // 1. Chercher un utilisateur qui a CE token, ET dont la date d'expiration est > à maintenant
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token.trim(),
        resetPasswordExpires: {
          gt: new Date() // greater than (plus grand que la date actuelle)
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: "Le lien de réinitialisation est invalide ou a expiré." });
    }

    // 2. Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 3. Mettre à jour le mot de passe ET effacer le token/date de la BDD (Très important !)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.status(200).json({ message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

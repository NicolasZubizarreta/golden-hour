const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const {
  getAvatarPublicPath,
  removeUploadedFile,
} = require('../utils/uploads');

const normalizeEmail = (email) => {
  if (typeof email !== 'string') {
    return null;
  }

  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
    return null;
  }

  return trimmedEmail;
};

// --- 1. MODIFIER SON PROFIL (PUT /me) ---
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ message: "Veuillez fournir un nom ou un email à modifier." });
    }

    // Préparer les données à mettre à jour
    const dataToUpdate = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: "Le nom doit être une chaîne de caractères non vide." });
      }

      dataToUpdate.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail) {
        return res.status(400).json({ message: "Format d'email invalide." });
      }

      dataToUpdate.email = normalizedEmail;

      // Vérifier si le nouvel email n'est pas déjà pris par quelqu'un d'autre
      const existingUser = await prisma.user.findUnique({ where: { email: dataToUpdate.email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Cet email est déjà utilisé par un autre compte." });
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ message: "Aucune donnée valide à mettre à jour." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { id: true, name: true, email: true, avatar: true, createdAt: true } // On ne renvoie PAS le mot de passe
    });

    res.status(200).json({ message: "Profil mis à jour avec succès.", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- 2. MODIFIER SON MOT DE PASSE (PUT /me/password) ---
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (typeof oldPassword !== 'string' || typeof newPassword !== 'string' || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "L'ancien et le nouveau mot de passe sont requis." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
    }

    // Récupérer l'utilisateur avec son mot de passe actuel
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    // Vérifier que l'ancien mot de passe est correct
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "L'ancien mot de passe est incorrect." });
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.status(200).json({ message: "Mot de passe modifié avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- 3. METTRE À JOUR SON AVATAR (POST /me/avatar) ---
exports.uploadAvatar = async (req, res) => {
  const newAvatarPath = getAvatarPublicPath(req.file);

  try {
    const userId = req.user.id;

    if (!newAvatarPath) {
      return res.status(400).json({ message: "Veuillez sélectionner une image d'avatar." });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, avatar: true },
    });

    if (!currentUser) {
      await removeUploadedFile(newAvatarPath);
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: newAvatarPath },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    });

    if (currentUser.avatar && currentUser.avatar !== newAvatarPath) {
      await removeUploadedFile(currentUser.avatar);
    }

    res.status(200).json({
      message: "Avatar mis à jour avec succès.",
      user: updatedUser,
    });
  } catch (error) {
    await removeUploadedFile(newAvatarPath);
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- 4. SUPPRIMER SON COMPTE (DELETE /me) ---
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // RÈGLE MÉTIER ABSOLUE : L'utilisateur est-il créateur d'un groupe ?
    const createdGroups = await prisma.group.findFirst({
      where: { createdById: userId }
    });

    if (createdGroups) {
      return res.status(400).json({ 
        message: "Impossible de supprimer votre compte. Vous êtes le propriétaire d'un ou plusieurs groupes. Veuillez transférer la propriété ou supprimer ces groupes d'abord." 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Si on arrive ici, il n'est créateur de rien. On peut le supprimer.
    // Grâce au onDelete: Cascade sur GroupMember, il disparaîtra de tous les groupes où il était simple membre/éditeur.
    await prisma.user.delete({
      where: { id: userId }
    });

    if (user?.avatar) {
      await removeUploadedFile(user.avatar);
    }

    res.status(200).json({ message: "Votre compte a été supprimé définitivement." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

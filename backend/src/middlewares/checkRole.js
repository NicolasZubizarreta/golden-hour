const prisma = require('../lib/prisma');

const parsePositiveInt = (value) => {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null;
  }

  return parseInt(value, 10);
};

const normalizeRole = (role) => {
  if (typeof role !== 'string') {
    return null;
  }

  return role.trim().toUpperCase();
};

// On crée une fonction qui prend en paramètre les rôles autorisés (ex: ['ADMIN', 'EDITOR'])
const checkRole = (allowedRoles, options = {}) => {
  const {
    allowSelf = false,
    creatorOnly = false,
  } = options;

  return async (req, res, next) => {
    try {
      const userId = req.user.id; // Récupéré grâce au verifyToken qui s'exécute avant
      const groupId = parsePositiveInt(req.params.id); // L'ID du groupe dans l'URL (/api/groups/:id/...)
      const targetUserId = req.params.userId ? parsePositiveInt(req.params.userId) : null;

      if (groupId === null) {
        return res.status(400).json({ message: "ID du groupe invalide." });
      }

      if (req.params.userId && targetUserId === null) {
        return res.status(400).json({ message: "ID utilisateur invalide." });
      }

      const [group, member] = await Promise.all([
        prisma.group.findUnique({
          where: { id: groupId },
          select: { id: true, createdById: true },
        }),
        prisma.groupMember.findUnique({
          where: {
            userId_groupId: {
              userId: userId,
              groupId: groupId
            }
          }
        }),
      ]);

      if (!group) {
        return res.status(404).json({ message: "Groupe introuvable." });
      }

      // 2. S'il n'est pas membre, accès refusé
      if (!member) {
        return res.status(403).json({ message: "Accès refusé. Vous ne faites pas partie de ce groupe." });
      }

      req.groupContext = group;
      req.requesterMembership = member;

      if (allowSelf && targetUserId === userId) {
        return next();
      }

      // 3. S'il est membre mais n'a pas le bon rôle, accès refusé aussi
      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({ 
          message: `Accès refusé. Rôle insuffisant. Requis: ${allowedRoles.join(' ou ')}.` 
        });
      }

      if (creatorOnly && group.createdById !== userId) {
        return res.status(403).json({
          message: "Seul le créateur du groupe peut effectuer cette action.",
        });
      }

      // 4. C'est bon, il a le droit ! On stocke son rôle dans req au cas où et on laisse passer
      req.memberRole = member.role;
      next();

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la vérification des droits.", error: error.message });
    }
  };
};

module.exports = checkRole;

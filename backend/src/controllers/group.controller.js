const prisma = require('../lib/prisma');
const {
  getCoverPublicPath,
  removeUploadedFile,
} = require('../utils/uploads');

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const parsePositiveInt = (value) => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  return null;
};

// --- 1. CRÉER UN GROUPE (POST) ---
exports.createGroup = async (req, res) => {
  try {
    const { name, type } = req.body;
    const userId = req.user.id;

    // Validation stricte du nom
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: "Le nom du groupe est obligatoire et doit être une chaîne de caractères valide." });
    }

    // Validation stricte du type
    let groupType = 'FRIENDS';
    if (type !== undefined) {
      if (typeof type !== 'string') {
        return res.status(400).json({ message: "Le type de groupe doit être une chaîne de caractères." });
      }
      groupType = type.toUpperCase();
      if (!['COUPLE', 'FRIENDS'].includes(groupType)) {
        return res.status(400).json({ message: "Le type de groupe doit être strictement COUPLE ou FRIENDS." });
      }
    }

    let newGroup = null;
    let attempts = 0;

    // Insertion Atomique avec Retry Pattern (Pour gérer la collision @unique de Prisma)
    while (!newGroup && attempts < 5) {
      try {
        newGroup = await prisma.group.create({
          data: {
            name: name.trim(),
            type: groupType,
            inviteCode: generateInviteCode(),
            createdById: userId,
            members: {
              create: {
                userId: userId,
                role: 'ADMIN'
              }
            }
          },
          include: {
            members: true
          }
        });
      } catch (error) {
        if (error.code === 'P2002') {
          // Collision sur le inviteCode, on incrémente l'essai et on boucle
          attempts++;
        } else {
          // Si c'est une autre erreur, on la renvoie au bloc catch principal
          throw error;
        }
      }
    }

    if (!newGroup) {
      return res.status(500).json({ message: "Impossible de générer un code d'invitation unique après plusieurs tentatives." });
    }

    res.status(201).json({ message: "Groupe créé avec succès !", group: newGroup });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- 2. RÉCUPÉRER MES GROUPES (GET) ---
exports.getGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId: userId }
        }
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          }
        }
      }
    });

    res.status(200).json({ groups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- 3. RÉCUPÉRER UN GROUPE SPÉCIFIQUE (GET /:id) ---
exports.getGroupById = async (req, res) => {
  try {
    const idParam = req.params.id;
    const userId = req.user.id;

    // Validation stricte : l'ID doit être composé UNIQUEMENT de chiffres (Regex)
    if (!/^\d+$/.test(idParam)) {
      return res.status(400).json({ message: "L'ID du groupe fourni dans l'URL est invalide." });
    }

    const groupId = parseInt(idParam, 10);

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: { userId: userId }
        }
      },
      include: {
        widgets: {
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ message: "Groupe introuvable ou accès refusé." });
    }

    res.status(200).json({ group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- 4. METTRE A JOUR LE NOM DU GROUPE (PUT /:id) ---
exports.updateGroup = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);
    const { name } = req.body;

    if (groupId === null) {
      return res.status(400).json({ message: "ID du groupe invalide." });
    }

    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: "Le nom du groupe est obligatoire." });
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        type: true,
        inviteCode: true,
        coverImage: true,
        createdById: true,
      },
    });

    res.status(200).json({
      message: "Nom du groupe mis a jour avec succes.",
      group: updatedGroup,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Groupe introuvable." });
    }

    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- 5. METTRE À JOUR LE FOND D'ÉCRAN DU GROUPE (POST /:id/cover) ---
exports.uploadCover = async (req, res) => {
  const groupId = parsePositiveInt(req.params.id);
  const newCoverPath = getCoverPublicPath(req.file);

  try {
    if (groupId === null) {
      await removeUploadedFile(newCoverPath);
      return res.status(400).json({ message: "ID du groupe invalide." });
    }

    if (!newCoverPath) {
      return res.status(400).json({ message: "Veuillez sélectionner une image de couverture." });
    }

    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, coverImage: true },
    });

    if (!existingGroup) {
      await removeUploadedFile(newCoverPath);
      return res.status(404).json({ message: "Groupe introuvable." });
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: { coverImage: newCoverPath },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    if (existingGroup.coverImage && existingGroup.coverImage !== newCoverPath) {
      await removeUploadedFile(existingGroup.coverImage);
    }

    res.status(200).json({
      message: "Image de couverture mise à jour avec succès.",
      group: updatedGroup,
    });
  } catch (error) {
    await removeUploadedFile(newCoverPath);
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- 5. REJOINDRE UN GROUPE VIA CODE (POST /join) ---
exports.joinGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.trim() === '') {
      return res.status(400).json({ message: "Le code d'invitation est invalide." });
    }

    // Chercher le groupe correspondant au code (en majuscules pour éviter la casse)
    const group = await prisma.group.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() }
    });

    if (!group) {
      return res.status(404).json({ message: "Code d'invitation introuvable ou expiré." });
    }

    // Vérifier si l'utilisateur est déjà dans ce groupe
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: group.id
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ message: "Vous êtes déjà membre de ce groupe." });
    }

    // Ajouter l'utilisateur au groupe avec le rôle "MEMBER"
    await prisma.groupMember.create({
      data: {
        userId: userId,
        groupId: group.id,
        role: 'MEMBER' // Par défaut en rejoignant
      }
    });

    res.status(200).json({ 
      message: "Vous avez rejoint le groupe avec succès !", 
      groupId: group.id,
      groupName: group.name 
    });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "Vous êtes déjà membre de ce groupe." });
    }

    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- 6. MODIFIER LE RÔLE D'UN MEMBRE (PUT) ---
exports.updateMemberRole = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);
    const targetUserId = parsePositiveInt(req.params.userId);
    const requesterId = req.user.id;
    const { role } = req.body;

    if (groupId === null || targetUserId === null) {
      return res.status(400).json({ message: "IDs invalides." });
    }

    if (typeof role !== 'string') {
      return res.status(400).json({ message: "Le rôle doit être une chaîne de caractères." });
    }

    const validRoles = ['EDITOR', 'MEMBER'];
    const newRole = role.trim().toUpperCase();

    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ message: "Le rôle doit être EDITOR ou MEMBER." });
    }

    const group = req.groupContext || await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, createdById: true },
    });

    if (!group) {
      return res.status(404).json({ message: "Groupe introuvable." });
    }

    // On vérifie que le membre cible existe bien dans ce groupe
    const targetMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: targetUserId, groupId: groupId } }
    });

    if (!targetMember) {
      return res.status(404).json({ message: "Cet utilisateur ne fait pas partie du groupe." });
    }

    const isTargetCreator = group.createdById === targetUserId;

    if (isTargetCreator && newRole !== 'ADMIN') {
      return res.status(403).json({ message: "Le créateur du groupe doit conserver le rôle ADMIN." });
    }

    // Mise à jour du rôle
    const updatedMember = await prisma.groupMember.update({
      where: { userId_groupId: { userId: targetUserId, groupId: groupId } },
      data: { role: newRole }
    });

    res.status(200).json({ message: "Rôle mis à jour avec succès.", member: updatedMember });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- 7. EXPULSER UN MEMBRE OU QUITTER LE GROUPE (DELETE) ---
exports.removeMember = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);
    const targetUserId = parsePositiveInt(req.params.userId);
    const requesterId = req.user.id; // Celui qui fait la requête

    if (groupId === null || targetUserId === null) {
      return res.status(400).json({ message: "IDs invalides." });
    }

    const [group, requesterMember, targetMember] = await Promise.all([
      req.groupContext ? Promise.resolve(req.groupContext) : prisma.group.findUnique({
        where: { id: groupId },
        select: { id: true, createdById: true, coverImage: true },
      }),
      req.requesterMembership ? Promise.resolve(req.requesterMembership) : prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: requesterId, groupId: groupId } }
      }),
      prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: targetUserId, groupId: groupId } }
      }),
    ]);

    if (!group) {
      return res.status(404).json({ message: "Groupe introuvable." });
    }

    if (!requesterMember) {
      return res.status(403).json({ message: "Vous ne faites pas partie de ce groupe." });
    }

    if (!targetMember) {
      return res.status(404).json({ message: "Cet utilisateur ne fait pas partie du groupe." });
    }

    const isSelfAction = requesterId === targetUserId;
    const isRequesterCreator = group.createdById === requesterId;
    const isTargetCreator = group.createdById === targetUserId;

    if (isTargetCreator) {
      return res.status(403).json({ message: "Le créateur du groupe ne peut pas être retiré du groupe." });
    }

    // LA LOGIQUE RBAC (Hiérarchie)
    if (!isSelfAction) {
      if (requesterMember.role === 'EDITOR' && targetMember.role !== 'MEMBER') {
        return res.status(403).json({ message: "Accès refusé. Un éditeur ne peut expulser qu'un simple membre." });
      }

      if (requesterMember.role === 'ADMIN' && targetMember.role === 'ADMIN' && !isRequesterCreator) {
        return res.status(403).json({ message: "Seul le créateur du groupe peut expulser un autre administrateur." });
      }
    }

    // Action autorisée, on supprime le membre.
    await prisma.groupMember.delete({
      where: { userId_groupId: { userId: targetUserId, groupId: groupId } }
    });

    if (isSelfAction && requesterId === group.createdById && group.coverImage) {
      await removeUploadedFile(group.coverImage);
    }

    const action = requesterId === targetUserId ? "Vous avez quitté le groupe." : "Membre expulsé avec succès.";
    res.status(200).json({ message: action });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- 8. SUPPRIMER DÉFINITIVEMENT LE GROUPE (DELETE) ---
exports.deleteGroup = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);
    const requesterId = req.user.id;

    if (groupId === null) {
      return res.status(400).json({ message: "ID du groupe invalide." });
    }

    // Le checkRole s'assurera qu'on est bien ADMIN, mais on vérifie par précaution
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, coverImage: true },
    });
    
    if (!group) {
      return res.status(404).json({ message: "Groupe introuvable." });
    }

    // Grâce au onDelete: Cascade dans le schema.prisma, supprimer le groupe
    // supprimera automatiquement tous les membres et les widgets associés
    await prisma.group.delete({
      where: { id: groupId }
    });

    if (group.coverImage) {
      await removeUploadedFile(group.coverImage);
    }

    res.status(200).json({ message: "Le groupe a été supprimé définitivement." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- 9. TRANSFÉRER LA PROPRIÉTÉ DU GROUPE (PUT) ---
exports.transferOwnership = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);
    const newAdminId = parsePositiveInt(req.body.newAdminId);
    const requesterId = req.user.id;

    if (groupId === null || newAdminId === null) {
      return res.status(400).json({ message: "IDs invalides." });
    }

    if (requesterId === newAdminId) {
      return res.status(400).json({ message: "Vous êtes déjà le propriétaire du groupe." });
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ message: "Groupe introuvable." });

    // Vérifier que le futur boss est bien dans le groupe
    const targetMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: newAdminId, groupId: groupId } }
    });

    if (!targetMember) {
      return res.status(404).json({ message: "Le futur propriétaire doit déjà être membre du groupe." });
    }

    if (targetMember.role !== 'EDITOR') {
      return res.status(400).json({ message: "Le futur propriétaire doit déjà avoir le rôle EDITOR." });
    }

    // TRANSACTION PRISMA : On fait les 3 actions en même temps de manière sécurisée
    await prisma.$transaction([
      // 1. Rétrograder le créateur actuel en EDITOR (comme ça il garde des droits)
      prisma.groupMember.update({
        where: { userId_groupId: { userId: requesterId, groupId: groupId } },
        data: { role: 'EDITOR' }
      }),
      // 2. Promouvoir le nouveau membre en ADMIN
      prisma.groupMember.update({
        where: { userId_groupId: { userId: newAdminId, groupId: groupId } },
        data: { role: 'ADMIN' }
      }),
      // 3. Mettre à jour le créateur du groupe dans la table Group
      prisma.group.update({
        where: { id: groupId },
        data: { createdById: newAdminId }
      })
    ]);

    res.status(200).json({ message: "La propriété du groupe a été transférée avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

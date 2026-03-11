const prisma = require('../lib/prisma');

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
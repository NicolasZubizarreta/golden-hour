// Imports des modules externes
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Imports internes (BDD et Routes)
const prisma = require('./lib/prisma');
const authRoutes = require('./routes/auth.routes'); 
const groupRoutes = require('./routes/group.routes');
const userRoutes = require('./routes/user.routes');
const { ensureUploadDirectories } = require('./utils/uploads');

// Initialisation de l'app
const app = express();
ensureUploadDirectories();

const getAllowedOrigins = () => {
  const rawOrigins = process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173';

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return origin.replace(/\/+$/, '');
      }
    });
};

const allowedOrigins = getAllowedOrigins();
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middlewares globaux
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Branchement des routes
app.use('/api/auth', authRoutes); 
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);

// Route de Health Check (Vérification serveur/BDD)
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'OK', message: 'Serveur et BDD opérationnels ! 🚀' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'ERROR', message: 'Erreur BDD' });
  }
});

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const prisma = require('./lib/prisma');
const authRoutes = require('./routes/auth.routes');
const groupRoutes = require('./routes/group.routes');
const userRoutes = require('./routes/user.routes');
const widgetTaskRoutes = require('./routes/widgetTask.routes');
const taskRoutes = require('./routes/task.routes');
const { ensureUploadDirectories } = require('./utils/uploads');

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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middlewares globaux
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Branchement des routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/widgets', widgetTaskRoutes);
app.use('/api/tasks', taskRoutes);

app.use((error, req, res, next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Le fichier envoye est trop volumineux.' });
  }

  return next(error);
});

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
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur réseau ouvert sur le port ${PORT}`));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./lib/prisma');

// On importe tes nouvelles routes d'authentification
const authRoutes = require('./routes/auth.routes'); 

const app = express();
app.use(cors());
app.use(express.json());

// On branche les routes d'authentification sur l'URL /api/auth
app.use('/api/auth', authRoutes); 

// Route de Health Check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'OK', message: 'Serveur et BDD opérationnels ! 🚀' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'ERROR', message: 'Erreur BDD' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));
// index.js - version simplifiée et corrigée
require('dotenv').config();
const app = require('./app/app');
const config = require('./config/env');
const { initializeDatabase, disconnect } = require('./config/dbConnect');
// const apiv1Routes = require('./routes/index');

// app.use('/api/v1',apiv1Routes);

const PORT = config.port || 1997;

// Initialiser et démarrer le serveur
async function startServer() {
  try {
    console.log('🔗 Initialisation de la connexion à la base...');
    await initializeDatabase();
    
    // Démarrer le serveur UNIQUEMENT ICI
    const server = app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`🚀 Serveur PCash API démarré`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environnement: ${config.env}`);
      console.log(`📁 Base: ${config.database.url ? 'Configurée' : 'Non configurée'}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📅 ${new Date().toLocaleString()}`);
      console.log(`========================================`);
    });
    
    // Gestion des erreurs du serveur
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${PORT} est déjà utilisé`);
        console.log(`💡 Essaye de changer PORT dans ton fichier .env`);
        console.log(`💡 Ou utilise: netstat -ano | findstr :${PORT}`);
        process.exit(1);
      } else {
        console.error('❌ Erreur serveur:', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error.message);
    process.exit(1);
  }
}

// Gestion des arrêts propres
process.on('SIGINT', async () => {
  console.log('\n👋 Arrêt gracieux du serveur...');
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔻 Signal de terminaison reçu...');
  await disconnect();
  process.exit(0);
});

// Démarrer l'application
startServer();
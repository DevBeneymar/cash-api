//! Pour la connexion de la base de donnee
const { PrismaClient } = require('@prisma/client');

// Singleton PrismaClient pour éviter les multiples connexions
let prisma;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
      errorFormat: 'pretty',
    });
  }
  return prisma;
}

// Initialiser la connexion à la base
async function initializeDatabase() {
  const prisma = getPrisma();
  
  try {
    // Tester la connexion
    await prisma.$queryRaw`SELECT 1`;
    
    // Récupérer des infos sur la base
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as table_count,
        DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') as connected_at
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `;
    
    console.log('✅ Base de données connectée avec succès');
    console.log(`📊 Nombre de tables: ${dbInfo[0].table_count}`);
    console.log(`🕐 Connecté à: ${dbInfo[0].connected_at}`);
    
    return prisma;
    
  } catch (error) {
    console.error('❌ Erreur de connexion à la base:', error.message);
    
    // En production, on peut essayer de se reconnecter
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Tentative de reconnexion dans 10 secondes...');
      setTimeout(initializeDatabase, 10000);
    } else {
      throw error;
    }
  }
}

// Middleware Express pour injecter Prisma dans les requêtes
function prismaMiddleware(req, res, next) {
  req.prisma = getPrisma();
  next();
}

// Fermer proprement la connexion
async function disconnect() {
  if (prisma) {
    await prisma.$disconnect();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

module.exports = {
  getPrisma,
  initializeDatabase,
  prismaMiddleware,
  disconnect,
  prisma: getPrisma() // Pour une utilisation directe
};
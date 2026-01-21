const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { prismaMiddleware } = require('../config/dbConnect');
const config = require('../config/env'); // ⬅️ CORRECTION ICI
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger'); // Ajoute cette ligne swagger
const apiv1Routes = require('../routes/index');

const { 
  notFoundError, 
  globalErrorHandler,
  prismaErrorHandler 
} = require('../middlewares/errorMiddleware');

const app = express();

app.use('/api/v1',apiv1Routes);
// Middlewares de sécurité
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}));

// Logger des requêtes
app.use(morgan(config.env === 'development' ? 'dev' : 'combined')); // ⬅️ config.env au lieu de config.nodeEnv

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Injecter Prisma dans toutes les requêtes
app.use(prismaMiddleware);

// ✅ Documentation Swagger UI
app.use('/api/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "API-CASH Documentation"
}));

// Routes de test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 API PCash - Gestion Caisse, Produits Et Services',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'MySQL + Prisma',
    status: 'active',
    docs: 'api/v1/api-docs', //documentation
    health: 'api/v1/health'
  });
});

//! Route de santé (health check)
app.get('/api/v1/health', async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    // Vérifier la connexion
    await req.prisma.$queryRaw`SELECT 1`;
    
    // Récupérer plusieurs métriques en parallèle
    const [dbInfo, tableInfo, processList] = await Promise.all([
      // Info de la base
      req.prisma.$queryRaw`
        SELECT 
          DATABASE() as db_name,
          VERSION() as version,
          @@max_connections as max_connections
      `,
      // Tables et tailles (optionnel)
      req.prisma.$queryRaw`
        SELECT 
          COUNT(*) as table_count,
          SUM(data_length + index_length) as total_size_bytes
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `,
      // Connexions actives (optionnel)
      req.prisma.$queryRaw`SHOW PROCESSLIST`
    ]);
     const now = new Date();
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: {
        iso: now.toISOString(), // "2026-01-20T21:58:57.170Z"
        locale: now.toLocaleString('fr-FR'), // "20/01/2026 à 22:58:57"
        date: now.toLocaleDateString('fr-FR'), // "20/01/2026"
        time: now.toLocaleTimeString('fr-FR'), // "22:58:57"
        unix: Math.floor(now.getTime() / 1000), // 1705791537
        ms: now.getTime() // 1705791537170
      },
      responseTime: `${responseTime}ms`,
      database: {
        connected: true,
        name: dbInfo[0]?.db_name,
        version: dbInfo[0]?.version,
        maxConnections: Number(dbInfo[0]?.max_connections || 0),
        tables: Number(tableInfo[0]?.table_count || 0),
        size: tableInfo[0]?.total_size_bytes ? 
          `${Math.round(tableInfo[0].total_size_bytes / 1024 / 1024)} MB` : 
          'unknown',
        activeConnections: Array.isArray(processList) ? processList.length : 0
      },
      system: {
        uptime: `${Math.floor(process.uptime())}s`,
        memory: {
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
        },
        nodeVersion: process.version,
        env: process.env.NODE_ENV || 'development'
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// Routes API (à décommenter quand tu les créeras)
// app.use(`${config.api.prefix}/auth`, require('../routes/auth.routes'));
// app.use(`${config.api.prefix}/users`, require('../routes/user.routes'));
// app.use(`${config.api.prefix}/products`, require('../routes/product.routes'));
// app.use(`${config.api.prefix}/stores`, require('../routes/store.routes'));

// Middleware pour les routes non trouvées
app.use(notFoundError);

app.use(globalErrorHandler);

// Middleware global de gestion d'erreurs
app.use((err, req, res, next) => {
  // Transformer les erreurs Prisma
  if (err.code && err.code.startsWith('P')) {
    err = prismaErrorHandler(err);
  }
  
  // Passer au gestionnaire global
  return globalErrorHandler(err, req, res, next);
});

// Importation route auth


module.exports = app;
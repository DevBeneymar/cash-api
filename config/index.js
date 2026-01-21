require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 1994,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:1994',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT Tokens
  jwt: {
    secret: process.env.JWT_TOKEN_SECRET_KEY,
    activationSecret: process.env.JWT_ACTIVATION_TOKEN_SECRET_KEY,
    accessToken: process.env.JWT_ACCESS_TOKEN,
    refreshToken: process.env.JWT_REFRESH_TOKEN,
    expiresIn: '24h'
  },
  
  // Email
  email: {
    from: process.env.EMAIL_PIWET,
    host: process.env.SMTP_HOST,
    service: process.env.SERVICE_MAIL,
    port: parseInt(process.env.SMTP_PORT) || 587,
    password: process.env.SMTP_PASSWORD
  },
  
  // API
  api: {
    prefix: '/api/v1',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limite chaque IP à 100 requêtes par fenêtre
    }
  }
};

// Validation des variables requises
const requiredVars = ['DATABASE_URL', 'JWT_TOKEN_SECRET_KEY'];
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.warn(`⚠️ Variable d'environnement ${varName} manquante`);
  }
});

module.exports = config;
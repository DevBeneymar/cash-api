// config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API-CASH - Documentation',
      version: '1.0.0',
      description: 'API de gestion de caisse, produits et services',
      contact: {
        name: 'Support API',
        email: 'support@api-cash.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:1997',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.cash.com',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'user', 'cashier'] }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'integer' }
          }
        }
      }
    }
  },
  apis: [
    './routes/*.js',        // Routes principales
    './controllers/*.js',   // Contrôleurs
    './app/*.js'           // Fichiers d'app
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
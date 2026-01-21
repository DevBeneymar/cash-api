const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/AppError');

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      // Récupérer le token du header
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        throw new AppError('Token d\'authentification manquant', 401);
      }

      // Vérifier le token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Vérifier les rôles si spécifiés
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        throw new AppError('Accès non autorisé', 403);
      }

      // Ajouter l'utilisateur à la requête
      req.user = {
        id: decoded.userId,
        role: decoded.role
      };

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        next(new AppError('Token invalide', 401));
      } else if (error.name === 'TokenExpiredError') {
        next(new AppError('Token expiré', 401));
      } else {
        next(error);
      }
    }
  };
};

module.exports = authMiddleware;
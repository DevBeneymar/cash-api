// Gestionnaire d'erreurs global
const globalErrorHandler = (err, req, res, next) => {
  // Définir les valeurs par défaut
  const status = err.status || 'error';
  const message = err.message || 'Une erreur est survenue';
  const statusCode = err.statusCode || 500;
  const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  
  // Log l'erreur pour le debugging
  console.error('🔥 Erreur:', {
    statusCode,
    message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  // Réponse structurée
  res.status(statusCode).json({
    success: false,
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack }),
    ...(err.errors && { errors: err.errors }) // Pour les erreurs de validation
  });
};

// Erreur 404 - Route non trouvée
const notFoundError = (req, res, next) => {
  const error = new Error(`Route ${req.method} ${req.originalUrl} non trouvée`);
  error.statusCode = 404;
  error.status = 'failed';
  next(error);
};

// Wrapper pour les erreurs async/await
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Erreurs Prisma spécifiques
const prismaErrorHandler = (err) => {
  let error = { ...err };
  error.message = err.message;
  
  // Erreur de validation Prisma
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'champ';
    error = new Error(`La valeur du ${field} existe déjà`);
    error.statusCode = 409; // Conflict
    error.status = 'failed';
  }
  
  // Clé étrangère non trouvée
  if (err.code === 'P2003') {
    error = new Error('Référence non valide ou introuvable');
    error.statusCode = 400;
    error.status = 'failed';
  }
  
  // Enregistrement non trouvé
  if (err.code === 'P2025') {
    error = new Error('Enregistrement non trouvé');
    error.statusCode = 404;
    error.status = 'failed';
  }
  
  // Contrainte de validation
  if (err.code === 'P2000') {
    error = new Error('La valeur est trop longue');
    error.statusCode = 400;
    error.status = 'failed';
  }
  
  return error;
};

// Erreur de validation (Joi, etc.)
const validationError = (err) => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message
  }));
  
  return {
    message: 'Erreur de validation',
    errors,
    statusCode: 400,
    status: 'failed'
  };
};

module.exports = {
  globalErrorHandler,
  notFoundError,
  catchAsync,
  prismaErrorHandler,
  validationError
};
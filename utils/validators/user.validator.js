const Joi = require('joi');

// Validation pour la création d'utilisateur (admin)
const createUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères',
      'any.required': 'Le nom est obligatoire'
    }),
    
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Veuillez fournir une adresse email valide',
      'any.required': 'L\'email est obligatoire'
    }),
    
  password: Joi.string()
    .min(8)
    .max(30)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
    .required()
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.max': 'Le mot de passe ne peut pas dépasser 30 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
      'any.required': 'Le mot de passe est obligatoire'
    }),
    
  role: Joi.string()
    .valid('user', 'admin', 'cashier')
    .default('user')
    .required()
    .messages({
      'any.only': 'Le rôle doit être user, admin ou cashier',
      'any.required': 'Le rôle est obligatoire'
    }),
    
  phone: Joi.string()
    .pattern(new RegExp('^[0-9]{10}$'))
    .optional()
    .messages({
      'string.pattern.base': 'Le numéro de téléphone doit contenir 10 chiffres'
    }),
    
  isActive: Joi.boolean()
    .default(true),
    
  storeId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'L\'ID du magasin doit être un nombre',
      'number.positive': 'L\'ID du magasin doit être positif'
    })
});

// Validation pour la mise à jour d'utilisateur
const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères'
    }),
    
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Veuillez fournir une adresse email valide'
    }),
    
  phone: Joi.string()
    .pattern(new RegExp('^[0-9]{10}$'))
    .optional()
    .messages({
      'string.pattern.base': 'Le numéro de téléphone doit contenir 10 chiffres'
    }),
    
  role: Joi.string()
    .valid('user', 'admin', 'cashier')
    .optional()
    .messages({
      'any.only': 'Le rôle doit être user, admin ou cashier'
    }),
    
  isActive: Joi.boolean()
    .optional(),
    
  storeId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'L\'ID du magasin doit être un nombre',
      'number.positive': 'L\'ID du magasin doit être positif'
    })
}).min(1); // Au moins un champ doit être présent

// Validation pour le changement de mot de passe
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Le mot de passe actuel est obligatoire'
    }),
    
  newPassword: Joi.string()
    .min(8)
    .max(30)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
    .required()
    .messages({
      'string.min': 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      'string.max': 'Le nouveau mot de passe ne peut pas dépasser 30 caractères',
      'string.pattern.base': 'Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
      'any.required': 'Le nouveau mot de passe est obligatoire'
    }),
    
  newPasswordConfirm: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Les nouveaux mots de passe ne correspondent pas',
      'any.required': 'La confirmation du nouveau mot de passe est obligatoire'
    })
});

// Validation pour les paramètres de pagination/recherche
const getUserQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'La page doit être un nombre',
      'number.min': 'La page doit être au moins 1'
    }),
    
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'La limite doit être un nombre',
      'number.min': 'La limite doit être au moins 1',
      'number.max': 'La limite ne peut pas dépasser 100'
    }),
    
  search: Joi.string()
    .min(2)
    .optional()
    .messages({
      'string.min': 'La recherche doit contenir au moins 2 caractères'
    }),
    
  role: Joi.string()
    .valid('user', 'admin', 'cashier')
    .optional()
    .messages({
      'any.only': 'Le rôle doit être user, admin ou cashier'
    }),
    
  isActive: Joi.boolean()
    .optional(),
    
  sortBy: Joi.string()
    .valid('name', 'email', 'createdAt', 'updatedAt')
    .default('createdAt')
    .messages({
      'any.only': 'Le tri doit être par name, email, createdAt ou updatedAt'
    }),
    
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': "L'ordre doit être asc ou desc"
    })
});

// Middleware de validation
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const dataToValidate = property === 'query' ? req.query : req.body;
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation échouée',
        errors
      });
    }
    
    // Remplace les données validées
    if (property === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }
    
    next();
  };
};

// Export des validations
module.exports = {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  getUserQuerySchema,
  validateCreateUser: validate(createUserSchema),
  validateUpdateUser: validate(updateUserSchema),
  validateChangePassword: validate(changePasswordSchema),
  validateGetUserQuery: validate(getUserQuerySchema, 'query'),
  validate
};
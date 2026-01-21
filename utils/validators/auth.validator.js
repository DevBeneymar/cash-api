const Joi = require('joi');

// Validation pour l'inscription
const registerSchema = Joi.object({
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
    
  passwordConfirm: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Les mots de passe ne correspondent pas',
      'any.required': 'La confirmation du mot de passe est obligatoire'
    }),
    
  role: Joi.string()
    .valid('user', 'admin', 'cashier')
    .default('user')
    .messages({
      'any.only': 'Le rôle doit être user, admin ou cashier'
    }),
    
  phone: Joi.string()
    .pattern(new RegExp('^[0-9]{10}$'))
    .optional()
    .messages({
      'string.pattern.base': 'Le numéro de téléphone doit contenir 10 chiffres'
    })
});

// Validation pour la connexion
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Veuillez fournir une adresse email valide',
      'any.required': 'L\'email est obligatoire'
    }),
    
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Le mot de passe est obligatoire'
    })
});

// Validation pour la demande de réinitialisation de mot de passe
const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Veuillez fournir une adresse email valide',
      'any.required': 'L\'email est obligatoire'
    })
});

// Validation pour la réinitialisation de mot de passe
const resetPasswordSchema = Joi.object({
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
    
  passwordConfirm: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Les mots de passe ne correspondent pas',
      'any.required': 'La confirmation du mot de passe est obligatoire'
    }),
    
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Le token de réinitialisation est obligatoire'
    })
});

// Validation pour le refresh token
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Le refresh token est obligatoire'
    })
});

// Middleware de validation
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retourne toutes les erreurs, pas seulement la première
      stripUnknown: true // Supprime les champs non définis dans le schéma
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
    
    // Remplace req.body par les données validées (sans champs non autorisés)
    req.body = value;
    next();
  };
};

// Export des schémas et du middleware
module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateForgotPassword: validate(forgotPasswordSchema),
  validateResetPassword: validate(resetPasswordSchema),
  validateRefreshToken: validate(refreshTokenSchema),
  validate // Pour valider d'autres schémas personnalisés
};
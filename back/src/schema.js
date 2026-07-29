// src/schema.js - CORRIGÉ COMPLET
const Joi = require('joi');

// ==================== SCHÉMAS USER ====================
const registerSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Le prénom est obligatoire',
      'string.min': 'Le prénom doit contenir au moins 2 caractères',
      'string.max': 'Le prénom ne peut pas dépasser 50 caractères'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Le nom est obligatoire',
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'L\'email est obligatoire',
      'string.email': 'Format d\'email invalide'
    }),
  address: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.empty': 'L\'adresse est obligatoire',
      'string.min': 'L\'adresse doit contenir au moins 5 caractères'
    }),
  city: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'La ville est obligatoire',
      'string.min': 'La ville doit contenir au moins 2 caractères'
    }),
  state: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Le département/état est obligatoire',
      'string.min': 'Le département/état doit contenir au moins 2 caractères'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Le mot de passe est obligatoire',
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères'
    }),
  isAdmin: Joi.boolean().default(false)
});

const adminRegisterSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.min': 'Le prénom doit contenir au moins 2 caractères',
      'string.max': 'Le prénom ne peut pas dépasser 50 caractères'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'L\'email est obligatoire',
      'string.email': 'Format d\'email invalide'
    }),
  address: Joi.string()
    .min(5)
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.min': 'L\'adresse doit contenir au moins 5 caractères'
    }),
  city: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.min': 'La ville doit contenir au moins 2 caractères'
    }),
  state: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.min': 'Le département/état doit contenir au moins 2 caractères'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Le mot de passe est obligatoire',
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères'
    }),
  isAdmin: Joi.boolean().default(true)
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'L\'email est obligatoire',
      'string.email': 'Format d\'email invalide'
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Le mot de passe est obligatoire'
    })
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Le prénom doit contenir au moins 2 caractères',
      'string.max': 'Le prénom ne peut pas dépasser 50 caractères'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères'
    }),
  address: Joi.string()
    .min(5)
    .max(200)
    .optional()
    .messages({
      'string.min': 'L\'adresse doit contenir au moins 5 caractères',
      'string.max': 'L\'adresse ne peut pas dépasser 200 caractères'
    }),
  city: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'La ville doit contenir au moins 2 caractères',
      'string.max': 'La ville ne peut pas dépasser 100 caractères'
    }),
  state: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Le département/état doit contenir au moins 2 caractères',
      'string.max': 'Le département/état ne peut pas dépasser 50 caractères'
    }),
  currentPassword: Joi.string()
    .optional()
    .messages({
      'string.empty': 'Le mot de passe actuel ne peut pas être vide'
    }),
  newPassword: Joi.string()
    .min(6)
    .optional()
    .messages({
      'string.min': 'Le nouveau mot de passe doit contenir au moins 6 caractères'
    })
}).min(1).messages({
  'object.min': 'Aucune donnée à mettre à jour'
});

// ==================== SCHÉMAS PIZZA ====================
const pizzaCreateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Le nom de la pizza est obligatoire',
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères'
    }),
  description: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.empty': 'La description est obligatoire',
      'string.min': 'La description doit contenir au moins 10 caractères',
      'string.max': 'La description ne peut pas dépasser 500 caractères'
    }),
  basePrice: Joi.number()
    .min(0)
    .max(100)
    .required()
    .messages({
      'number.base': 'Le prix doit être un nombre',
      'number.min': 'Le prix ne peut pas être négatif',
      'number.max': 'Le prix ne peut pas dépasser 100€',
      'any.required': 'Le prix est obligatoire'
    }),
  category: Joi.string()
    .valid('classic', 'special', 'vegetarian', 'spicy', 'custom')
    .default('classic')
    .messages({
      'any.only': 'Catégorie invalide. Options: classic, special, vegetarian, spicy, custom'
    }),
  ingredients: Joi.array()
    .items(Joi.string().trim())
    .default([]),
  imageUrl: Joi.string()
    .uri()
    .allow('')
    .default('')
    .messages({
      'string.uri': 'URL d\'image invalide'
    }),
  isAvailable: Joi.boolean()
    .default(true)
});

const pizzaUpdateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères'
    }),
  description: Joi.string()
    .min(10)
    .max(500)
    .messages({
      'string.min': 'La description doit contenir au moins 10 caractères',
      'string.max': 'La description ne peut pas dépasser 500 caractères'
    }),
  basePrice: Joi.number()
    .min(0)
    .max(100)
    .messages({
      'number.base': 'Le prix doit être un nombre',
      'number.min': 'Le prix ne peut pas être négatif',
      'number.max': 'Le prix ne peut pas dépasser 100€'
    }),
  category: Joi.string()
    .valid('classic', 'special', 'vegetarian', 'spicy', 'custom')
    .messages({
      'any.only': 'Catégorie invalide. Options: classic, special, vegetarian, spicy, custom'
    }),
  ingredients: Joi.array()
    .items(Joi.string().trim()),
  imageUrl: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'URL d\'image invalide'
    }),
  isAvailable: Joi.boolean()
}).min(1).messages({
  'object.min': 'Aucune donnée à mettre à jour'
});

// ==================== SCHÉMA PIZZA PERSONNALISÉE ====================
const customPizzaSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Le nom de la pizza est obligatoire',
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères'
    }),
  description: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.empty': 'La description est obligatoire',
      'string.min': 'La description doit contenir au moins 10 caractères',
      'string.max': 'La description ne peut pas dépasser 500 caractères'
    }),
  basePrice: Joi.number()
    .min(0)
    .max(100)
    .required()
    .messages({
      'number.base': 'Le prix doit être un nombre',
      'number.min': 'Le prix ne peut pas être négatif',
      'number.max': 'Le prix ne peut pas dépasser 100€',
      'any.required': 'Le prix est obligatoire'
    }),
  category: Joi.string()
    .valid('classic', 'special', 'vegetarian', 'spicy', 'custom')
    .default('custom')
    .messages({
      'any.only': 'Catégorie invalide. Options: classic, special, vegetarian, spicy, custom'
    }),
  ingredients: Joi.array()
    .items(Joi.string().trim())
    .default([]),
  config: Joi.object({
    size: Joi.string()
      .valid('small', 'medium', 'large')
      .required()
      .messages({
        'any.only': 'Taille invalide. Options: small, medium, large',
        'any.required': 'La taille est obligatoire'
      }),
    crust: Joi.string()
      .valid('thin', 'pan', 'stuffed')
      .required()
      .messages({
        'any.only': 'Type de pâte invalide. Options: thin, pan, stuffed',
        'any.required': 'Le type de pâte est obligatoire'
      }),
    toppings: Joi.array()
      .items(Joi.string())
      .default([])
  }).required(),
  imageUrl: Joi.string()
    .uri()
    .allow('')
    .default('')
    .messages({
      'string.uri': 'URL d\'image invalide'
    }),
  isAvailable: Joi.boolean()
    .default(true)
});

// ==================== SCHÉMAS CART ====================
const cartItemSchema = Joi.object({
  pizzaId: Joi.string()
    .required()
    .messages({
      'string.empty': 'L\'ID de la pizza est obligatoire'
    }),
  pizzaName: Joi.string()
    .required()
    .messages({
      'string.empty': 'Le nom de la pizza est obligatoire'
    }),
  config: Joi.object({
    size: Joi.string()
      .valid('small', 'medium', 'large')
      .required()
      .messages({
        'any.only': 'Taille invalide. Options: small, medium, large',
        'any.required': 'La taille est obligatoire'
      }),
    crust: Joi.string()
      .valid('thin', 'pan', 'stuffed')
      .required()
      .messages({
        'any.only': 'Type de pâte invalide. Options: thin, pan, stuffed',
        'any.required': 'Le type de pâte est obligatoire'
      }),
    toppings: Joi.array()
      .items(Joi.string())
      .default([]),
    quantity: Joi.number()
      .min(1)
      .max(10)
      .default(1)
      .messages({
        'number.min': 'La quantité doit être au moins 1',
        'number.max': 'La quantité ne peut pas dépasser 10'
      })
  }).required(),
  totalPrice: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Le prix doit être un nombre',
      'number.min': 'Le prix ne peut pas être négatif',
      'any.required': 'Le prix est obligatoire'
    }),
  isCustom: Joi.boolean()
    .default(false),
  customDescription: Joi.string()
    .allow('')
    .default('')
});

const updateQuantitySchema = Joi.object({
  quantity: Joi.number()
    .min(1)
    .max(10)
    .required()
    .messages({
      'number.base': 'La quantité doit être un nombre',
      'number.min': 'La quantité doit être au moins 1',
      'number.max': 'La quantité ne peut pas dépasser 10',
      'any.required': 'La quantité est obligatoire'
    })
});

// ==================== SCHÉMA ORDER ====================
// Schéma pour passer une commande (placeOrder)
const placeOrderSchema = Joi.object({
  deliveryAddress: Joi.object({
    address: Joi.string()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.empty': 'L\'adresse est obligatoire',
        'string.min': 'L\'adresse doit contenir au moins 5 caractères'
      }),
    city: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'La ville est obligatoire',
        'string.min': 'La ville doit contenir au moins 2 caractères'
      }),
    state: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Le département/état est obligatoire',
        'string.min': 'Le département/état doit contenir au moins 2 caractères'
      })
  }).required(),
  deliveryMethod: Joi.string()
    .valid('delivery', 'pickup')
    .default('delivery')
    .messages({
      'any.only': 'Méthode de livraison invalide. Options: delivery, pickup'
    }),
  paymentMethod: Joi.string()
    .valid('cash', 'card')
    .default('cash')
    .messages({
      'any.only': 'Méthode de paiement invalide. Options: cash, card'
    }),
  notes: Joi.string()
    .max(500)
    .allow('')
    .default('')
    .messages({
      'string.max': 'Les notes ne peuvent pas dépasser 500 caractères'
    })
});

// Ancien schéma (gardé pour compatibilité)
const orderCreateSchema = Joi.object({
  items: Joi.array()
    .items(cartItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'Le panier ne peut pas être vide',
      'any.required': 'Les items sont obligatoires'
    }),
  deliveryAddress: Joi.object({
    address: Joi.string()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.empty': 'L\'adresse est obligatoire',
        'string.min': 'L\'adresse doit contenir au moins 5 caractères'
      }),
    city: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'La ville est obligatoire',
        'string.min': 'La ville doit contenir au moins 2 caractères'
      }),
    state: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Le département/état est obligatoire',
        'string.min': 'Le département/état doit contenir au moins 2 caractères'
      })
  }).required(),
  deliveryMethod: Joi.string()
    .valid('delivery', 'pickup')
    .required()
    .messages({
      'any.only': 'Méthode de livraison invalide. Options: delivery, pickup',
      'any.required': 'La méthode de livraison est obligatoire'
    }),
  paymentMethod: Joi.string()
    .valid('cash', 'card')
    .default('cash')
    .messages({
      'any.only': 'Méthode de paiement invalide. Options: cash, card'
    }),
  notes: Joi.string()
    .max(500)
    .allow('')
    .default('')
    .messages({
      'string.max': 'Les notes ne peuvent pas dépasser 500 caractères'
    })
});

// ==================== VALIDATE REQUEST ====================
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false, 
      stripUnknown: true 
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      
      // Message spécial pour "Aucune donnée à mettre à jour"
      if (errorMessages.length === 1 && errorMessages[0] === 'Aucune donnée à mettre à jour') {
        return res.status(400).json({ 
          success: false, 
          message: errorMessages[0]
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        message: 'Données invalides', 
        errors: errorMessages 
      });
    }
    
    req.body = value;
    next();
  };
};

// ==================== EXPORT ====================
module.exports = { 
  // User schemas
  registerSchema, 
  adminRegisterSchema, 
  loginSchema, 
  updateProfileSchema,
  
  // Pizza schemas
  pizzaCreateSchema,
  pizzaUpdateSchema,
  
  // Custom pizza schemas
  customPizzaSchema,
  
  // Cart schemas
  cartItemSchema,
  updateQuantitySchema,
  
  // Order schemas
  placeOrderSchema,  // NOUVEAU - pour placeOrder
  orderCreateSchema, // ANCIEN - gardé pour compatibilité
  
  // Validator
  validateRequest 
};
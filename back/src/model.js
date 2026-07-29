// src/models/model.js - CORRIGÉ COMPLET
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ==================== MODÈLE USER ====================
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: function() {
        return !this.isAdmin;
      },
      trim: true,
      minlength: [2, 'Le prénom doit contenir au moins 2 caractères'],
    },
    lastName: {
      type: String,
      required: function() {
        return !this.isAdmin;
      },
      trim: true,
      minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Email invalide',
      ],
    },
    address: {
      type: String,
      required: function() {
        return !this.isAdmin;
      },
      trim: true,
    },
    city: {
      type: String,
      required: function() {
        return !this.isAdmin;
      },
      trim: true,
    },
    state: {
      type: String,
      required: function() {
        return !this.isAdmin;
      },
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    },
    isAdmin: { 
      type: Boolean, 
      default: false 
    },
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pizza',
      default: []
    }]
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

// ==================== MODÈLE PIZZA ====================
const pizzaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la pizza est obligatoire'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est obligatoire'],
    trim: true,
    minlength: [3, 'La description doit contenir au moins 3 caractères'],
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  basePrice: {
    type: Number,
    required: [true, 'Le prix de base est obligatoire'],
    min: [0, 'Le prix ne peut pas être négatif'],
    max: [100, 'Le prix ne peut pas dépasser 100€']
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: {
      values: ['classic', 'special', 'vegetarian', 'spicy', 'custom'],
      message: 'Catégorie invalide'
    },
    default: 'classic'
  },
  imageUrl: {
    type: String,
    default: '',
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  popularity: {
    type: Number,
    default: 0,
    min: 0
  },
  orderCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customConfig: {
    size: {
      type: String,
      enum: ['small', 'medium', 'large'],
      required: function() {
        return this.isCustom;
      }
    },
    crust: {
      type: String,
      enum: ['thin', 'pan', 'stuffed'],
      required: function() {
        return this.isCustom;
      }
    },
    toppings: [{
      type: String,
      trim: true
    }]
  },
  customPizzaId: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

pizzaSchema.index({ name: 'text', description: 'text' });

const Pizza = mongoose.model('Pizza', pizzaSchema);

// ==================== MODÈLE CART ITEM ====================
const cartItemSchema = new mongoose.Schema({
  pizzaId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  pizzaName: {
    type: String,
    required: true,
    trim: true
  },
  config: {
    size: {
      type: String,
      enum: ['small', 'medium', 'large'],
      required: true
    },
    crust: {
      type: String,
      enum: ['thin', 'pan', 'stuffed'],
      required: true
    },
    toppings: [{
      type: String,
      trim: true
    }],
    quantity: {
      type: Number,
      required: true,
      min: [1, 'La quantité doit être au moins 1'],
      max: [10, 'La quantité ne peut pas dépasser 10']
    }
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Le prix ne peut pas être négatif']
  },
  // ✅ AJOUT CRITIQUE : Prix unitaire pour éviter les erreurs de calcul
  unitPrice: {
    type: Number,
    required: false,
    min: [0, 'Le prix unitaire ne peut pas être négatif'],
    default: function() {
      // Si unitPrice n'est pas fourni, le calculer depuis price et quantity
      if (this.price && this.config && this.config.quantity) {
        return this.price / this.config.quantity;
      }
      return this.price || 0;
    }
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  customDescription: {
    type: String,
    default: ''
  }
}, { _id: true });

// Hook pre-save pour s'assurer que unitPrice est toujours défini
cartItemSchema.pre('save', function(next) {
  if (!this.unitPrice && this.price && this.config && this.config.quantity) {
    this.unitPrice = this.price / this.config.quantity;
  }
  next();
});

// ==================== MODÈLE CART ====================
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // ✅ CORRECTION : Calculer le total en utilisant le prix de chaque item
  this.total = this.items.reduce((sum, item) => {
    // S'assurer que unitPrice existe
    if (!item.unitPrice && item.price && item.config && item.config.quantity) {
      item.unitPrice = item.price / item.config.quantity;
    }
    return sum + item.price;
  }, 0);
  
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

// ==================== MODÈLE ORDER ====================
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    pizzaId: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    pizzaName: {
      type: String,
      required: true
    },
    config: {
      size: {
        type: String,
        enum: ['small', 'medium', 'large'],
        required: true
      },
      crust: {
        type: String,
        enum: ['thin', 'pan', 'stuffed'],
        required: true
      },
      toppings: [{
        type: String,
        trim: true
      }],
      quantity: {
        type: Number,
        required: true,
        min: 1,
        max: 10
      }
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    // ✅ AJOUT : Prix unitaire aussi dans les commandes pour traçabilité
    unitPrice: {
      type: Number,
      required: false,
      min: 0
    },
    isCustom: {
      type: Boolean,
      default: false
    },
    customDescription: {
      type: String,
      default: ''
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },

  deliveryFee: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryAddress: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    }
  },
  deliveryMethod: {
    type: String,
    enum: ['delivery', 'pickup'],
    required: true,
    default: 'delivery'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  orderNumber: {
    type: String,
    unique: true,
    default: function() {
      const date = new Date();
      const dateStr = date.toISOString().slice(0,10).replace(/-/g, '');
      const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      return `PZ-${dateStr}-${random}`;
    }
  },
  estimatedDeliveryTime: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Hook pour générer le temps de livraison estimé
orderSchema.pre('save', function(next) {
  if (!this.estimatedDeliveryTime) {
    const deliveryTime = new Date();
    deliveryTime.setMinutes(deliveryTime.getMinutes() + 45);
    this.estimatedDeliveryTime = deliveryTime;
  }
  
  next();
});

// Hook pour les mises à jour
orderSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  if (update && !update.orderNumber && !update.$set?.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0,10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    
    if (update.$set) {
      update.$set.orderNumber = `PZ-${dateStr}-${random}`;
    } else {
      update.orderNumber = `PZ-${dateStr}-${random}`;
    }
  }
  
  if (!update.estimatedDeliveryTime && !update.$set?.estimatedDeliveryTime) {
    const deliveryTime = new Date();
    deliveryTime.setMinutes(deliveryTime.getMinutes() + 45);
    
    if (update.$set) {
      update.$set.estimatedDeliveryTime = deliveryTime;
    } else {
      update.estimatedDeliveryTime = deliveryTime;
    }
  }
  
  next();
});

const Order = mongoose.model('Order', orderSchema);

// ==================== EXPORT COMPLET ====================
module.exports = {
  User,
  Pizza,
  Cart,
  Order
};
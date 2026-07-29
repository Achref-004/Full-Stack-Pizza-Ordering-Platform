// server.js ou main.js - CORRIGÉ
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
const authRouter = require('./router/authRouter');
const adminRouter = require('./router/adminRouter');
const userRouter = require('./router/userRouter'); 
const pizzaRouter = require('./router/pizzaRouter');
const cartRouter = require('./router/cartRouter');
const customPizzaRouter = require('./router/customPizzaRouter');
const orderRouter = require('./router/orderRouter');
const adminOrderRouter = require('./router/adminOrderRouter');

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/orders', adminOrderRouter);
app.use('/api/user', userRouter);
app.use('/api/pizzas', pizzaRouter);
app.use('/api/cart', cartRouter);
app.use('/api/custom-pizzas', customPizzaRouter);
app.use('/api/orders', orderRouter);

// === Route de test ===
app.get('/', (req, res) => {
  res.json({ 
    message: '🍕 Backend Pizza Pete\'s fonctionne !', 
    status: 'OK',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Inscription utilisateur',
        'POST /api/auth/register-admin': 'Inscription admin',
        'POST /api/auth/login': 'Connexion'
      },
      admin: {
        'GET /api/admin/users': 'Liste tous les utilisateurs (Admin)',
        'GET /api/admin/users/:id': 'Détails utilisateur (Admin)',
        'PUT /api/admin/users/:id': 'Modifier utilisateur (Admin)',
        'DELETE /api/admin/users/:id': 'Supprimer utilisateur (Admin)',
        'GET /api/admin/stats': 'Statistiques (Admin)'
      },
      user: { 
        'GET /api/user/profile': 'Récupérer son profil (JWT requis)',
        'PUT /api/user/profile': 'Modifier son profil (JWT requis)',
        'GET /api/user/favorites': 'Liste des favoris (JWT requis)',
        'POST /api/user/favorites/:pizzaId': 'Ajouter un favori (JWT requis)',
        'DELETE /api/user/favorites/:pizzaId': 'Retirer un favori (JWT requis)'
      },
      pizzas: {
        'GET /api/pizzas': 'Liste toutes les pizzas',
        'GET /api/pizzas/:id': 'Récupérer une pizza par ID',
        'GET /api/pizzas/category/:category': 'Pizzas par catégorie',
        'GET /api/pizzas/search': 'Rechercher des pizzas',
        'POST /api/pizzas': 'Créer une pizza (Admin)',
        'PUT /api/pizzas/:id': 'Modifier une pizza (Admin)',
        'DELETE /api/pizzas/:id': 'Supprimer une pizza (Admin)'
      },
      customPizzas: {
        'POST /api/custom-pizzas/create': 'Créer une pizza personnalisée (JWT requis)',
        'GET /api/custom-pizzas/my-pizzas': 'Mes pizzas personnalisées (JWT requis)',
        'GET /api/custom-pizzas/:id': 'Récupérer une pizza personnalisée (JWT requis)',
        'PUT /api/custom-pizzas/:id': 'Modifier une pizza personnalisée (JWT requis)',
        'DELETE /api/custom-pizzas/:id': 'Supprimer une pizza personnalisée (JWT requis)',
        'POST /api/custom-pizzas/duplicate/:pizzaId': 'Dupliquer une pizza (JWT requis)',
        'GET /api/custom-pizzas/popular': 'Pizzas personnalisées populaires',
        'GET /api/custom-pizzas/admin/all': 'Toutes les pizzas personnalisées (Admin)'
      },
      cart: {
        'GET /api/cart': 'Récupérer son panier (JWT requis)',
        'POST /api/cart/add': 'Ajouter au panier (JWT requis)',
        'PUT /api/cart/item/:itemId/quantity': 'Modifier quantité (JWT requis)',
        'DELETE /api/cart/item/:itemId': 'Retirer du panier (JWT requis)',
        'DELETE /api/cart/clear': 'Vider le panier (JWT requis)',
        'GET /api/cart/count': 'Nombre d\'articles (JWT requis)',
        'GET /api/cart/total': 'Total du panier (JWT requis)'
      },
      orders: {
        'POST /api/orders/place': 'Passer une commande (JWT requis)',
        'GET /api/orders/my-orders': 'Mes commandes (JWT requis)',
        'GET /api/orders/:id/details': 'Détails d\'une commande (JWT requis)',
        'PUT /api/orders/:id/cancel': 'Annuler une commande (JWT requis)',
        'GET /api/orders/track/:orderNumber': 'Suivre une commande (JWT requis)',
        'GET /api/orders/history': 'Historique des commandes (JWT requis)'
      }
    }
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('❌ Erreur globale:', error);
  
  // Gestion spécifique pour CastError (ObjectId invalide)
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      message: 'ID invalide'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

// Connexion à MongoDB et démarrage du serveur
const startServer = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pizzapetes';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connecté !');
    
    // Ajouter des données de test si la base est vide
    await seedInitialData();
    
    const PORT = process.env.PORT || 5004;
    app.listen(PORT, () => {
      console.log('\n✨✨✨ SERVEUR PIZZA PETE\'S DÉMARRÉ ✨✨✨');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📚 Documentation: http://localhost:${PORT}/`);
      console.log('🍕 Prêt à servir des pizzas !');
      console.log('==============================\n');
    });
  } catch (error) {
    console.error('❌ Erreur MongoDB:', error.message);
    process.exit(1);
  }
};

// Fonction pour ajouter des données initiales
async function seedInitialData() {
  try {
    const models = require('./model');
    const Pizza = models.Pizza;
    const User = models.User;
    
    // Vérifier si des pizzas existent déjà
    const pizzaCount = await Pizza.countDocuments();
    
    if (pizzaCount === 0) {
      console.log('🌱 Ajout des données initiales de pizzas...');
      
      const initialPizzas = [
        {
          name: "Margherita",
          description: "La pizza classique italienne avec sauce tomate, mozzarella fraîche et basilic",
          basePrice: 10,
          category: "classic",
          ingredients: ["sauce tomate", "mozzarella", "basilic"],
          imageUrl: "",
          isAvailable: true,
          popularity: 150,
          orderCount: 300
        },
        {
          name: "Pepperoni",
          description: "Sauce tomate, double pepperoni et fromage fondant",
          basePrice: 12,
          category: "spicy",
          ingredients: ["sauce tomate", "pepperoni", "fromage", "épices"],
          imageUrl: "",
          isAvailable: true,
          popularity: 200,
          orderCount: 400
        },
        {
          name: "Végétarienne",
          description: "Champignons, poivrons, oignons, olives et fromage",
          basePrice: 11,
          category: "vegetarian",
          ingredients: ["champignons", "poivrons", "oignons", "olives", "fromage"],
          imageUrl: "",
          isAvailable: true,
          popularity: 100,
          orderCount: 250
        },
        {
          name: "Quatre Fromages",
          description: "Mozzarella, gorgonzola, parmesan et chèvre",
          basePrice: 13,
          category: "special",
          ingredients: ["mozzarella", "gorgonzola", "parmesan", "chèvre"],
          imageUrl: "",
          isAvailable: true,
          popularity: 120,
          orderCount: 280
        },
        {
          name: "Hawaïenne",
          description: "Jambon, ananas et fromage fondant",
          basePrice: 11.5,
          category: "classic",
          ingredients: ["jambon", "ananas", "fromage"],
          imageUrl: "",
          isAvailable: true,
          popularity: 80,
          orderCount: 200
        },
        {
          name: "Reine",
          description: "Jambon, champignons et fromage",
          basePrice: 12,
          category: "classic",
          ingredients: ["jambon", "champignons", "fromage"],
          imageUrl: "",
          isAvailable: true,
          popularity: 90,
          orderCount: 220
        }
      ];
      
      await Pizza.insertMany(initialPizzas);
      console.log('✅ Données initiales de pizzas ajoutées avec succès !');
    } else {
      console.log(`✅ ${pizzaCount} pizzas déjà présentes dans la base de données`);
    }

    // Vérifier si un utilisateur admin existe
    const adminCount = await User.countDocuments({ isAdmin: true });
    if (adminCount === 0) {
      console.log('👑 Création d\'un utilisateur admin par défaut...');
      
      const adminUser = new User({
        firstName: "Admin",
        lastName: "Pizza",
        email: "admin@pizzapetes.com",
        password: "admin123",
        address: "123 Rue de la Pizza",
        city: "Paris",
        state: "75",
        isAdmin: true
      });
      
      await adminUser.save();
      console.log('✅ Utilisateur admin créé avec succès !');
      console.log('📧 Email: admin@pizzapetes.com');
      console.log('🔑 Mot de passe: admin123');
    }
  } catch (error) {
    console.error('⚠️ Erreur lors de l\'ajout des données initiales:', error.message);
    console.log('⚠️ Vous pouvez ignorer cette erreur si vous préférez ajouter les pizzas manuellement');
  }
}

// Middleware pour vérifier les ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && (String)(new mongoose.Types.ObjectId(id)) === id;
};

// Ajouter la fonction au global pour être utilisée ailleurs
global.isValidObjectId = isValidObjectId;

// Démarrer le serveur
if (require.main === module) {
  startServer();
}

module.exports = app;
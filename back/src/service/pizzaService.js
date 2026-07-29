const PizzaRepository = require('../repository/pizzaRepository');
const mongoose = require('mongoose');

class PizzaService {
  
  // Récupérer toutes les pizzas
  async getAllPizzas(req, res) {
    try {
      const pizzas = await PizzaRepository.findAll();
      
      return res.json({
        success: true,
        count: pizzas.length,
        pizzas: pizzas.map(pizza => ({
          id: pizza._id,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients,
          imageUrl: pizza.imageUrl,
          isAvailable: pizza.isAvailable,
          isCustom: pizza.isCustom || false,
          customConfig: pizza.customConfig || null,
          createdAt: pizza.createdAt
        }))
      });
    } catch (error) {
      console.error('❌ Erreur getAllPizzas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des pizzas'
      });
    }
  }

  // Récupérer une pizza par ID
  async getPizzaById(req, res) {
    try {
      const { id } = req.params;
      
      // Validation de l'ID
      if (!id || id === 'undefined' || id === 'null') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide'
        });
      }
      
      const pizza = await PizzaRepository.findById(id);
      
      if (!pizza) {
        return res.status(404).json({
          success: false,
          message: 'Pizza non trouvée'
        });
      }
      
      return res.json({
        success: true,
        pizza: {
          id: pizza._id,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients,
          imageUrl: pizza.imageUrl,
          isAvailable: pizza.isAvailable,
          isCustom: pizza.isCustom || false,
          customConfig: pizza.customConfig || null
        }
      });
    } catch (error) {
      console.error('❌ Erreur getPizzaById:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide',
          details: 'Le format de l\'ID n\'est pas valide'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la pizza'
      });
    }
  }

  // Créer une nouvelle pizza (admin)
  async createPizza(req, res) {
    try {
      const { name, description, basePrice, category, ingredients, imageUrl } = req.body;
      
      // Validation des données
      if (!name || !description || !basePrice) {
        return res.status(400).json({
          success: false,
          message: 'Nom, description et prix sont obligatoires'
        });
      }
      
      const pizzaData = {
        name,
        description,
        basePrice: parseFloat(basePrice),
        category: category || 'classic',
        ingredients: ingredients || [],
        imageUrl: imageUrl || '',
        isAvailable: true
      };
      
      const pizza = await PizzaRepository.create(pizzaData);
      
      return res.status(201).json({
        success: true,
        message: 'Pizza créée avec succès',
        pizza: {
          id: pizza._id,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients,
          imageUrl: pizza.imageUrl,
          isAvailable: pizza.isAvailable
        }
      });
    } catch (error) {
      console.error('❌ Erreur createPizza:', error);
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: messages
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la pizza'
      });
    }
  }

  // Mettre à jour une pizza (admin)
  async updatePizza(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Validation de l'ID
      if (!id || id === 'undefined' || id === 'null') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide'
        });
      }
      
      const pizza = await PizzaRepository.update(id, updateData);
      
      if (!pizza) {
        return res.status(404).json({
          success: false,
          message: 'Pizza non trouvée'
        });
      }
      
      return res.json({
        success: true,
        message: 'Pizza mise à jour avec succès',
        pizza: {
          id: pizza._id,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients,
          imageUrl: pizza.imageUrl,
          isAvailable: pizza.isAvailable
        }
      });
    } catch (error) {
      console.error('❌ Erreur updatePizza:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide',
          details: 'Le format de l\'ID n\'est pas valide'
        });
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: messages
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la pizza'
      });
    }
  }

  // Supprimer une pizza (admin)
  async deletePizza(req, res) {
    try {
      const { id } = req.params;
      
      // Validation de l'ID
      if (!id || id === 'undefined' || id === 'null') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide'
        });
      }
      
      const pizza = await PizzaRepository.delete(id);
      
      if (!pizza) {
        return res.status(404).json({
          success: false,
          message: 'Pizza non trouvée'
        });
      }
      
      return res.json({
        success: true,
        message: 'Pizza supprimée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur deletePizza:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide',
          details: 'Le format de l\'ID n\'est pas valide'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la pizza'
      });
    }
  }

  // Récupérer les pizzas par catégorie
  async getPizzasByCategory(req, res) {
    try {
      const { category } = req.params;
      
      const pizzas = await PizzaRepository.findByCategory(category);
      
      return res.json({
        success: true,
        count: pizzas.length,
        pizzas: pizzas.map(pizza => ({
          id: pizza._id,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients,
          imageUrl: pizza.imageUrl,
          isAvailable: pizza.isAvailable,
          isCustom: pizza.isCustom || false
        }))
      });
    } catch (error) {
      console.error('❌ Erreur getPizzasByCategory:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des pizzas'
      });
    }
  }

  // Rechercher des pizzas
  async searchPizzas(req, res) {
    try {
      const { query } = req.query;
      
      if (!query || query.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Le terme de recherche est requis'
        });
      }
      
      const pizzas = await PizzaRepository.searchByName(query);
      
      return res.json({
        success: true,
        count: pizzas.length,
        pizzas: pizzas.map(pizza => ({
          id: pizza._id,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients,
          imageUrl: pizza.imageUrl,
          isAvailable: pizza.isAvailable,
          isCustom: pizza.isCustom || false
        }))
      });
    } catch (error) {
      console.error('❌ Erreur searchPizzas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des pizzas'
      });
    }
  }

  // Obtenir les statistiques des pizzas (admin)
  async getPizzaStats(req, res) {
    try {
      const allPizzas = await PizzaRepository.findAll();
      const availablePizzas = await PizzaRepository.findAvailable();
      
      // Compter par catégorie
      const categoryStats = {};
      allPizzas.forEach(pizza => {
        categoryStats[pizza.category] = (categoryStats[pizza.category] || 0) + 1;
      });
      
      return res.json({
        success: true,
        stats: {
          totalPizzas: allPizzas.length,
          availablePizzas: availablePizzas.length,
          unavailablePizzas: allPizzas.length - availablePizzas.length,
          categories: categoryStats,
          averagePrice: allPizzas.reduce((sum, pizza) => sum + pizza.basePrice, 0) / allPizzas.length || 0
        }
      });
    } catch (error) {
      console.error('❌ Erreur getPizzaStats:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // ============ NOUVEAUX SERVICES POUR PIZZAS PERSONNALISÉES ============

  // Créer une pizza personnalisée
  async createCustomPizza(req, res) {
    try {
      const userId = req.user._id;
      const { 
        name, 
        description, 
        basePrice, 
        ingredients, 
        config,
        category = 'custom'
      } = req.body;
      
      // Validation des données
      if (!name || !description || !basePrice) {
        return res.status(400).json({
          success: false,
          message: 'Nom, description et prix sont obligatoires'
        });
      }

      if (!config || !config.size || !config.crust) {
        return res.status(400).json({
          success: false,
          message: 'La configuration (taille et pâte) est obligatoire'
        });
      }

      // Vérifier si une pizza avec le même nom existe déjà pour cet utilisateur
      const existingPizza = await PizzaRepository.findCustomPizzasByUser(userId);
      const existingName = existingPizza.find(pizza => 
        pizza.name.toLowerCase() === name.toLowerCase()
      );

      if (existingName) {
        return res.status(400).json({
          success: false,
          message: 'Vous avez déjà une pizza personnalisée avec ce nom'
        });
      }

      const pizzaData = {
        name,
        description,
        basePrice: parseFloat(basePrice),
        category,
        ingredients: ingredients || [],
        isCustom: true,
        createdBy: userId,
        customConfig: {
          size: config.size,
          crust: config.crust,
          toppings: config.toppings || []
        },
        isAvailable: true
      };

      const pizza = await PizzaRepository.createCustomPizza(pizzaData);
      
      return res.status(201).json({
        success: true,
        message: 'Pizza personnalisée créée avec succès',
        pizza: {
          id: pizza._id,
          customPizzaId: pizza.customPizzaId,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients,
          isCustom: pizza.isCustom,
          config: pizza.customConfig,
          createdAt: pizza.createdAt
        }
      });
    } catch (error) {
      console.error('❌ Erreur createCustomPizza:', error);
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: messages
        });
      }
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Une erreur est survenue avec l\'ID unique de la pizza'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la pizza personnalisée'
      });
    }
  }

  // Récupérer les pizzas personnalisées de l'utilisateur
  async getUserCustomPizzas(req, res) {
    try {
      const userId = req.user._id;
      
      const pizzas = await PizzaRepository.findCustomPizzasByUser(userId);
      
      return res.json({
        success: true,
        count: pizzas.length,
        pizzas: pizzas.map(pizza => ({
          id: pizza._id,
          customPizzaId: pizza.customPizzaId,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients,
          isCustom: pizza.isCustom,
          config: pizza.customConfig,
          createdAt: pizza.createdAt,
          updatedAt: pizza.updatedAt
        }))
      });
    } catch (error) {
      console.error('❌ Erreur getUserCustomPizzas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des pizzas personnalisées'
      });
    }
  }

  // Récupérer une pizza personnalisée par ID (pour la route GET /:id)
  async getCustomPizzaById(req, res) {
    try {
      const userId = req.user._id;
      const { id } = req.params;
      
      console.log('🔍 Récupération de pizza personnalisée:', {
        userId,
        pizzaId: id,
        typeOfId: typeof id
      });
      
      // Validation de l'ID
      if (!id || id === 'undefined' || id === 'null') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide'
        });
      }
      
      // Utiliser la méthode du repository qui supporte les deux types d'ID
      const pizza = await PizzaRepository.getCustomPizzaById(id, userId);
      
      if (!pizza) {
        return res.status(404).json({
          success: false,
          message: 'Pizza personnalisée non trouvée'
        });
      }

      return res.json({
        success: true,
        pizza: {
          id: pizza._id,
          customPizzaId: pizza.customPizzaId,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients,
          isCustom: pizza.isCustom,
          config: pizza.customConfig,
          createdAt: pizza.createdAt,
          updatedAt: pizza.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ Erreur getCustomPizzaById:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide',
          details: 'Le format de l\'ID n\'est pas valide'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la pizza personnalisée'
      });
    }
  }

  // Mettre à jour une pizza personnalisée (avec support des customPizzaId)
  async updateCustomPizza(req, res) {
    try {
      const userId = req.user._id;
      const { id } = req.params;
      const updateData = req.body;
      
      console.log('🔄 Tentative de mise à jour de pizza personnalisée:', {
        userId,
        pizzaId: id,
        typeOfId: typeof id,
        updateData
      });
      
      // Validation de l'ID
      if (!id || id === 'undefined' || id === 'null') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide'
        });
      }
      
      // NOUVEAU CODE : Utiliser la méthode qui supporte les deux types d'ID
      let pizza;
      
      // Si c'est un ObjectId MongoDB valide
      if (mongoose.Types.ObjectId.isValid(id)) {
        console.log('📋 ID est un ObjectId valide, recherche par _id');
        pizza = await PizzaRepository.findById(id);
      } 
      // Si c'est un customPizzaId (commence par 'custom_')
      else if (id && id.startsWith('custom_')) {
        console.log('🎨 ID est un customPizzaId, recherche par customPizzaId');
        pizza = await PizzaRepository.findCustomById(id);
      } 
      // ID invalide
      else {
        return res.status(400).json({
          success: false,
          message: 'Format d\'ID invalide',
          details: 'L\'ID doit être un ObjectId MongoDB ou un customPizzaId (commençant par custom_)'
        });
      }
      
      if (!pizza) {
        return res.status(404).json({
          success: false,
          message: 'Pizza non trouvée'
        });
      }

      console.log('🔍 Pizza trouvée:', {
        pizzaId: pizza._id,
        customPizzaId: pizza.customPizzaId,
        createdBy: pizza.createdBy,
        userId: userId.toString()
      });

      // Vérifier les autorisations
      if (!pizza.isCustom) {
        return res.status(403).json({
          success: false,
          message: 'Cette pizza n\'est pas une pizza personnalisée'
        });
      }

      if (!pizza.createdBy) {
        return res.status(403).json({
          success: false,
          message: 'Pizza personnalisée sans propriétaire'
        });
      }

      if (pizza.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas autorisé à modifier cette pizza'
        });
      }

      // NOUVEAU CODE : Utiliser updateByIdOrCustomId
      const updatedPizza = await PizzaRepository.updateByIdOrCustomId(id, updateData);
      
      if (!updatedPizza) {
        return res.status(404).json({
          success: false,
          message: 'Échec de la mise à jour de la pizza'
        });
      }

      console.log('✅ Pizza mise à jour avec succès');

      return res.json({
        success: true,
        message: 'Pizza personnalisée mise à jour avec succès',
        pizza: {
          id: updatedPizza._id,
          customPizzaId: updatedPizza.customPizzaId,
          name: updatedPizza.name,
          description: updatedPizza.description,
          basePrice: updatedPizza.basePrice,
          category: updatedPizza.category,
          ingredients: updatedPizza.ingredients,
          isCustom: updatedPizza.isCustom,
          config: updatedPizza.customConfig,
          createdAt: updatedPizza.createdAt,
          updatedAt: updatedPizza.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ Erreur updateCustomPizza:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide',
          details: 'Le format de l\'ID n\'est pas valide'
        });
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: messages
        });
      }
      
      // Gérer l'erreur spécifique du repository
      if (error.message && error.message.includes('Format d\'ID invalide')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la pizza personnalisée',
        details: error.message
      });
    }
  }

  // Supprimer une pizza personnalisée (avec support des customPizzaId)
  async deleteCustomPizza(req, res) {
    try {
      const userId = req.user._id;
      const { id } = req.params;
      
      console.log('🗑️ Tentative de suppression de pizza personnalisée:', {
        userId,
        pizzaId: id,
        typeOfId: typeof id
      });
      
      // Validation de l'ID
      if (!id || id === 'undefined' || id === 'null') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide'
        });
      }
      
      // NOUVEAU CODE : Utiliser deleteByIdOrCustomId
      const pizza = await PizzaRepository.deleteByIdOrCustomId(id, userId);
      
      if (!pizza) {
        console.log('⚠️ Pizza non trouvée ou non autorisée:', id);
        return res.status(404).json({
          success: false,
          message: 'Pizza personnalisée non trouvée ou vous n\'êtes pas autorisé à la supprimer'
        });
      }
      
      console.log('✅ Pizza supprimée avec succès:', pizza._id);
      
      return res.json({
        success: true,
        message: 'Pizza personnalisée supprimée avec succès',
        deletedPizza: {
          id: pizza._id,
          name: pizza.name,
          customPizzaId: pizza.customPizzaId
        }
      });
    } catch (error) {
      console.error('❌ Erreur deleteCustomPizza:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide',
          details: 'Le format de l\'ID n\'est pas valide'
        });
      }
      
      // Gérer l'erreur spécifique du repository
      if (error.message && error.message.includes('Format d\'ID invalide')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la pizza personnalisée',
        details: error.message
      });
    }
  }

  // Dupliquer une pizza existante en personnalisée
  async duplicateAsCustom(req, res) {
    try {
      const userId = req.user._id;
      const { pizzaId } = req.params;
      const customizations = req.body;
      
      // Validation de l'ID
      if (!pizzaId || pizzaId === 'undefined' || pizzaId === 'null') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide'
        });
      }
      
      const pizza = await PizzaRepository.duplicateAsCustom(pizzaId, userId, customizations);
      
      return res.status(201).json({
        success: true,
        message: 'Pizza dupliquée en version personnalisée',
        pizza: {
          id: pizza._id,
          customPizzaId: pizza.customPizzaId,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients,
          isCustom: pizza.isCustom,
          config: pizza.customConfig,
          createdAt: pizza.createdAt
        }
      });
    } catch (error) {
      console.error('❌ Erreur duplicateAsCustom:', error);
      
      if (error.message === 'Pizza originale non trouvée') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide',
          details: 'Le format de l\'ID n\'est pas valide'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la duplication de la pizza'
      });
    }
  }

  // Récupérer les pizzas personnalisées populaires
  async getPopularCustomPizzas(req, res) {
    try {
      const pizzas = await PizzaRepository.findAllCustomPizzas();
      
      // Filtrer par popularité (plus de 0 commandes)
      const popularPizzas = pizzas
        .filter(pizza => pizza.orderCount > 0)
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 10);
      
      return res.json({
        success: true,
        count: popularPizzas.length,
        pizzas: popularPizzas.map(pizza => ({
          id: pizza._id,
          customPizzaId: pizza.customPizzaId,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients,
          isCustom: pizza.isCustom,
          config: pizza.customConfig,
          popularity: pizza.popularity,
          orderCount: pizza.orderCount,
          createdBy: pizza.createdBy ? {
            id: pizza.createdBy._id,
            name: `${pizza.createdBy.firstName} ${pizza.createdBy.lastName}`
          } : null,
          createdAt: pizza.createdAt
        }))
      });
    } catch (error) {
      console.error('❌ Erreur getPopularCustomPizzas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des pizzas personnalisées populaires'
      });
    }
  }

  // Récupérer toutes les pizzas personnalisées (admin)
  async getAllCustomPizzas(req, res) {
    try {
      const pizzas = await PizzaRepository.findAllCustomPizzas();
      
      return res.json({
        success: true,
        count: pizzas.length,
        pizzas: pizzas.map(pizza => ({
          id: pizza._id,
          customPizzaId: pizza.customPizzaId,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients,
          isCustom: pizza.isCustom,
          config: pizza.customConfig,
          orderCount: pizza.orderCount,
          isAvailable: pizza.isAvailable,
          createdBy: pizza.createdBy ? {
            id: pizza.createdBy._id,
            name: `${pizza.createdBy.firstName} ${pizza.createdBy.lastName}`,
            email: pizza.createdBy.email
          } : null,
          createdAt: pizza.createdAt
        }))
      });
    } catch (error) {
      console.error('❌ Erreur getAllCustomPizzas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des pizzas personnalisées'
      });
    }
  }
  
}

module.exports = new PizzaService();
const { Pizza } = require('../model');
const mongoose = require('mongoose');

class PizzaRepository {
  // Récupérer toutes les pizzas (incluant les custom)
  async findAll() {
    return await Pizza.find({ isAvailable: true }).sort({ createdAt: -1 });
  }

  // Récupérer une pizza par son ID
  async findById(id) {
    return await Pizza.findById(id);
  }

  // Récupérer les pizzas par catégorie
  async findByCategory(category) {
    return await Pizza.find({ 
      category,
      isAvailable: true 
    });
  }

  // Créer une nouvelle pizza
  async create(pizzaData) {
    const pizza = new Pizza(pizzaData);
    return await pizza.save();
  }

  // Mettre à jour une pizza
  async update(id, updateData) {
    return await Pizza.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  // Supprimer une pizza
  async delete(id) {
    return await Pizza.findByIdAndDelete(id);
  }

  // Rechercher des pizzas par nom
  async searchByName(searchTerm) {
    return await Pizza.find({
      name: { $regex: searchTerm, $options: 'i' },
      isAvailable: true
    });
  }

  // Récupérer les pizzas disponibles
  async findAvailable() {
    return await Pizza.find({ isAvailable: true });
  }

  // Mettre à jour la disponibilité d'une pizza
  async updateAvailability(id, isAvailable) {
    return await Pizza.findByIdAndUpdate(
      id,
      { isAvailable },
      { new: true }
    );
  }

  // ============ NOUVELLES MÉTHODES POUR PIZZAS PERSONNALISÉES ============

  // Récupérer les pizzas personnalisées d'un utilisateur
  async findCustomPizzasByUser(userId) {
    return await Pizza.find({ 
      createdBy: userId,
      isCustom: true,
      isAvailable: true 
    }).sort({ createdAt: -1 });
  }

  // Créer une pizza personnalisée
  async createCustomPizza(pizzaData) {
    // Générer un ID unique pour la pizza personnalisée
    pizzaData.customPizzaId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    pizzaData.isCustom = true;
    
    const pizza = new Pizza(pizzaData);
    return await pizza.save();
  }

  // Récupérer une pizza personnalisée par son ID custom
  async findCustomById(customId) {
    return await Pizza.findOne({ 
      customPizzaId: customId,
      isCustom: true 
    });
  }

  // Mettre à jour une pizza personnalisée
  async updateCustomPizza(id, updateData) {
    return await Pizza.findOneAndUpdate(
      { _id: id, isCustom: true },
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  // Supprimer une pizza personnalisée (seulement si créée par l'utilisateur)
  async deleteCustomPizza(id, userId) {
    return await Pizza.findOneAndDelete({
      _id: id,
      isCustom: true,
      createdBy: userId
    });
  }

  // Dupliquer une pizza existante en personnalisée
  async duplicateAsCustom(pizzaId, userId, customizations = {}) {
    const originalPizza = await this.findById(pizzaId);
    if (!originalPizza) {
      throw new Error('Pizza originale non trouvée');
    }

    const customPizzaData = {
      name: `${originalPizza.name} (Personnalisée)`,
      description: originalPizza.description,
      basePrice: originalPizza.basePrice,
      category: 'custom',
      ingredients: [...originalPizza.ingredients],
      imageUrl: originalPizza.imageUrl,
      isCustom: true,
      createdBy: userId,
      isAvailable: true,
      ...customizations
    };

    return await this.createCustomPizza(customPizzaData);
  }

  // Récupérer toutes les pizzas personnalisées (pour admin)
  async findAllCustomPizzas() {
    return await Pizza.find({ 
      isCustom: true 
    }).populate('createdBy', 'firstName lastName email').sort({ createdAt: -1 });
  }

  // ============ NOUVELLES MÉTHODES POUR GÉRER LES DEUX TYPES D'ID ============

  // Récupérer une pizza par ID ou customPizzaId
  async findByIdOrCustomId(id) {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return await this.findById(id);
    }
    
    if (id && id.startsWith('custom_')) {
      return await this.findCustomById(id);
    }
    
    return null;
  }

  // Mettre à jour une pizza par ID ou customPizzaId
  async updateByIdOrCustomId(id, updateData) {
    let query;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, isCustom: true };
    } else if (id.startsWith('custom_')) {
      query = { customPizzaId: id, isCustom: true };
    } else {
      throw new Error('Format d\'ID invalide. Doit être un ObjectId ou un customPizzaId');
    }
    
    return await Pizza.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  // Supprimer une pizza par ID ou customPizzaId
  async deleteByIdOrCustomId(id, userId) {
    let query;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { 
        _id: id, 
        isCustom: true, 
        createdBy: userId 
      };
    } else if (id.startsWith('custom_')) {
      query = { 
        customPizzaId: id, 
        isCustom: true, 
        createdBy: userId 
      };
    } else {
      throw new Error('Format d\'ID invalide. Doit être un ObjectId ou un customPizzaId');
    }
    
    return await Pizza.findOneAndDelete(query);
  }

  // Récupérer une pizza personnalisée spécifique par ID ou customPizzaId pour un utilisateur
  async getCustomPizzaById(id, userId) {
    let query;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { 
        _id: id, 
        isCustom: true,
        createdBy: userId 
      };
    } else if (id && id.startsWith('custom_')) {
      query = { 
        customPizzaId: id, 
        isCustom: true,
        createdBy: userId 
      };
    } else {
      return null;
    }
    
    return await Pizza.findOne(query);
  }
}

module.exports = new PizzaRepository();
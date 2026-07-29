const { User, Pizza } = require('../model');

class UserRepository {
  async findById(id, includePassword = false) {
    if (includePassword) {
      return await User.findById(id);
    }
    return await User.findById(id).select('-password');
  }

  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData }, 
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');
  }

  async updatePassword(id, newPassword) {
    const user = await User.findById(id);
    if (user) {
      user.password = newPassword;
      await user.save();
      return user;
    }
    return null;
  }

  // ==================== MÉTHODES FAVORIS ====================

  // Récupérer les favoris d'un utilisateur
  async getFavorites(userId) {
    const user = await User.findById(userId).populate({
      path: 'favorites',
      select: '_id name description basePrice category imageUrl isAvailable',
      options: { sort: { createdAt: -1 } }
    });
    
    if (!user) {
      return [];
    }
    
    return user.favorites || [];
  }

  // Ajouter une pizza aux favoris
  async addFavorite(userId, pizzaId) {
    try {
      // Vérifier si la pizza existe
      const pizza = await Pizza.findById(pizzaId);
      if (!pizza) {
        throw new Error('Pizza non trouvée');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier si la pizza est déjà en favori
      if (user.favorites.some(fav => fav.toString() === pizzaId)) {
        throw new Error('Cette pizza est déjà dans vos favoris');
      }

      // Ajouter aux favoris
      user.favorites.push(pizzaId);
      await user.save();

      // Augmenter la popularité de la pizza
      pizza.popularity += 1;
      await pizza.save();

      return user.favorites;
    } catch (error) {
      throw error;
    }
  }

  // Retirer une pizza des favoris
  async removeFavorite(userId, pizzaId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier si la pizza est dans les favoris
      const favoriteIndex = user.favorites.findIndex(fav => fav.toString() === pizzaId);
      if (favoriteIndex === -1) {
        throw new Error('Cette pizza n\'est pas dans vos favoris');
      }

      // Retirer des favoris
      user.favorites.splice(favoriteIndex, 1);
      await user.save();

      // Diminuer la popularité de la pizza
      const pizza = await Pizza.findById(pizzaId);
      if (pizza) {
        pizza.popularity = Math.max(0, pizza.popularity - 1);
        await pizza.save();
      }

      return user.favorites;
    } catch (error) {
      throw error;
    }
  }

  // Vérifier si une pizza est favorite
  async isFavorite(userId, pizzaId) {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }
    
    return user.favorites.some(fav => fav.toString() === pizzaId);
  }

  // Vider tous les favoris
  async clearFavorites(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    user.favorites = [];
    await user.save();
    
    return [];
  }

  // Compter le nombre de favoris
  async countFavorites(userId) {
    const user = await User.findById(userId);
    if (!user) {
      return 0;
    }
    
    return user.favorites.length;
  }

  // Récupérer les pizzas populaires (basé sur les favoris)
  async getPopularPizzas(limit = 5) {
    return await Pizza.find({ isAvailable: true })
      .sort({ popularity: -1, orderCount: -1 })
      .limit(limit)
      .select('_id name description basePrice category imageUrl popularity');
  }

  // Récupérer les favoris avec détails
  async getFavoritesWithDetails(userId) {
    const user = await User.findById(userId)
      .populate({
        path: 'favorites',
        select: '_id name description basePrice category imageUrl isAvailable ingredients popularity',
        options: { sort: { createdAt: -1 } }
      })
      .select('favorites');
    
    if (!user) {
      return [];
    }
    
    return user.favorites.map(fav => ({
      _id: fav._id,
      name: fav.name,
      description: fav.description,
      basePrice: fav.basePrice,
      category: fav.category,
      imageUrl: fav.imageUrl,
      isAvailable: fav.isAvailable,
      ingredients: fav.ingredients,
      popularity: fav.popularity,
      isFavorite: true
    }));
  }
}

module.exports = new UserRepository();
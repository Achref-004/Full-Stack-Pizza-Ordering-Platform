const UserRepository = require('../repository/userRepository');
const bcrypt = require('bcryptjs');

class UserService {
  
  // Récupérer le profil de l'utilisateur connecté
  async getProfile(req, res) {
    try {
      console.log('👤 Récupération du profil pour:', req.user.email);

      const user = await UserRepository.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Ajouter le compte des favoris dans la réponse
      const favoritesCount = await UserRepository.countFavorites(req.user._id);

      console.log('✅ Profil récupéré avec succès');
      return res.json({
        success: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          address: user.address,
          city: user.city,
          state: user.state,
          isAdmin: user.isAdmin,
          favoritesCount: favoritesCount,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ Erreur getProfile:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil'
      });
    }
  }

  // Mettre à jour le profil de l'utilisateur connecté
  async updateProfile(req, res) {
    try {
      const userId = req.user._id;
      const { firstName, lastName, address, city, state, currentPassword, newPassword, email, isAdmin } = req.body;

      console.log('✏️ Mise à jour du profil pour:', req.user.email);

      // Récupérer l'utilisateur avec le mot de passe
      const user = await UserRepository.findByEmail(req.user.email);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Empêcher la modification de champs sensibles
      const forbiddenFields = ['email', 'isAdmin', 'createdAt'];
      for (const field of forbiddenFields) {
        if (req.body[field] !== undefined) {
          return res.status(403).json({
            success: false,
            message: `La modification du champ ${field} n'est pas autorisée`
          });
        }
      }

      // Créer un objet avec les données à mettre à jour
      const updateData = {};

      if (firstName !== undefined) updateData.firstName = firstName.trim();
      if (lastName !== undefined) updateData.lastName = lastName.trim();
      if (address !== undefined) updateData.address = address.trim();
      if (city !== undefined) updateData.city = city.trim();
      if (state !== undefined) updateData.state = state.trim();

      // Gestion du changement de mot de passe
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: 'Le mot de passe actuel est requis pour changer le mot de passe'
          });
        }

        // Vérifier que le mot de passe actuel est correct
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: 'Mot de passe actuel incorrect'
          });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
          });
        }

        // Hasher le nouveau mot de passe
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(newPassword, salt);
        console.log('🔐 Changement de mot de passe demandé');
      }

      // Effectuer la mise à jour
      const updatedUser = await UserRepository.updateById(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'Erreur lors de la mise à jour'
        });
      }

      console.log('✅ Profil mis à jour avec succès');

      return res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        user: {
          id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          address: updatedUser.address,
          city: updatedUser.city,
          state: updatedUser.state,
          isAdmin: updatedUser.isAdmin,
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ Erreur updateProfile:', error);

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
        message: 'Erreur lors de la mise à jour du profil'
      });
    }
  }

  // ==================== SERVICES FAVORIS ====================

  // Récupérer les pizzas favorites
  async getFavorites(req, res) {
    try {
      console.log('❤️ Récupération des favoris pour:', req.user.email);

      const favorites = await UserRepository.getFavoritesWithDetails(req.user._id);

      console.log(`✅ ${favorites.length} favoris récupérés`);
      return res.json({
        success: true,
        count: favorites.length,
        favorites: favorites
      });
    } catch (error) {
      console.error('❌ Erreur getFavorites:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des favoris'
      });
    }
  }

  // Ajouter une pizza aux favoris
  async addToFavorites(req, res) {
    try {
      const { pizzaId } = req.params;
      const userId = req.user._id;

      console.log('❤️ Ajout de pizza aux favoris:', { userId, pizzaId });

      if (!pizzaId) {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza requis'
        });
      }

      const favorites = await UserRepository.addFavorite(userId, pizzaId);

      console.log('✅ Pizza ajoutée aux favoris');
      return res.json({
        success: true,
        message: 'Pizza ajoutée aux favoris avec succès',
        favoritesCount: favorites.length,
        favorites: favorites
      });
    } catch (error) {
      console.error('❌ Erreur addToFavorites:', error);
      
      if (error.message === 'Pizza non trouvée') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message === 'Cette pizza est déjà dans vos favoris') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout aux favoris'
      });
    }
  }

  // Retirer une pizza des favoris
  async removeFromFavorites(req, res) {
    try {
      const { pizzaId } = req.params;
      const userId = req.user._id;

      console.log('💔 Retrait de pizza des favoris:', { userId, pizzaId });

      if (!pizzaId) {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza requis'
        });
      }

      const favorites = await UserRepository.removeFavorite(userId, pizzaId);

      console.log('✅ Pizza retirée des favoris');
      return res.json({
        success: true,
        message: 'Pizza retirée des favoris avec succès',
        favoritesCount: favorites.length,
        favorites: favorites
      });
    } catch (error) {
      console.error('❌ Erreur removeFromFavorites:', error);
      
      if (error.message === 'Cette pizza n\'est pas dans vos favoris') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du retrait des favoris'
      });
    }
  }

  // Vérifier si une pizza est favorite
  async checkFavorite(req, res) {
    try {
      const { pizzaId } = req.params;
      const userId = req.user._id;

      const isFavorite = await UserRepository.isFavorite(userId, pizzaId);

      return res.json({
        success: true,
        isFavorite: isFavorite
      });
    } catch (error) {
      console.error('❌ Erreur checkFavorite:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des favoris'
      });
    }
  }

  // Vider tous les favoris
  async clearFavorites(req, res) {
    try {
      const userId = req.user._id;

      console.log('🗑️ Vidage des favoris pour:', req.user.email);

      await UserRepository.clearFavorites(userId);

      console.log('✅ Favoris vidés avec succès');
      return res.json({
        success: true,
        message: 'Tous les favoris ont été supprimés',
        favorites: []
      });
    } catch (error) {
      console.error('❌ Erreur clearFavorites:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du vidage des favoris'
      });
    }
  }

  // Récupérer le nombre de favoris
  async getFavoritesCount(req, res) {
    try {
      const userId = req.user._id;

      const count = await UserRepository.countFavorites(userId);

      return res.json({
        success: true,
        count: count
      });
    } catch (error) {
      console.error('❌ Erreur getFavoritesCount:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du comptage des favoris'
      });
    }
  }

  // Récupérer les pizzas populaires
  async getPopularPizzas(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      
      const popularPizzas = await UserRepository.getPopularPizzas(limit);

      return res.json({
        success: true,
        count: popularPizzas.length,
        pizzas: popularPizzas.map(pizza => ({
          _id: pizza._id,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          imageUrl: pizza.imageUrl,
          popularity: pizza.popularity,
          isPopular: true
        }))
      });
    } catch (error) {
      console.error('❌ Erreur getPopularPizzas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des pizzas populaires'
      });
    }
  }

  // Basculer (ajouter/retirer) une pizza des favoris
  async toggleFavorite(req, res) {
    try {
      const { pizzaId } = req.params;
      const userId = req.user._id;

      console.log('🔄 Basculer favori:', { userId, pizzaId });

      // Vérifier d'abord si c'est un favori
      const isFavorite = await UserRepository.isFavorite(userId, pizzaId);

      let action, favorites;
      
      if (isFavorite) {
        // Retirer des favoris
        favorites = await UserRepository.removeFavorite(userId, pizzaId);
        action = 'removed';
      } else {
        // Ajouter aux favoris
        favorites = await UserRepository.addFavorite(userId, pizzaId);
        action = 'added';
      }

      return res.json({
        success: true,
        message: `Pizza ${action === 'added' ? 'ajoutée aux' : 'retirée des'} favoris`,
        action: action,
        isFavorite: !isFavorite,
        favoritesCount: favorites.length,
        favorites: favorites
      });
    } catch (error) {
      console.error('❌ Erreur toggleFavorite:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la modification des favoris'
      });
    }
  }

  // Récupérer les IDs des favoris seulement (pour le frontend)
  async getFavoritesIds(req, res) {
    try {
      const userId = req.user._id;

      const user = await UserRepository.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      return res.json({
        success: true,
        favorites: user.favorites || []
      });
    } catch (error) {
      console.error('❌ Erreur getFavoritesIds:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des IDs des favoris'
      });
    }
  }
}

module.exports = new UserService();
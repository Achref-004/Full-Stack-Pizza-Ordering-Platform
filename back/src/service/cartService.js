const CartRepository = require('../repository/cartRepository');
const PizzaRepository = require('../repository/pizzaRepository');
const mongoose = require('mongoose');

class CartService {
  
  // Récupérer le panier de l'utilisateur
  async getCart(req, res) {
    try {
      const userId = req.user._id;
      
      const cart = await CartRepository.findByUserId(userId);
      
      if (!cart) {
        return res.json({
          success: true,
          message: 'Panier vide',
          cart: {
            items: [],
            total: 0,
            itemCount: 0
          }
        });
      }
      
      return res.json({
        success: true,
        cart: {
          id: cart._id,
          items: cart.items.map(item => ({
            id: item._id,
            pizzaId: item.pizzaId,
            pizzaName: item.pizzaName,
            config: item.config,
            price: item.price,
            unitPrice: item.unitPrice || (item.price / item.config.quantity), // ✅ AJOUT
            quantity: item.config.quantity,
            isCustom: item.isCustom || false,
            customDescription: item.customDescription || ''
          })),
          total: cart.total,
          itemCount: cart.items.reduce((sum, item) => sum + item.config.quantity, 0),
          updatedAt: cart.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ Erreur getCart:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du panier'
      });
    }
  }

  // Ajouter une pizza au panier
  async addToCart(req, res) {
    try {
      const userId = req.user._id;
      const { pizzaId, pizzaName, config, totalPrice, isCustom = false, customDescription } = req.body;
      
      console.log('🔥 Données reçues pour addToCart:', {
        pizzaId,
        pizzaName,
        config,
        totalPrice,
        isCustom,
        customDescription
      });
      
      // Validation des données
      if (!pizzaName || !config || totalPrice === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Données incomplètes: nom, configuration et prix requis'
        });
      }
      
      // Validation de la configuration
      if (!config.size || !config.crust || config.quantity === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Configuration incomplète: taille, pâte et quantité requises'
        });
      }
      
      if (config.quantity < 1 || config.quantity > 10) {
        return res.status(400).json({
          success: false,
          message: 'La quantité doit être entre 1 et 10'
        });
      }
      
      // Vérifier le prix
      const price = parseFloat(totalPrice);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Prix invalide'
        });
      }
      
      // ✅ AJOUT : Calculer et valider le prix unitaire
      const unitPrice = price / config.quantity;
      console.log('💰 Prix unitaire calculé:', unitPrice);
      
      // Vérifier si c'est une pizza normale (pas custom)
      if (!isCustom && pizzaId && pizzaId !== 'custom' && pizzaId !== 'surprise') {
        // Vérifier si c'est un ObjectId valide
        if (mongoose.Types.ObjectId.isValid(pizzaId)) {
          try {
            const pizza = await PizzaRepository.findById(pizzaId);
            if (!pizza) {
              return res.status(404).json({
                success: false,
                message: 'Pizza non trouvée'
              });
            }
            
            if (!pizza.isAvailable) {
              return res.status(400).json({
                success: false,
                message: 'Cette pizza n\'est pas disponible pour le moment'
              });
            }
          } catch (error) {
            console.error('⚠️ Erreur vérification pizza:', error);
            // On continue même si la vérification échoue
          }
        } else if (pizzaId && pizzaId.startsWith('custom_')) {
          // C'est une pizza personnalisée sauvegardée
          try {
            const pizza = await PizzaRepository.findCustomById(pizzaId);
            if (!pizza) {
              return res.status(404).json({
                success: false,
                message: 'Pizza personnalisée non trouvée'
              });
            }
            
            if (!pizza.isAvailable) {
              return res.status(400).json({
                success: false,
                message: 'Cette pizza personnalisée n\'est pas disponible pour le moment'
              });
            }
          } catch (error) {
            console.error('⚠️ Erreur vérification pizza custom:', error);
            // On continue même si la vérification échoue
          }
        }
      }
      
      // Préparer les données de l'item
      const itemData = {
        pizzaId: pizzaId,
        pizzaName: pizzaName,
        config: {
          size: config.size,
          crust: config.crust,
          toppings: config.toppings || [],
          quantity: config.quantity
        },
        price: price,
        unitPrice: unitPrice, // ✅ AJOUT CRUCIAL
        isCustom: isCustom,
        customDescription: customDescription || ''
      };
      
      console.log('📤 Données à sauvegarder:', itemData);
      
      // Ajouter au panier
      const cart = await CartRepository.addItem(userId, itemData);
      
      return res.json({
        success: true,
        message: isCustom ? 'Pizza personnalisée ajoutée au panier' : 'Pizza ajoutée au panier',
        cart: {
          id: cart._id,
          items: cart.items.map(item => ({
            id: item._id,
            pizzaId: item.pizzaId,
            pizzaName: item.pizzaName,
            config: item.config,
            price: item.price,
            unitPrice: item.unitPrice || (item.price / item.config.quantity), // ✅ AJOUT
            quantity: item.config.quantity,
            isCustom: item.isCustom || false,
            customDescription: item.customDescription || ''
          })),
          total: cart.total,
          itemCount: cart.items.reduce((sum, item) => sum + item.config.quantity, 0)
        }
      });
    } catch (error) {
      console.error('❌ Erreur addToCart:', error);
      
      // Gestion spécifique pour les erreurs de validation MongoDB
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de pizza invalide',
          details: error.message
        });
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          errors: messages
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout au panier',
        error: error.message
      });
    }
  }

  // Mettre à jour la quantité d'un item
  async updateItemQuantity(req, res) {
    try {
      const userId = req.user._id;
      const { itemId } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 1 || quantity > 10) {
        return res.status(400).json({
          success: false,
          message: 'La quantité doit être entre 1 et 10'
        });
      }
      
      const cart = await CartRepository.updateItemQuantity(userId, itemId, parseInt(quantity));
      
      return res.json({
        success: true,
        message: 'Quantité mise à jour',
        cart: {
          id: cart._id,
          items: cart.items.map(item => ({
            id: item._id,
            pizzaId: item.pizzaId,
            pizzaName: item.pizzaName,
            config: item.config,
            price: item.price,
            unitPrice: item.unitPrice || (item.price / item.config.quantity), // ✅ AJOUT
            quantity: item.config.quantity,
            isCustom: item.isCustom || false
          })),
          total: cart.total,
          itemCount: cart.items.reduce((sum, item) => sum + item.config.quantity, 0)
        }
      });
    } catch (error) {
      console.error('❌ Erreur updateItemQuantity:', error);
      
      if (error.message === 'Panier non trouvé' || error.message === 'Item non trouvé dans le panier') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la quantité'
      });
    }
  }

  // Supprimer un item du panier
  async removeItem(req, res) {
    try {
      const userId = req.user._id;
      const { itemId } = req.params;
      
      const cart = await CartRepository.removeItem(userId, itemId);
      
      return res.json({
        success: true,
        message: 'Item supprimé du panier',
        cart: {
          id: cart._id,
          items: cart.items.map(item => ({
            id: item._id,
            pizzaId: item.pizzaId,
            pizzaName: item.pizzaName,
            config: item.config,
            price: item.price,
            unitPrice: item.unitPrice || (item.price / item.config.quantity), // ✅ AJOUT
            quantity: item.config.quantity,
            isCustom: item.isCustom || false
          })),
          total: cart.total,
          itemCount: cart.items.reduce((sum, item) => sum + item.config.quantity, 0)
        }
      });
    } catch (error) {
      console.error('❌ Erreur removeItem:', error);
      
      if (error.message === 'Panier non trouvé') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'item'
      });
    }
  }

  // Vider le panier
  async clearCart(req, res) {
    try {
      const userId = req.user._id;
      
      const cart = await CartRepository.clearCart(userId);
      
      return res.json({
        success: true,
        message: 'Panier vidé avec succès',
        cart: {
          id: cart._id,
          items: [],
          total: 0,
          itemCount: 0
        }
      });
    } catch (error) {
      console.error('❌ Erreur clearCart:', error);
      
      if (error.message === 'Panier non trouvé') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du vidage du panier'
      });
    }
  }

  // Obtenir le nombre d'items dans le panier
  async getCartItemCount(req, res) {
    try {
      const userId = req.user._id;
      
      const itemCount = await CartRepository.getItemCount(userId);
      
      return res.json({
        success: true,
        itemCount
      });
    } catch (error) {
      console.error('❌ Erreur getCartItemCount:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du comptage des items'
      });
    }
  }

  // Calculer le prix total du panier
  async calculateCartTotal(req, res) {
    try {
      const userId = req.user._id;
      
      const cart = await CartRepository.findByUserId(userId);
      
      if (!cart) {
        return res.json({
          success: true,
          total: 0
        });
      }
      
      return res.json({
        success: true,
        total: cart.total
      });
    } catch (error) {
      console.error('❌ Erreur calculateCartTotal:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du calcul du total'
      });
    }
  }

  // ✅ NOUVELLE ROUTE : Corriger les prix unitaires manquants
  async fixCartPrices(req, res) {
    try {
      const userId = req.user._id;
      
      const cart = await CartRepository.fixMissingUnitPrices(userId);
      
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Panier non trouvé'
        });
      }
      
      return res.json({
        success: true,
        message: 'Prix unitaires corrigés avec succès',
        cart: {
          id: cart._id,
          items: cart.items.map(item => ({
            id: item._id,
            pizzaName: item.pizzaName,
            quantity: item.config.quantity,
            price: item.price,
            unitPrice: item.unitPrice
          })),
          total: cart.total
        }
      });
    } catch (error) {
      console.error('❌ Erreur fixCartPrices:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la correction des prix'
      });
    }
  }
}

module.exports = new CartService();
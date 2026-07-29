const OrderRepository = require('../repository/orderRepository');
const CartRepository = require('../repository/cartRepository');
const EmailService = require('./emailService');
const { User, Order } = require('../model');

class OrderService {
  // Passer une commande - VERSION SANS TVA
  async placeOrder(req, res) {
    try {
      const userId = req.user._id;
      const { 
        deliveryAddress, 
        deliveryMethod = 'delivery', 
        paymentMethod = 'cash',
        notes = '' 
      } = req.body;

      // Validation
      if (!deliveryAddress || !deliveryAddress.address || !deliveryAddress.city || !deliveryAddress.state) {
        return res.status(400).json({
          success: false,
          message: 'Adresse de livraison incomplète'
        });
      }

      // Récupérer le panier
      const cart = await CartRepository.findByUserId(userId);
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Votre panier est vide'
        });
      }

      // CALCULS SANS TVA
      const subtotal = cart.total;
      const tva = 0; // ✅ TVA RETIRÉE
      const deliveryFee = deliveryMethod === 'delivery' ? (subtotal > 30 ? 0 : 3.500) : 0;
      const total = subtotal + deliveryFee; // ✅ Total sans TVA

      // Récupérer l'utilisateur pour l'email
      const user = await User.findById(userId);

      // Créer la commande SANS TVA
      const orderData = {
        user: userId,
        items: cart.items.map(item => ({
          pizzaId: item.pizzaId,
          pizzaName: item.pizzaName,
          config: item.config,
          price: item.price,
          unitPrice: item.unitPrice || (item.price / (item.config?.quantity || 1)),
          isCustom: item.isCustom || false,
          customDescription: item.customDescription || ''
        })),
        subtotal,
        tva: 0, // ✅ TVA à 0
        deliveryFee,
        total,
        deliveryAddress,
        deliveryMethod,
        paymentMethod,
        notes,
        status: 'pending',
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid'
      };

      const order = await OrderRepository.create(orderData);

      // Vider le panier
      await CartRepository.clearCart(userId);

      // Envoyer l'email de confirmation
      await EmailService.sendOrderConfirmation(order, user);

      return res.json({
        success: true,
        message: '🎉 Commande passée avec succès !',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          subtotal: order.subtotal, // ✅ Ajouter subtotal dans la réponse
          tva: order.tva, // ✅ Tva à 0
          deliveryFee: order.deliveryFee, // ✅ Ajouter frais livraison
          total: order.total,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          status: order.status,
          items: order.items.map(item => ({
            pizzaName: item.pizzaName,
            quantity: item.config.quantity,
            price: item.price
          }))
        }
      });
    } catch (error) {
      console.error('❌ Erreur placeOrder:', error);
      
      if (error.name === 'ValidationError') {
        const errorMessages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          errors: errorMessages
        });
      }
      
      if (error.code === 11000 && error.keyPattern?.orderNumber) {
        return res.status(400).json({
          success: false,
          message: 'Erreur: Numéro de commande en doublon, veuillez réessayer'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la commande'
      });
    }
  }

  // Récupérer les commandes de l'utilisateur
  async getUserOrders(req, res) {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;
      const search = req.query.search;

      // Construire la requête
      const filters = {};
      
      // Filtrer par statut
      if (status && status !== 'all') {
        filters.status = status;
      }
      
      // Filtrer par recherche
      if (search && search.trim() !== '') {
        filters.search = search;
      }

      const result = await OrderRepository.findByUserId(userId, page, limit, filters);
      
      return res.json({
        success: true,
        orders: result.orders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          subtotal: order.subtotal,
          tva: order.tva, // ✅ 0
          deliveryFee: order.deliveryFee,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          itemCount: order.items.reduce((sum, item) => sum + (item.config?.quantity || 1), 0),
          items: order.items.map(item => ({
            pizzaId: item.pizzaId?._id || item.pizzaId,
            pizzaName: item.pizzaName,
            price: item.price,
            quantity: item.config?.quantity || 1,
            config: item.config || {}
          }))
        })),
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('❌ Erreur getUserOrders:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commandes'
      });
    }
  }

  // Récupérer les détails d'une commande
  async getOrderDetails(req, res) {
    try {
      const userId = req.user._id;
      const { id } = req.params;

      const order = await OrderRepository.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      // Vérifier que l'utilisateur est le propriétaire ou admin
      if (order.user._id.toString() !== userId.toString() && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      return res.json({
        success: true,
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          items: order.items.map(item => ({
            pizzaId: item.pizzaId?._id || item.pizzaId,
            pizzaName: item.pizzaName,
            pizzaImage: item.pizzaId?.imageUrl,
            config: {
              size: item.config.size,
              crust: item.config.crust,
              toppings: item.config.toppings,
              quantity: item.config.quantity
            },
            price: item.price,
            unitPrice: item.unitPrice || (item.price / (item.config?.quantity || 1)),
            isCustom: item.isCustom,
            customDescription: item.customDescription
          })),
          subtotal: order.subtotal,
          tva: order.tva, // ✅ 0
          deliveryFee: order.deliveryFee,
          total: order.total,
          deliveryAddress: order.deliveryAddress,
          deliveryMethod: order.deliveryMethod,
          paymentMethod: order.paymentMethod,
          status: order.status,
          paymentStatus: order.paymentStatus,
          notes: order.notes,
          createdAt: order.createdAt,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          deliveredAt: order.deliveredAt
        }
      });
    } catch (error) {
      console.error('❌ Erreur getOrderDetails:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des détails'
      });
    }
  }

  // Annuler une commande
  async cancelOrder(req, res) {
    try {
      const userId = req.user._id;
      const { id } = req.params;

      const order = await OrderRepository.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      // Vérifier que l'utilisateur est le propriétaire
      if (order.user._id.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      // Vérifier si la commande peut être annulée
      if (['delivered', 'cancelled', 'out_for_delivery'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cette commande ne peut pas être annulée'
        });
      }

      // Mettre à jour le statut
      const updatedOrder = await OrderRepository.updateStatus(id, 'cancelled');

      // Envoyer email de notification
      const user = await User.findById(userId);
      await EmailService.sendOrderStatusUpdate(updatedOrder, user, 'cancelled');

      return res.json({
        success: true,
        message: 'Commande annulée avec succès',
        order: {
          id: updatedOrder._id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status
        }
      });
    } catch (error) {
      console.error('❌ Erreur cancelOrder:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'annulation'
      });
    }
  }

  // Suivre une commande
  async trackOrder(req, res) {
    try {
      const userId = req.user._id;
      const { orderNumber } = req.params;

      // Utiliser Order importé depuis le modèle
      const order = await Order.findOne({ orderNumber })
        .populate('user', 'firstName lastName');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      // Vérifier que l'utilisateur est le propriétaire ou admin
      if (order.user._id.toString() !== userId.toString() && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      const statusMap = {
        'pending': { 
          status: 'En attente de confirmation',
          description: 'Votre commande est en attente de confirmation',
          progress: 20,
          icon: '⏳'
        },
        'confirmed': { 
          status: 'Confirmée',
          description: 'Votre commande a été confirmée',
          progress: 40,
          icon: '✅'
        },
        'preparing': { 
          status: 'En préparation',
          description: 'Nos chefs préparent vos pizzas',
          progress: 60,
          icon: '👨‍🍳'
        },
        'out_for_delivery': { 
          status: 'En route',
          description: 'Notre livreur est en route vers vous',
          progress: 80,
          icon: '🚚'
        },
        'delivered': { 
          status: 'Livrée',
          description: 'Votre commande a été livrée',
          progress: 100,
          icon: '🎉'
        },
        'cancelled': { 
          status: 'Annulée',
          description: 'Cette commande a été annulée',
          progress: 0,
          icon: '❌'
        }
      };

      const statusInfo = statusMap[order.status] || statusMap.pending;
      const now = new Date();
      const estimatedTime = new Date(order.estimatedDeliveryTime);
      const timeRemaining = estimatedTime - now;
      const minutesRemaining = Math.max(0, Math.floor(timeRemaining / 60000));

      return res.json({
        success: true,
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          statusInfo: {
            ...statusInfo,
            estimatedDeliveryTime: order.estimatedDeliveryTime,
            minutesRemaining,
            isLate: minutesRemaining < 0
          },
          items: order.items.map(item => ({
            pizzaName: item.pizzaName,
            quantity: item.config.quantity,
            price: item.price
          })),
          subtotal: order.subtotal,
          tva: order.tva, // ✅ 0
          deliveryFee: order.deliveryFee,
          total: order.total,
          deliveryAddress: order.deliveryAddress,
          createdAt: order.createdAt
        }
      });
    } catch (error) {
      console.error('❌ Erreur trackOrder:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du suivi'
      });
    }
  }

  // Obtenir l'historique des commandes
  async getOrderHistory(req, res) {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;

      const filters = {};
      if (status && status !== 'all') {
        filters.status = status;
      }

      if (req.query.startDate && req.query.endDate) {
        filters.startDate = req.query.startDate;
        filters.endDate = req.query.endDate;
      }

      const result = await OrderRepository.findByUserId(userId, page, limit, filters);

      // Statistiques personnelles
      const totalSpent = result.orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = result.total;
      const favoritePizza = await this.getFavoritePizza(userId);

      return res.json({
        success: true,
        orders: result.orders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          subtotal: order.subtotal,
          tva: order.tva, // ✅ 0
          deliveryFee: order.deliveryFee,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
          itemCount: order.items.reduce((sum, item) => sum + item.config.quantity, 0),
          items: order.items.slice(0, 2).map(item => ({
            pizzaName: item.pizzaName,
            quantity: item.config.quantity,
            price: item.price
          }))
        })),
        stats: {
          totalOrders,
          totalSpent: totalSpent.toFixed(3),
          averageOrderValue: totalOrders > 0 ? (totalSpent / totalOrders).toFixed(3) : 0,
          favoritePizza
        },
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('❌ Erreur getOrderHistory:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'historique'
      });
    }
  }

  async getFavoritePizza(userId) {
    try {
      // Utiliser Order importé
      const orders = await Order.find({ 
        user: userId,
        status: { $nin: ['cancelled', 'pending'] }
      });

      const pizzaCount = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          const pizzaName = item.pizzaName;
          pizzaCount[pizzaName] = (pizzaCount[pizzaName] || 0) + item.config.quantity;
        });
      });

      if (Object.keys(pizzaCount).length === 0) {
        return null;
      }

      const favorite = Object.entries(pizzaCount).reduce((a, b) => 
        a[1] > b[1] ? a : b
      );

      return {
        name: favorite[0],
        orderCount: favorite[1]
      };
    } catch (error) {
      console.error('❌ Erreur getFavoritePizza:', error);
      return null;
    }
  }
}

module.exports = new OrderService();
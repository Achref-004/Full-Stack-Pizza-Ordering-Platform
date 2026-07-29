// src/service/adminOrderService.js
const OrderRepository = require('../repository/orderRepository');
const EmailService = require('./emailService');
const { User } = require('../model');

class AdminOrderService {
  // Récupérer toutes les commandes
  async getAllOrders(req, res) {
    try {
      console.log('👑 Admin - Récupération de toutes les commandes');
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      const filters = {};
      if (req.query.status) filters.status = req.query.status;

      const result = await OrderRepository.findAll(page, limit, filters);

      console.log(`✅ ${result.total} commandes trouvées`);
      
      return res.json({
        success: true,
        orders: result.orders.map(order => {
          // ✅ CORRECTION ICI : Vérifier si order.user existe
          let userInfo = {
            id: null,
            name: 'Utilisateur inconnu',
            email: 'N/A'
          };
          
          if (order.user && order.user._id) {
            userInfo = {
              id: order.user._id,
              name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Utilisateur',
              email: order.user.email || 'N/A'
            };
          } else if (order.user && typeof order.user === 'string') {
            // Si c'est juste un ID string
            userInfo = {
              id: order.user,
              name: 'Utilisateur',
              email: 'N/A'
            };
          }
          
          return {
            id: order._id,
            orderNumber: order.orderNumber,
            user: userInfo,
            total: order.total,
            status: order.status,
            paymentMethod: order.paymentMethod,
            itemCount: order.items ? order.items.reduce((sum, item) => {
              // ✅ Vérifier aussi item et item.config
              if (item && item.config && item.config.quantity) {
                return sum + item.config.quantity;
              }
              return sum + (item.quantity || 0);
            }, 0) : 0,
            createdAt: order.createdAt
          };
        }),
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('❌ Erreur getAllOrders:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commandes'
      });
    }
  }

  // Mettre à jour le statut d'une commande
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      console.log(`👑 Admin - Mise à jour statut commande ${id}: ${status}`);

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Le statut est requis'
        });
      }

      const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Statut invalide'
        });
      }

      const order = await OrderRepository.updateStatus(id, status);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      // Envoyer email au client
      if (order.user) {
        const user = await User.findById(order.user);
        if (user) {
          await EmailService.sendOrderStatusUpdate(order, user, status);
        }
      }

      console.log(`✅ Statut mis à jour: ${status}`);

      return res.json({
        success: true,
        message: 'Statut de la commande mis à jour avec succès',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status
        }
      });
    } catch (error) {
      console.error('❌ Erreur updateOrderStatus:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut'
      });
    }
  }
}

module.exports = new AdminOrderService();
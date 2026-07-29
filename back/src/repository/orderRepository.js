const { Order } = require('../model');

class OrderRepository {
  // Créer une nouvelle commande
  async create(orderData) {
    const order = new Order(orderData);
    return await order.save();
  }

  // Trouver par ID
  async findById(id) {
    return await Order.findById(id)
      .populate('user', 'firstName lastName email');
  }

  // Trouver par user ID avec pagination
  async findByUserId(userId, page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const query = { user: userId };
    
    // Appliquer le filtre de statut
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    
    // Appliquer la recherche
    if (filters.search && filters.search.trim() !== '') {
      query.$or = [
        { orderNumber: { $regex: filters.search, $options: 'i' } },
        { 'items.pizzaName': { $regex: filters.search, $options: 'i' } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.pizzaId', 'name imageUrl'),
      Order.countDocuments(query)
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Récupérer toutes les commandes (admin)
  async findAll(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;
    const query = {};

    // Appliquer les filtres
    if (filters.status) query.status = filters.status;
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }
    if (filters.orderNumber) {
      query.orderNumber = { $regex: filters.orderNumber, $options: 'i' };
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Mettre à jour le statut d'une commande
  async updateStatus(orderId, status) {
    const updates = { status };
    
    if (status === 'delivered') {
      updates.deliveredAt = new Date();
    }
    
    return await Order.findByIdAndUpdate(
      orderId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email');
  }

  // Mettre à jour le statut de paiement
  async updatePaymentStatus(orderId, paymentStatus) {
    return await Order.findByIdAndUpdate(
      orderId,
      { $set: { paymentStatus } },
      { new: true }
    );
  }

  // Supprimer une commande (admin seulement)
  async delete(orderId) {
    return await Order.findByIdAndDelete(orderId);
  }

  // Récupérer les statistiques des commandes
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [
      totalOrders,
      todayOrders,
      thisMonthOrders,
      pendingOrders,
      revenueToday,
      revenueThisMonth,
      totalRevenue
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    return {
      totalOrders,
      todayOrders,
      thisMonthOrders,
      pendingOrders,
      revenueToday: revenueToday[0]?.total || 0,
      revenueThisMonth: revenueThisMonth[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageOrderValue: totalOrders > 0 ? (totalRevenue[0]?.total || 0) / totalOrders : 0
    };
  }

  // Récupérer les commandes récentes
  async getRecentOrders(limit = 5) {
    return await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'firstName lastName')
      .select('orderNumber total status createdAt');
  }

  // Vérifier si un utilisateur a déjà commandé une pizza
  async hasUserOrderedPizza(userId, pizzaId) {
    const order = await Order.findOne({
      user: userId,
      'items.pizzaId': pizzaId,
      status: { $nin: ['cancelled', 'pending'] }
    });
    
    return !!order;
  }
}

module.exports = new OrderRepository();
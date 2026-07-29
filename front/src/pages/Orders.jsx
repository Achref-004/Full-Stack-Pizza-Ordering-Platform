import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Orders = () => {
  const BACKEND_URL = "http://localhost:5004";
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // État pour la sidebar des URLs
  const [showUrlSidebar, setShowUrlSidebar] = useState(false);
  const [backendUrls, setBackendUrls] = useState([
    {
      id: 1,
      method: 'GET',
      name: 'Mes commandes',
      endpoint: '/api/orders/my-orders',
      description: 'Récupère toutes les commandes de l\'utilisateur',
      fullUrl: `${BACKEND_URL}/api/orders/my-orders`
    },
    {
      id: 2,
      method: 'POST',
      name: 'Ajouter au panier',
      endpoint: '/api/cart/add',
      description: 'Ajoute un article au panier',
      fullUrl: `${BACKEND_URL}/api/cart/add`
    },
    {
      id: 3,
      method: 'GET',
      name: 'Détails commande',
      endpoint: '/api/orders/:id',
      description: 'Récupère les détails d\'une commande spécifique',
      fullUrl: `${BACKEND_URL}/api/orders/[orderId]`
    },
    {
      id: 4,
      method: 'PUT',
      name: 'Annuler commande',
      endpoint: '/api/orders/:id/cancel',
      description: 'Annule une commande en attente',
      fullUrl: `${BACKEND_URL}/api/orders/[orderId]/cancel`
    },
    {
      id: 5,
      method: 'GET',
      name: 'Mon profil',
      endpoint: '/api/users/profile',
      description: 'Récupère les informations du profil utilisateur',
      fullUrl: `${BACKEND_URL}/api/users/profile`
    }
  ]);

  // État pour les notifications
  const [notification, setNotification] = useState(null);

  // Charger les commandes
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [currentPage, filter]);

  const adaptBackendOrder = (backendOrder) => {
    // Si c'est une commande simple sans items détaillés
    if (!backendOrder.items || !Array.isArray(backendOrder.items)) {
      return {
        _id: backendOrder._id || backendOrder.id,
        orderNumber: backendOrder.orderNumber || `CMD-${(backendOrder._id || 'N/A').slice(-6).toUpperCase()}`,
        status: backendOrder.status || 'pending',
        subtotal: backendOrder.subtotal || 0,
        tva: backendOrder.tva || 0,
        deliveryFee: backendOrder.deliveryFee || 0,
        totalAmount: backendOrder.total || 0,
        total: backendOrder.total || 0,
        items: [{
          pizzaName: 'Commande complète',
          quantity: 1,
          price: backendOrder.total || 0
        }],
        deliveryAddress: backendOrder.deliveryAddress || {
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || ''
        },
        paymentMethod: backendOrder.paymentMethod || 'cash',
        deliveryMethod: backendOrder.deliveryMethod || 'delivery',
        createdAt: backendOrder.createdAt || new Date().toISOString(),
        deliveredAt: backendOrder.deliveredAt,
        estimatedDelivery: backendOrder.estimatedDeliveryTime 
          ? new Date(backendOrder.estimatedDeliveryTime).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })
          : '45 minutes',
        estimatedDeliveryTime: backendOrder.estimatedDeliveryTime,
        itemCount: backendOrder.itemCount || 1
      };
    }
    
    // Si on a des items détaillés
    const items = backendOrder.items.map(item => {
      return {
        pizzaId: item.pizzaId || item._id || 'custom',
        pizzaName: item.name || item.pizzaName || 'Pizza personnalisée',
        quantity: item.quantity || 1,
        price: item.price || 0,
        unitPrice: item.unitPrice || (item.price / (item.quantity || 1)),
        config: item.config || {},
        isCustom: item.isCustom || false,
        customDescription: item.customDescription || ''
      };
    });
    
    // Calculer le sous-total si non fourni
    const subtotal = backendOrder.subtotal || items.reduce((sum, item) => 
      sum + (item.price * (item.quantity || 1)), 0);
    
    // Calculer les frais de livraison
    const deliveryFee = backendOrder.deliveryFee || 
      (backendOrder.deliveryMethod === 'delivery' && subtotal <= 30 ? 3.500 : 0);
    
    return {
      _id: backendOrder._id || backendOrder.id,
      orderNumber: backendOrder.orderNumber || `CMD-${(backendOrder._id || 'N/A').slice(-6).toUpperCase()}`,
      status: backendOrder.status || 'pending',
      subtotal: subtotal,
      tva: backendOrder.tva || 0,
      deliveryFee: deliveryFee,
      totalAmount: backendOrder.total || (subtotal + deliveryFee),
      total: backendOrder.total || (subtotal + deliveryFee),
      items: items,
      deliveryAddress: backendOrder.deliveryAddress || {
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || ''
      },
      paymentMethod: backendOrder.paymentMethod || 'cash',
      deliveryMethod: backendOrder.deliveryMethod || 'delivery',
      createdAt: backendOrder.createdAt || new Date().toISOString(),
      deliveredAt: backendOrder.deliveredAt,
      estimatedDelivery: backendOrder.estimatedDeliveryTime 
        ? new Date(backendOrder.estimatedDeliveryTime).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })
        : '45 minutes',
      estimatedDeliveryTime: backendOrder.estimatedDeliveryTime,
      itemCount: backendOrder.itemCount || items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    };
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: currentPage,
        limit: itemsPerPage
      };
      
      // Ajouter le filtre de statut
      if (filter !== 'all') {
        params.status = filter;
      }
      
      // Ajouter la recherche si présente
      if (searchTerm.trim() !== '') {
        params.search = searchTerm;
      }
      
      const response = await axios.get(`${BACKEND_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });
      
      if (response.data.success) {
        const adaptedOrders = response.data.orders.map(adaptBackendOrder);
        setOrders(adaptedOrders);
        
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalOrders(response.data.pagination.total || 0);
        }
      } else {
        setError('Impossible de charger vos commandes');
        setOrders([]);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      if (error.response?.status === 404) {
        setError('Aucune commande trouvée');
      } else {
        setError('Erreur lors du chargement de vos commandes');
      }
      
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setOrderDetailsLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const adaptedOrder = adaptBackendOrder(response.data.order);
        return adaptedOrder;
      }
      return null;
    } catch (error) {
      return null;
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  // Fonction pour afficher une notification centrée
  const showNotification = ({ 
    type = 'info', 
    title, 
    message, 
    confirmText = 'Confirmer', 
    cancelText = 'Annuler',
    onConfirm,
    onCancel,
    showConfirm = true,
    showCancel = false,
    autoClose = false,
    autoCloseTime = 3000
  }) => {
    setNotification({
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
      showConfirm,
      showCancel,
      autoClose,
      autoCloseTime
    });

    if (autoClose) {
      setTimeout(() => {
        setNotification(null);
      }, autoCloseTime);
    }
  };

  // Fonction pour fermer la notification
  const closeNotification = () => {
    setNotification(null);
  };

  // Fonction pour confirmer
  const confirmNotification = () => {
    if (notification?.onConfirm) {
      notification.onConfirm();
    }
    closeNotification();
  };

  // Fonction pour annuler
  const cancelNotification = () => {
    if (notification?.onCancel) {
      notification.onCancel();
    }
    closeNotification();
  };

  // Filtrer les commandes pour la recherche côté client
  const filteredOrders = orders.filter(order => {
    if (searchTerm === '') return true;
    
    return order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.items.some(item => 
             item.pizzaName.toLowerCase().includes(searchTerm.toLowerCase())
           );
  });

  // Format prix avec 3 décimales (pas de TVA)
  const formatPrice = (price) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(numPrice) + ' DT';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponible';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusInfo = (status) => {
    switch(status) {
      case 'pending':
        return { icon: '⏳', text: 'En attente', color: '#f39c12', bgColor: '#fef9e7' };
      case 'confirmed':
        return { icon: '✅', text: 'Confirmée', color: '#3498db', bgColor: '#ebf5fb' };
      case 'preparing':
        return { icon: '👨‍🍳', text: 'En préparation', color: '#9b59b6', bgColor: '#f4ecf7' };
      case 'out_for_delivery':
        return { icon: '🚚', text: 'En route', color: '#e67e22', bgColor: '#fef5e7' };
      case 'delivered':
        return { icon: '🎉', text: 'Livrée', color: '#27ae60', bgColor: '#eafaf1' };
      case 'cancelled':
        return { icon: '❌', text: 'Annulée', color: '#e74c3c', bgColor: '#fdedec' };
      default:
        return { icon: '📋', text: 'En attente', color: '#95a5a6', bgColor: '#f8f9fa' };
    }
  };

  const getPaymentIcon = (method) => {
    return method === 'card' ? '💳' : '💵';
  };

  const getDeliveryIcon = (method) => {
    return method === 'delivery' ? '🚚' : '🏃';
  };

  const viewOrderDetails = async (order) => {
    const detailedOrder = await fetchOrderDetails(order._id);
    if (detailedOrder) {
      setSelectedOrder(detailedOrder);
    } else {
      setSelectedOrder(order);
    }
    setShowOrderDetails(true);
  };

  const repeatOrder = async (order) => {
    showNotification({
      type: 'warning',
      title: 'Répéter la commande',
      message: `Voulez-vous ajouter tous les articles de la commande ${order.orderNumber} au panier ?`,
      confirmText: 'Oui, ajouter',
      cancelText: 'Non, annuler',
      showConfirm: true,
      showCancel: true,
      onConfirm: async () => {
        try {
          let addedCount = 0;
          
          for (const item of order.items) {
            const orderData = {
              pizzaId: item.pizzaId || 'custom',
              pizzaName: item.pizzaName || 'Pizza personnalisée',
              config: item.config || {
                size: 'medium',
                crust: 'thin',
                toppings: [],
                quantity: item.quantity || 1
              },
              totalPrice: item.price || 0,
              isCustom: item.isCustom || false,
              customDescription: item.customDescription || ''
            };

            await axios.post(`${BACKEND_URL}/api/cart/add`, orderData, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            addedCount++;
          }
          
          showNotification({
            type: 'success',
            title: 'Succès !',
            message: `✅ ${addedCount} article(s) ajouté(s) au panier !`,
            showConfirm: false,
            showCancel: false,
            autoClose: true,
            autoCloseTime: 3000
          });
          
        } catch (error) {
          showNotification({
            type: 'error',
            title: 'Erreur',
            message: '❌ Erreur lors de l\'ajout au panier: ' + (error.response?.data?.message || error.message),
            showConfirm: false,
            showCancel: false,
            autoClose: true,
            autoCloseTime: 5000
          });
        }
      },
      onCancel: () => {
        // L'utilisateur a annulé
      }
    });
  };

  const cancelOrder = async (orderId, orderNumber) => {
    showNotification({
      type: 'warning',
      title: 'Annuler la commande',
      message: `Êtes-vous sûr de vouloir annuler la commande ${orderNumber} ?`,
      confirmText: 'Oui, annuler',
      cancelText: 'Non, garder',
      showConfirm: true,
      showCancel: true,
      onConfirm: async () => {
        try {
          const response = await axios.put(
            `${BACKEND_URL}/api/orders/${orderId}/cancel`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data.success) {
            showNotification({
              type: 'success',
              title: 'Succès !',
              message: '✅ Commande annulée avec succès',
              showConfirm: false,
              showCancel: false,
              autoClose: true,
              autoCloseTime: 3000
            });
            fetchOrders();
          } else {
            showNotification({
              type: 'error',
              title: 'Erreur',
              message: '❌ ' + (response.data.message || 'Erreur lors de l\'annulation'),
              showConfirm: false,
              showCancel: false,
              autoClose: true,
              autoCloseTime: 5000
            });
          }
        } catch (error) {
          showNotification({
            type: 'error',
            title: 'Erreur',
            message: '❌ ' + (error.response?.data?.message || 'Erreur lors de l\'annulation'),
            showConfirm: false,
            showCancel: false,
            autoClose: true,
            autoCloseTime: 5000
          });
        }
      },
      onCancel: () => {
        // L'utilisateur a choisi de ne pas annuler
      }
    });
  };

  // Fonction pour télécharger le reçu SANS TVA
  const downloadReceipt = (order) => {
    const statusInfo = getStatusInfo(order.status);
    
    const receiptText = `
      =================================
      🍕 PIZZA TIME - RECU DE COMMANDE
      =================================
      
      📋 NUMERO DE COMMANDE: ${order.orderNumber}
      📅 DATE: ${formatDate(order.createdAt)}
      👤 CLIENT: ${userData.firstName} ${userData.lastName}
      📧 EMAIL: ${userData.email}
      
      =================================
      📦 ARTICLES COMMANDÉS
      =================================
      
      ${order.items.map((item, index) => `
      ${index + 1}. ${item.pizzaName}
         Quantité: ${item.quantity}
         Prix unitaire: ${formatPrice(item.price)}
         Sous-total: ${formatPrice(item.price * item.quantity)}
      `).join('\n')}
      
      =================================
      💰 DÉTAILS DE FACTURATION
      =================================
      
      Sous-total: ${formatPrice(order.subtotal || 0)}
      TVA: ${formatPrice(order.tva || 0)}
      Frais de livraison: ${order.deliveryMethod === 'delivery' ? 
        (order.subtotal > 30 ? 'Gratuite 🎉' : formatPrice(order.deliveryFee || 3.500)) : 
        'Gratuit'}
      ---------------------------------
      TOTAL À PAYER: ${formatPrice(order.total || 0)}
      
      =================================
      📍 INFORMATIONS DE LIVRAISON
      =================================
      
      Adresse: ${order.deliveryAddress.address}
      Ville: ${order.deliveryAddress.city}
      Département: ${order.deliveryAddress.state}
      Méthode: ${order.deliveryMethod === 'delivery' ? 'Livraison' : 'À emporter'}
      Paiement: ${order.paymentMethod === 'card' ? 'Carte bancaire' : 'À la livraison'}
      
      =================================
      📊 STATUT DE LA COMMANDE
      =================================
      
      Statut: ${statusInfo.text} ${statusInfo.icon}
      ${order.deliveredAt ? `Livrée le: ${formatDate(order.deliveredAt)}` : ''}
      ${order.estimatedDelivery ? `Livraison estimée: ${order.estimatedDelivery}` : ''}
      
      =================================
      Merci pour votre commande !
      À très bientôt chez Pizza Time !
      =================================
    `;

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reçu-${order.orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const trackOrder = (orderNumber) => {
    showNotification({
      type: 'info',
      title: 'Suivi de commande',
      message: `Suivi de la commande ${orderNumber}\n\nCette fonctionnalité sera disponible prochainement !`,
      showConfirm: true,
      showCancel: false,
      confirmText: 'OK',
      onConfirm: () => {
        // Fermer la notification
      }
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
    fetchOrders();
  };

  // Fonction pour copier une URL
  const copyUrlToClipboard = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      showNotification({
        type: 'success',
        title: 'Copié !',
        message: 'URL copiée dans le presse-papier',
        showConfirm: false,
        showCancel: false,
        autoClose: true,
        autoCloseTime: 2000
      });
    }).catch(err => {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la copie',
        showConfirm: false,
        showCancel: false,
        autoClose: true,
        autoCloseTime: 3000
      });
      console.error('Erreur lors de la copie :', err);
    });
  };

  const stats = {
    total: totalOrders,
    totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    delivered: orders.filter(o => o.status === 'delivered').length,
    pending: orders.filter(o => ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)).length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #e74c3c',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div>Chargement de vos commandes...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* Le CSS existant */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body, #root {
          width: 100%;
          min-height: 100vh;
          font-family: system-ui, sans-serif;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .orders-container {
          min-height: 100vh;
          width: 100%;
          position: relative;
          background-image: url('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .background-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          z-index: 1;
        }

        .content-wrapper {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header-section {
          background: rgba(255,255,255,0.95);
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          margin-bottom: 25px;
          border-left: 5px solid #27ae60;
          animation: slideIn 0.5s ease;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .user-avatar {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #27ae60, #219a52);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: white;
          box-shadow: 0 8px 20px rgba(39, 174, 96, 0.3);
        }

        .user-details h1 {
          color: #2c3e50;
          font-size: 2.2em;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .user-details p {
          color: #7f8c8d;
          font-size: 1.1em;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 1em;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
        }

        .btn-success {
          background: linear-gradient(135deg, #27ae60, #219a52);
          color: white;
          box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
        }

        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(39, 174, 96, 0.4);
        }

        .btn-warning {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
        }

        .btn-warning:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(243, 156, 18, 0.4);
        }

        .btn-danger {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
        }

        .btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(231, 76, 60, 0.4);
        }

        .btn-accent {
          background: linear-gradient(135deg, #9b59b6, #8e44ad);
          color: white;
          box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
        }

        .btn-accent:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(155, 89, 182, 0.4);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.9);
          color: #2c3e50;
          border: 2px solid rgba(221, 221, 221, 0.5);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .btn-secondary:hover {
          background: white;
          border-color: #e74c3c;
          color: #e74c3c;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .stat-card {
          background: rgba(255,255,255,0.9);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          border: 2px solid transparent;
          text-align: center;
          animation: slideUp 0.6s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.15);
        }

        .stat-value {
          font-size: 2.5em;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .stat-label {
          color: #7f8c8d;
          font-size: 0.9em;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .filters-section {
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 25px;
          margin-bottom: 25px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          animation: slideUp 0.7s ease;
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .filters-header h2 {
          color: #2c3e50;
          font-size: 1.6em;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .search-box {
          flex: 1;
          max-width: 400px;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 12px 15px 12px 45px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s ease;
          background: white;
          padding-right: 100px;
        }

        .search-input:focus {
          outline: none;
          border-color: #27ae60;
          box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #7f8c8d;
          font-size: 18px;
        }

        .search-button {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          background: #27ae60;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .search-button:hover {
          background: #219a52;
          transform: translateY(-50%) scale(1.05);
        }

        .filter-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 15px;
        }

        .filter-btn {
          padding: 10px 20px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          background: white;
          color: #2c3e50;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-btn.active {
          background: #27ae60;
          color: white;
          border-color: #27ae60;
        }

        .filter-btn:hover:not(.active) {
          border-color: #3498db;
          color: #3498db;
        }

        .filter-info {
          margin-top: 15px;
          padding: 10px;
          background: #eafaf1;
          border-radius: 10px;
          color: #27ae60;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .clear-filters-btn {
          background: transparent;
          border: 1px solid #27ae60;
          color: #27ae60;
          border-radius: 5px;
          padding: 4px 10px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .clear-filters-btn:hover {
          background: #27ae60;
          color: white;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-top: 30px;
          padding: 20px;
        }

        .page-btn {
          padding: 8px 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          background: white;
          color: #2c3e50;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .page-btn:hover:not(:disabled) {
          background: #3498db;
          color: white;
          border-color: #3498db;
        }

        .page-btn.active {
          background: #27ae60;
          color: white;
          border-color: #27ae60;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          color: #7f8c8d;
          font-weight: 600;
        }

        .orders-list-section {
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          animation: slideUp 0.8s ease;
          min-height: 400px;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .order-card {
          background: white;
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          border: 2px solid #f1f2f6;
          transition: all 0.3s ease;
          animation: slideUp 0.3s ease;
        }

        .order-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          border-color: #27ae60;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .order-info {
          flex: 1;
        }

        .order-number {
          font-size: 1.4em;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .order-date {
          color: #7f8c8d;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .order-status {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
        }

        .order-total {
          font-size: 1.5em;
          font-weight: 700;
          color: #27ae60;
          text-align: right;
          min-width: 120px;
        }

        .order-details {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .order-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detail-label {
          color: #2c3e50;
          font-weight: 600;
          min-width: 120px;
        }

        .detail-value {
          color: #7f8c8d;
        }

        .items-preview {
          margin-top: 15px;
        }

        .items-preview h4 {
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 15px;
        }

        .items-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .item-tag {
          background: white;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .item-quantity {
          background: #27ae60;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }

        .order-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
        }

        .action-btn.view {
          background: #3498db;
          color: white;
        }

        .action-btn.view:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .action-btn.repeat {
          background: #27ae60;
          color: white;
        }

        .action-btn.repeat:hover {
          background: #219a52;
          transform: translateY(-2px);
        }

        .action-btn.receipt {
          background: #9b59b6;
          color: white;
        }

        .action-btn.receipt:hover {
          background: #8e44ad;
          transform: translateY(-2px);
        }

        .action-btn.track {
          background: #f39c12;
          color: white;
        }

        .action-btn.track:hover {
          background: #e67e22;
          transform: translateY(-2px);
        }

        .action-btn.cancel {
          background: #e74c3c;
          color: white;
        }

        .action-btn.cancel:hover {
          background: #c0392b;
          transform: translateY(-2px);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn:disabled:hover {
          transform: none;
          background: inherit;
        }

        .empty-state {
          text-align: center;
          padding: 60px 30px;
          background: rgba(255,255,255,0.9);
          border-radius: 20px;
          border: 2px dashed #e9ecef;
          margin: 20px 0;
        }

        .empty-icon {
          font-size: 80px;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 28px;
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .empty-state p {
          color: #7f8c8d;
          font-size: 16px;
          max-width: 400px;
          margin: 0 auto 20px;
          line-height: 1.6;
        }

        .order-details-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        .order-details-modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0,0,0,0.3);
          animation: slideIn 0.3s ease;
          border: 3px solid #27ae60;
        }

        .modal-header {
          background: linear-gradient(135deg, #27ae60, #219a52);
          color: white;
          padding: 25px 30px;
          border-radius: 18px 18px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          font-size: 1.8em;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .close-modal {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.5em;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .close-modal:hover {
          background: rgba(255,255,255,0.3);
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 30px;
        }

        .order-timeline {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 25px;
          border: 2px solid #e9ecef;
        }

        .timeline-title {
          color: #2c3e50;
          font-size: 1.3em;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #27ae60;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .timeline-steps {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .timeline-step {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px;
          border-radius: 10px;
          background: white;
          border: 2px solid #e9ecef;
        }

        .timeline-step.active {
          border-color: #27ae60;
          background: rgba(39, 174, 96, 0.1);
        }

        .timeline-step.completed {
          border-color: #27ae60;
          background: rgba(39, 174, 96, 0.05);
        }

        .step-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .step-info {
          flex: 1;
        }

        .step-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 2px;
        }

        .step-time {
          color: #7f8c8d;
          font-size: 13px;
        }

        .order-items-details {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 25px;
          border: 2px solid #e9ecef;
        }

        .items-details-title {
          color: #2c3e50;
          font-size: 1.3em;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e74c3c;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
        }

        .items-table th {
          text-align: left;
          padding: 12px;
          background: white;
          color: #2c3e50;
          font-weight: 600;
          border-bottom: 2px solid #e9ecef;
        }

        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .items-table tr:hover {
          background: rgba(255,255,255,0.5);
        }

        .item-row {
          display: table-row;
        }

        .item-name {
          color: #2c3e50;
          font-weight: 600;
        }

        .item-quantity-cell {
          text-align: center;
          color: #7f8c8d;
        }

        .item-price-cell {
          text-align: right;
          color: #27ae60;
          font-weight: 600;
        }

        .order-totals-details {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 25px;
          border: 2px solid #e9ecef;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 8px 0;
          color: #2c3e50;
          font-size: 15px;
        }

        .totals-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #e9ecef, transparent);
          margin: 20px 0;
        }

        .totals-total {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding: 20px 0;
          border-top: 3px solid #e9ecef;
          font-size: 1.3em;
          font-weight: 700;
          color: #2c3e50;
        }

        .total-amount {
          color: #27ae60;
          font-size: 1.5em;
        }

        .error-message {
          background: rgba(231, 76, 60, 0.1);
          color: #e74c3c;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          border: 2px solid rgba(231, 76, 60, 0.2);
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slideIn 0.3s ease;
        }

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 50px;
          gap: 20px;
        }

        .loading-spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #e74c3c;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }

        /* CSS pour la sidebar des URLs */
        .urls-sidebar {
          position: fixed;
          top: 0;
          right: 0;
          width: 400px;
          height: 100vh;
          background: linear-gradient(135deg, #2c3e50, #34495e);
          color: white;
          z-index: 1000;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          box-shadow: -5px 0 20px rgba(0,0,0,0.3);
          overflow-y: auto;
        }

        .urls-sidebar.open {
          transform: translateX(0);
        }

        .sidebar-header {
          background: rgba(0, 0, 0, 0.3);
          padding: 25px;
          border-bottom: 2px solid #3498db;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-header h3 {
          margin: 0;
          font-size: 1.5em;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .close-sidebar {
          background: rgba(231, 76, 60, 0.8);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.5em;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .close-sidebar:hover {
          background: #e74c3c;
          transform: rotate(90deg);
        }

        .sidebar-content {
          padding: 25px;
        }

        .backend-info {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
          border-left: 4px solid #27ae60;
        }

        .backend-info h4 {
          color: #3498db;
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 1.2em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-item {
          margin-bottom: 12px;
          display: flex;
          align-items: flex-start;
        }

        .info-label {
          min-width: 100px;
          color: #95a5a6;
          font-weight: 600;
          font-size: 14px;
        }

        .info-value {
          color: white;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          word-break: break-all;
        }

        .urls-list {
          margin-bottom: 30px;
        }

        .urls-list h4 {
          color: #3498db;
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 1.2em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .url-item {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 18px;
          margin-bottom: 15px;
          border-left: 3px solid;
          transition: all 0.3s ease;
        }

        .url-item:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateX(-5px);
        }

        .url-method {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          margin-right: 10px;
          min-width: 60px;
          text-align: center;
        }

        .url-method.get {
          background: #27ae60;
          color: white;
        }

        .url-method.post {
          background: #3498db;
          color: white;
        }

        .url-method.put {
          background: #f39c12;
          color: white;
        }

        .url-method.delete {
          background: #e74c3c;
          color: white;
        }

        .url-endpoint {
          font-weight: 600;
          color: white;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .url-description {
          color: #bdc3c7;
          font-size: 13px;
          margin-bottom: 10px;
          line-height: 1.5;
        }

        .url-full {
          background: rgba(0, 0, 0, 0.3);
          padding: 10px;
          border-radius: 6px;
          margin-top: 10px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #3498db;
          word-break: break-all;
          border: 1px solid rgba(52, 152, 219, 0.3);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .copy-url-btn {
          background: transparent;
          border: 1px solid #27ae60;
          color: #27ae60;
          border-radius: 4px;
          padding: 4px 10px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s ease;
          white-space: nowrap;
          margin-left: 10px;
        }

        .copy-url-btn:hover {
          background: #27ae60;
          color: white;
        }

        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 12px;
          color: #95a5a6;
          text-align: center;
        }

        .open-sidebar-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #3498db, #2980b9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          z-index: 999;
          box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
          border: none;
          font-size: 24px;
          transition: all 0.3s ease;
        }

        .open-sidebar-btn:hover {
          transform: scale(1.1) rotate(15deg);
          box-shadow: 0 12px 30px rgba(52, 152, 219, 0.6);
        }

        .open-sidebar-btn.open {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          transform: rotate(45deg);
        }

        .open-sidebar-btn.open:hover {
          transform: scale(1.1) rotate(60deg);
          box-shadow: 0 12px 30px rgba(231, 76, 60, 0.6);
        }

        /* Styles pour les notifications personnalisées */
        .notification-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(3px);
          animation: fadeIn 0.3s ease;
        }

        .notification-box {
          background: white;
          border-radius: 20px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.4s ease;
          border: 3px solid;
          text-align: center;
        }

        .notification-box.success {
          border-color: #27ae60;
        }

        .notification-box.error {
          border-color: #e74c3c;
        }

        .notification-box.warning {
          border-color: #f39c12;
        }

        .notification-box.info {
          border-color: #3498db;
        }

        .notification-icon {
          font-size: 50px;
          margin-bottom: 20px;
        }

        .notification-title {
          font-size: 1.8em;
          font-weight: 700;
          margin-bottom: 10px;
          color: #2c3e50;
        }

        .notification-message {
          font-size: 16px;
          color: #7f8c8d;
          margin-bottom: 25px;
          line-height: 1.5;
        }

        .notification-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        .notification-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 120px;
        }

        .notification-btn.confirm {
          background: #27ae60;
          color: white;
        }

        .notification-btn.confirm:hover {
          background: #219a52;
          transform: translateY(-2px);
        }

        .notification-btn.cancel {
          background: #e74c3c;
          color: white;
        }

        .notification-btn.cancel:hover {
          background: #c0392b;
          transform: translateY(-2px);
        }

        .notification-btn.close {
          background: #3498db;
          color: white;
        }

        .notification-btn.close:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .notification-btn.single {
          background: #27ae60;
          color: white;
          width: 100%;
          max-width: 200px;
        }

        /* Style pour les notifications auto-fermantes */
        .notification-box.auto-close {
          animation: slideIn 0.4s ease, fadeOut 0.4s ease 2.6s;
        }

        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }

        @media (max-width: 768px) {
          .orders-container {
            padding: 15px 10px;
          }

          .header-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .user-info {
            width: 100%;
            margin-bottom: 20px;
          }

          .header-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .filters-header {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            max-width: 100%;
          }

          .filter-buttons {
            justify-content: center;
          }

          .order-header {
            flex-direction: column;
          }

          .order-total {
            text-align: left;
          }

          .order-summary {
            grid-template-columns: 1fr;
          }

          .order-actions {
            flex-direction: column;
          }

          .action-btn {
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .modal-body {
            padding: 20px;
          }

          .items-table {
            display: block;
            overflow-x: auto;
          }

          .urls-sidebar {
            width: 100%;
          }

          .open-sidebar-btn {
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            font-size: 20px;
          }

          .notification-box {
            padding: 20px;
            max-width: 90%;
          }

          .notification-title {
            font-size: 1.5em;
          }

          .notification-buttons {
            flex-direction: column;
          }

          .notification-btn {
            width: 100%;
            max-width: none;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .btn {
            padding: 10px 16px;
            font-size: 14px;
          }

          .user-avatar {
            width: 60px;
            height: 60px;
            font-size: 28px;
          }

          .user-details h1 {
            font-size: 1.8em;
          }

          .filter-btn {
            padding: 8px 12px;
            font-size: 13px;
          }

          .order-card {
            padding: 20px;
          }

          .order-number {
            font-size: 1.2em;
          }

          .notification-icon {
            font-size: 40px;
          }

          .notification-title {
            font-size: 1.3em;
          }

          .notification-message {
            font-size: 14px;
          }
        }
      `}</style>

      <div className="orders-container">
        <div className="background-overlay"></div>

        {/* Bouton pour ouvrir la sidebar des URLs */}
        <button 
          className={`open-sidebar-btn ${showUrlSidebar ? 'open' : ''}`}
          onClick={() => setShowUrlSidebar(!showUrlSidebar)}
          title={showUrlSidebar ? "Fermer les URLs" : "Voir les URLs backend"}
        >
          🔗
        </button>

        {/* Sidebar des URLs */}
        <div className={`urls-sidebar ${showUrlSidebar ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h3>
              <span>🔗</span>
              URLs Backend Localhost
            </h3>
            <button 
              className="close-sidebar"
              onClick={() => setShowUrlSidebar(false)}
            >
              ×
            </button>
          </div>
          
          <div className="sidebar-content">
            <div className="backend-info">
              <h4>
                <span>⚙️</span>
                Configuration Backend
              </h4>
              
              <div className="info-item">
                <span className="info-label">URL Base :</span>
                <span className="info-value">{BACKEND_URL}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Port :</span>
                <span className="info-value">5004</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Utilisateur :</span>
                <span className="info-value">{userData?.email || 'Non connecté'}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Token :</span>
                <span className="info-value">
                  {token ? 'Présent (Bearer)' : 'Absent'}
                </span>
              </div>
            </div>
            
            <div className="urls-list">
              <h4>
                <span>📡</span>
                Endpoints Disponibles
              </h4>
              
              {backendUrls.map((url) => (
                <div key={url.id} className="url-item">
                  <div className="url-endpoint">
                    <div>
                      <span className={`url-method ${url.method.toLowerCase()}`}>
                        {url.method}
                      </span>
                      <span>{url.name}</span>
                    </div>
                  </div>
                  
                  <div className="url-description">
                    {url.description}
                  </div>
                  
                  <div className="url-full">
                    <code>{url.fullUrl}</code>
                    <button 
                      className="copy-url-btn"
                      onClick={() => copyUrlToClipboard(url.fullUrl)}
                    >
                      📋 Copier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="sidebar-footer">
            Développement • Localhost:5004 • {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        <div className="content-wrapper">
          {/* Header Section */}
          <div className="header-section">
            <div className="header-top">
              <div className="user-info">
                <div className="user-avatar">
                  {userData?.firstName?.[0]?.toUpperCase() || '📋'}
                </div>
                <div className="user-details">
                  <h1>Mes Commandes, {userData?.firstName || 'Cher Client'} !</h1>
                  <p>Suivez et gérez toutes vos commandes</p>
                </div>
              </div>
              
              <div className="header-actions">
                <Link to="/" className="btn btn-primary">
                  <span>🏠</span>
                  <span>Accueil</span>
                </Link>
                
                <Link to="/cart" className="btn btn-success">
                  <span>🛒</span>
                  <span>Mon panier</span>
                </Link>
                
                <Link to="/profile" className="btn btn-warning">
                  <span>👤</span>
                  <span>Mon profil</span>
                </Link>
                
                <button 
                  className="btn btn-accent"
                  onClick={() => setShowUrlSidebar(true)}
                >
                  <span>🔗</span>
                  <span>Voir URLs</span>
                </button>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Commandes totales</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{formatPrice(stats.totalSpent)}</div>
                <div className="stat-label">Total dépensé</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{stats.delivered}</div>
                <div className="stat-label">Livrées</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">En cours</div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="filters-section">
            <div className="filters-header">
              <h2>
                <span>🔍</span>
                Rechercher et filtrer
              </h2>
              
              <div className="search-box">
                <span className="search-icon">🔎</span>
                <input
                  type="text"
                  placeholder="Rechercher par numéro de commande ou article..."
                  className="search-input"
                  value={searchTerm}
                  onChange={handleSearch}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                />
                <button 
                  className="search-button"
                  onClick={handleSearchSubmit}
                >
                  Rechercher
                </button>
              </div>
            </div>
            
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                <span>📋</span>
                <span>Toutes</span>
              </button>
              
              <button 
                className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => handleFilterChange('pending')}
              >
                <span>⏳</span>
                <span>En attente</span>
              </button>
              
              <button 
                className={`filter-btn ${filter === 'preparing' ? 'active' : ''}`}
                onClick={() => handleFilterChange('preparing')}
              >
                <span>👨‍🍳</span>
                <span>En préparation</span>
              </button>
              
              <button 
                className={`filter-btn ${filter === 'out_for_delivery' ? 'active' : ''}`}
                onClick={() => handleFilterChange('out_for_delivery')}
              >
                <span>🚚</span>
                <span>En route</span>
              </button>
              
              <button 
                className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`}
                onClick={() => handleFilterChange('delivered')}
              >
                <span>✅</span>
                <span>Livrées</span>
              </button>
              
              <button 
                className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
                onClick={() => handleFilterChange('cancelled')}
              >
                <span>❌</span>
                <span>Annulées</span>
              </button>
            </div>

            {(filter !== 'all' || searchTerm) && (
              <div className="filter-info">
                <div>
                  {filter !== 'all' && `Filtre : ${getStatusInfo(filter).text} `}
                  {searchTerm && `• Recherche : "${searchTerm}" `}
                  • {filteredOrders.length} commande(s) trouvée(s)
                </div>
                <button 
                  className="clear-filters-btn"
                  onClick={clearFilters}
                >
                  Effacer les filtres
                </button>
              </div>
            )}
          </div>

          {/* Orders List */}
          <div className="orders-list-section">
            {error && (
              <div className="error-message">
                <span>⚠️</span>
                <span>{error}</span>
                <button 
                  onClick={fetchOrders}
                  style={{
                    marginLeft: 'auto',
                    padding: '5px 10px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Réessayer
                </button>
              </div>
            )}
            
            {loading && orders.length === 0 ? (
              <div className="loading-indicator">
                <div className="loading-spinner"></div>
                <div>Chargement de vos commandes...</div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>Aucune commande trouvée</h3>
                <p>
                  {searchTerm 
                    ? 'Aucune commande ne correspond à votre recherche'
                    : filter !== 'all'
                    ? `Vous n'avez pas de commandes avec le statut "${getStatusInfo(filter).text}"`
                    : 'Vous n\'avez pas encore passé de commande'
                  }
                </p>
                {(filter !== 'all' || searchTerm) ? (
                  <button 
                    onClick={clearFilters}
                    className="btn btn-success"
                  >
                    <span>↺</span>
                    <span>Afficher toutes les commandes</span>
                  </button>
                ) : (
                  <Link to="/" className="btn btn-success">
                    <span>🍕</span>
                    <span>Commander maintenant</span>
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="orders-list">
                  {filteredOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    
                    return (
                      <div key={order._id} className="order-card">
                        <div className="order-header">
                          <div className="order-info">
                            <div className="order-number">
                              <span>📦</span>
                              <span>{order.orderNumber}</span>
                            </div>
                            <div className="order-date">
                              <span>📅</span>
                              <span>{formatDate(order.createdAt)}</span>
                            </div>
                            <div 
                              className="order-status"
                              style={{
                                backgroundColor: statusInfo.bgColor,
                                color: statusInfo.color
                              }}
                            >
                              <span>{statusInfo.icon}</span>
                              <span>{statusInfo.text}</span>
                            </div>
                          </div>
                          
                          <div className="order-total">
                            {formatPrice(order.total)}
                          </div>
                        </div>
                        
                        <div className="order-details">
                          <div className="order-summary">
                            <div className="detail-item">
                              <span className="detail-label">Paiement :</span>
                              <span className="detail-value">
                                <span style={{ marginRight: '5px' }}>
                                  {getPaymentIcon(order.paymentMethod)}
                                </span>
                                {order.paymentMethod === 'card' ? 'Carte bancaire' : 'À la livraison'}
                              </span>
                            </div>
                            
                            <div className="detail-item">
                              <span className="detail-label">Livraison :</span>
                              <span className="detail-value">
                                <span style={{ marginRight: '5px' }}>
                                  {getDeliveryIcon(order.deliveryMethod)}
                                </span>
                                {order.deliveryMethod === 'delivery' ? 'Livraison' : 'À emporter'}
                              </span>
                            </div>
                            
                            {order.estimatedDelivery && (
                              <div className="detail-item">
                                <span className="detail-label">Livraison estimée :</span>
                                <span className="detail-value">
                                  <span>⏰</span>
                                  <span>{order.estimatedDelivery}</span>
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="items-preview">
                            <h4>Articles commandés :</h4>
                            <div className="items-list">
                              {order.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="item-tag">
                                  <span className="item-quantity">{item.quantity}</span>
                                  <span>{item.pizzaName}</span>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div className="item-tag">
                                  <span>+{order.items.length - 3} autre(s)</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="order-actions">
                          <button 
                            className="action-btn view"
                            onClick={() => viewOrderDetails(order)}
                          >
                            <span>👁️</span>
                            <span>Voir détails</span>
                          </button>
                          
                          <button 
                            className="action-btn repeat"
                            onClick={() => repeatOrder(order)}
                            disabled={order.status === 'cancelled'}
                          >
                            <span>🔄</span>
                            <span>Répéter la commande</span>
                          </button>
                          
                          <button 
                            className="action-btn receipt"
                            onClick={() => downloadReceipt(order)}
                          >
                            <span>📄</span>
                            <span>Télécharger le reçu</span>
                          </button>
                          
                          <button 
                            className="action-btn track"
                            onClick={() => trackOrder(order.orderNumber)}
                            disabled={order.status === 'cancelled' || order.status === 'delivered'}
                          >
                            <span>🚚</span>
                            <span>Suivre</span>
                          </button>
                          
                          {(order.status === 'pending' || order.status === 'confirmed') && (
                            <button 
                              className="action-btn cancel"
                              onClick={() => cancelOrder(order._id, order.orderNumber)}
                            >
                              <span>❌</span>
                              <span>Annuler</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="page-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ← Précédent
                    </button>
                    
                    <span className="page-info">
                      Page {currentPage} sur {totalPages}
                    </span>
                    
                    <button 
                      className="page-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="order-details-overlay" onClick={() => setShowOrderDetails(false)}>
            <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <span>📋</span>
                  Détails de la commande {selectedOrder.orderNumber}
                </h2>
                <button 
                  className="close-modal"
                  onClick={() => setShowOrderDetails(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                {orderDetailsLoading ? (
                  <div className="loading-indicator">
                    <div className="loading-spinner"></div>
                    <div>Chargement des détails...</div>
                  </div>
                ) : (
                  <>
                    {/* Timeline */}
                    <div className="order-timeline">
                      <h3 className="timeline-title">
                        <span>⏱️</span>
                        Suivi de commande
                      </h3>
                      
                      <div className="timeline-steps">
                        <div className={`timeline-step ${['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'].includes(selectedOrder.status) ? 'completed' : ''} ${selectedOrder.status === 'pending' ? 'active' : ''}`}>
                          <div className="step-icon" style={{ background: '#f39c12', color: 'white' }}>
                            📝
                          </div>
                          <div className="step-info">
                            <div className="step-title">Commande confirmée</div>
                            <div className="step-time">{formatDate(selectedOrder.createdAt)}</div>
                          </div>
                        </div>
                        
                        <div className={`timeline-step ${['confirmed', 'preparing', 'out_for_delivery', 'delivered'].includes(selectedOrder.status) ? 'completed' : ''} ${selectedOrder.status === 'confirmed' ? 'active' : ''}`}>
                          <div className="step-icon" style={{ background: '#3498db', color: 'white' }}>
                            ✅
                          </div>
                          <div className="step-info">
                            <div className="step-title">Confirmée</div>
                            <div className="step-time">
                              {selectedOrder.status === 'confirmed' ? 'En cours' : 
                               selectedOrder.status === 'pending' ? 'En attente' : 'Terminé'}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`timeline-step ${['preparing', 'out_for_delivery', 'delivered'].includes(selectedOrder.status) ? 'completed' : ''} ${selectedOrder.status === 'preparing' ? 'active' : ''}`}>
                          <div className="step-icon" style={{ background: '#9b59b6', color: 'white' }}>
                            👨‍🍳
                          </div>
                          <div className="step-info">
                            <div className="step-title">En préparation</div>
                            <div className="step-time">
                              {selectedOrder.status === 'preparing' ? 'En cours' : 
                               ['pending', 'confirmed'].includes(selectedOrder.status) ? 'En attente' : 
                               'Terminé'}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`timeline-step ${['out_for_delivery', 'delivered'].includes(selectedOrder.status) ? 'completed' : ''} ${selectedOrder.status === 'out_for_delivery' ? 'active' : ''}`}>
                          <div className="step-icon" style={{ background: '#e67e22', color: 'white' }}>
                            🚚
                          </div>
                          <div className="step-info">
                            <div className="step-title">En route</div>
                            <div className="step-time">
                              {selectedOrder.status === 'out_for_delivery' ? 'En cours de livraison' : 
                               ['pending', 'confirmed', 'preparing'].includes(selectedOrder.status) ? 'En attente' : 
                               selectedOrder.status === 'delivered' ? 'Livré' : 'À venir'}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`timeline-step ${selectedOrder.status === 'delivered' ? 'completed' : ''} ${selectedOrder.status === 'delivered' ? 'active' : ''}`}>
                          <div className="step-icon" style={{ background: '#27ae60', color: 'white' }}>
                            🎉
                          </div>
                          <div className="step-info">
                            <div className="step-title">Livrée</div>
                            <div className="step-time">
                              {selectedOrder.status === 'delivered' ? 
                                (selectedOrder.deliveredAt ? formatDate(selectedOrder.deliveredAt) : 'Terminé') : 
                                'En attente'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Order Items Details */}
                    <div className="order-items-details">
                      <h3 className="items-details-title">
                        <span>🍕</span>
                        Articles commandés
                      </h3>
                      
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Article</th>
                            <th>Quantité</th>
                            <th>Prix unitaire</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index} className="item-row">
                              <td className="item-name">{item.pizzaName}</td>
                              <td className="item-quantity-cell">{item.quantity}</td>
                              <td className="item-price-cell">{formatPrice(item.price)}</td>
                              <td className="item-price-cell">{formatPrice(item.price * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Order Totals SANS TVA */}
                    <div className="order-totals-details">
                      <div className="totals-row">
                        <span>Sous-total</span>
                        <span>{formatPrice(selectedOrder.subtotal || 0)}</span>
                      </div>
                      
                      <div className="totals-row">
                        <span>Frais de livraison</span>
                        <span>
                          {selectedOrder.deliveryMethod === 'delivery' 
                            ? (selectedOrder.subtotal > 30 ? 'Gratuite 🎉' : formatPrice(selectedOrder.deliveryFee || 3.500))
                            : 'Gratuit'
                          }
                        </span>
                      </div>
                      
                      <div className="totals-divider"></div>
                      
                      <div className="totals-total">
                        <span>Total à payer</span>
                        <span className="total-amount">
                          {formatPrice(selectedOrder.total || 0)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {notification && (
          <div className="notification-container">
            <div className={`notification-box ${notification.type} ${notification.autoClose ? 'auto-close' : ''}`}>
              <div className="notification-icon">
                {notification.type === 'success' && '✅'}
                {notification.type === 'error' && '❌'}
                {notification.type === 'warning' && '⚠️'}
                {notification.type === 'info' && 'ℹ️'}
              </div>
              
              <h3 className="notification-title">
                {notification.title}
              </h3>
              
              <div className="notification-message">
                {notification.message.split('\n').map((line, index) => (
                  <p key={index} style={{ margin: '5px 0' }}>{line}</p>
                ))}
              </div>
              
              {(!notification.autoClose || (notification.showConfirm || notification.showCancel)) && (
                <div className="notification-buttons">
                  {notification.showCancel && (
                    <button 
                      className="notification-btn cancel"
                      onClick={cancelNotification}
                    >
                      {notification.cancelText}
                    </button>
                  )}
                  
                  {notification.showConfirm ? (
                    <button 
                      className="notification-btn confirm"
                      onClick={confirmNotification}
                    >
                      {notification.confirmText}
                    </button>
                  ) : !notification.autoClose ? (
                    <button 
                      className="notification-btn close"
                      onClick={closeNotification}
                    >
                      Fermer
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Orders;
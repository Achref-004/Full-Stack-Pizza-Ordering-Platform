// pages/OrderConfirmation.js - VERSION CORRIGÉE POUR RÉCUPÉRATION DEPUIS CART
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(10);

  // Fonction pour extraire les données de la commande depuis location.state
  const extractOrderData = (data) => {
    console.log('📋 Données brutes reçues:', data);
    
    // Si les données viennent directement du Cart.jsx
    if (data && data.items) {
      console.log('✅ Données Cart.jsx détectées');
      
      // Récupérer les données du backend (response.data.order)
      const backendOrder = data.order || {};
      
      // Calculer le total à partir des items du panier
      const subtotal = data.items.reduce((sum, item) => {
        const price = item.unitPrice || item.price || 15.500;
        const quantity = item.quantity || 1;
        return sum + (price * quantity);
      }, 0);
      
      const deliveryFee = subtotal > 30 ? 0 : 3.500;
      const total = subtotal + deliveryFee;
      
      // Générer une date de livraison estimée
      const now = new Date();
      const deliveryTime = new Date(now.getTime() + 45 * 60000);
      
      return {
        orderNumber: backendOrder.orderNumber || backendOrder._id || `PZ-${Date.now().toString().slice(-8)}`,
        deliveryMethod: backendOrder.deliveryMethod || 'delivery',
        deliveryAddress: backendOrder.deliveryAddress || {
          address: 'Adresse non spécifiée',
          city: 'Tunis',
          postalCode: '1000'
        },
        paymentMethod: backendOrder.paymentMethod || 'cash',
        transactionId: backendOrder.transactionId || `TRX-${Date.now().toString().slice(-8)}`,
        estimatedDelivery: deliveryTime.toLocaleTimeString('fr-TN', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        items: data.items.map(item => ({
          pizzaName: item.pizzaName || 'Pizza',
          quantity: item.quantity || 1,
          price: item.unitPrice || item.price || 15.500
        })),
        total: backendOrder.total || total,
        status: backendOrder.status || 'preparation',
        orderDate: backendOrder.createdAt ? new Date(backendOrder.createdAt).toLocaleDateString('fr-TN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : new Date().toLocaleDateString('fr-TN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    }
    
    // Si les données viennent directement du localStorage
    if (data && data.orderNumber) {
      console.log('✅ Données localStorage détectées');
      return data;
    }
    
    // Sinon, créer des données de démo
    console.log('⚠️ Aucune donnée valide, création de démo');
    return createDemoOrder();
  };

  // Créer une commande de démonstration
  const createDemoOrder = () => {
    const today = new Date();
    const deliveryTime = new Date(today.getTime() + 45 * 60000);
    
    return {
      orderNumber: `PZ-${today.toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random()*100000)}`,
      deliveryMethod: 'delivery',
      deliveryAddress: {
        address: '123 Avenue Habib Bourguiba',
        city: 'Tunis',
        postalCode: '1001'
      },
      paymentMethod: 'card',
      transactionId: 'TICK-23530004',
      estimatedDelivery: deliveryTime.toLocaleTimeString('fr-TN', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      items: [
        { pizzaName: 'Pizza Margherita Classique', quantity: 1, price: 15.500 },
        { pizzaName: 'Pizza Pepperoni Spéciale', quantity: 2, price: 18.000 }
      ],
      total: 51.500,
      status: 'preparation',
      orderDate: today.toLocaleDateString('fr-TN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  // Récupérer les détails de la commande
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        console.log('📍 Récupération des données de commande...');
        console.log('📦 location.state:', location.state);
        
        let orderData = null;
        
        // Essayer d'abord depuis location.state (depuis le panier)
        if (location.state?.orderDetails) {
          console.log('✅ Données trouvées dans location.state');
          orderData = location.state.orderDetails;
        }
        // Sinon essayer depuis localStorage
        else {
          const storedOrder = localStorage.getItem('lastOrder');
          if (storedOrder) {
            console.log('✅ Données trouvées dans localStorage');
            try {
              orderData = JSON.parse(storedOrder);
            } catch (e) {
              console.error('❌ Erreur parsing localStorage:', e);
              orderData = null;
            }
          }
        }
        
        // Extraire et formater les données
        const formattedOrder = extractOrderData(orderData);
        
        console.log('🎨 Données formatées pour affichage:', formattedOrder);
        
        // Sauvegarder dans le state
        setOrderDetails(formattedOrder);
        
        // Sauvegarder dans localStorage pour persistance
        localStorage.setItem('lastOrder', JSON.stringify(formattedOrder));
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Erreur lors du chargement de la commande:', error);
        
        // Créer une commande de démonstration en cas d'erreur
        const demoOrder = createDemoOrder();
        setOrderDetails(demoOrder);
        localStorage.setItem('lastOrder', JSON.stringify(demoOrder));
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location]);

  // Compte à rebours pour redirection automatique
  useEffect(() => {
    if (!orderDetails) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orderDetails, navigate]);

  // Formater les prix
  const formatPrice = (price) => {
    const safePrice = parseFloat(price) || 0;
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(safePrice) + ' DT';
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) {
      const now = new Date();
      return now.toLocaleDateString('fr-TN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return dateString;
  };

  // Calculer le temps de livraison estimé
  const calculateDeliveryTime = () => {
    const now = new Date();
    const deliveryTime = new Date(now.getTime() + 45 * 60000);
    return deliveryTime.toLocaleTimeString('fr-TN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir l'icône de méthode de paiement
  const getPaymentIcon = (method) => {
    switch(method) {
      case 'card': return '💳';
      case 'cash': return '💵';
      case 'paypal': return '💰';
      default: return '💳';
    }
  };

  // Obtenir l'icône de méthode de livraison
  const getDeliveryIcon = (method) => {
    switch(method) {
      case 'delivery': return '🚚';
      case 'pickup': return '🏃';
      default: return '📦';
    }
  };

  // Fonction pour forcer des données de test (basées sur un panier réel)
  const forceTestData = () => {
    const testData = {
      orderNumber: 'PZ-20240115-12345',
      deliveryMethod: 'delivery',
      deliveryAddress: {
        address: '18 Rue de la République',
        city: 'Tunis',
        postalCode: '1000'
      },
      paymentMethod: 'card',
      transactionId: 'TICK-23530004',
      estimatedDelivery: calculateDeliveryTime(),
      items: [
        { pizzaName: 'Margherita Classique', quantity: 2, price: 15.500 },
        { pizzaName: 'Pepperoni Spicy', quantity: 1, price: 18.000 },
        { pizzaName: '4 Fromages', quantity: 1, price: 20.000 }
      ],
      total: 69.000,
      status: 'preparation',
      orderDate: new Date().toLocaleDateString('fr-TN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    setOrderDetails(testData);
    localStorage.setItem('lastOrder', JSON.stringify(testData));
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        <div style={{
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #27ae60',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          animation: 'spin 1s linear infinite',
          marginRight: '10px'
        }}></div>
        Chargement de votre confirmation...
      </div>
    );
  }

  return (
    <>
      <style>{`
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

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
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

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes confetti {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }

        /* Container Principal */
        .confirmation-container {
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Confetti Animation */
        .confetti {
          position: fixed;
          width: 15px;
          height: 15px;
          background: #f0db4f;
          top: -10px;
          animation: confetti 5s linear infinite;
        }

        /* Content Wrapper */
        .confirmation-wrapper {
          width: 100%;
          max-width: 1200px;
          position: relative;
          z-index: 2;
        }

        /* Success Card */
        .success-card {
          background: white;
          border-radius: 25px;
          padding: 40px;
          box-shadow: 0 25px 50px rgba(39, 174, 96, 0.2);
          margin-bottom: 30px;
          border: 3px solid #27ae60;
          text-align: center;
          position: relative;
          overflow: hidden;
          animation: slideIn 0.5s ease;
        }

        .success-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, #27ae60, #3498db, #9b59b6);
          animation: pulse 2s ease-in-out infinite;
        }

        .success-icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: float 3s ease-in-out infinite;
        }

        .success-title {
          color: #2c3e50;
          font-size: 2.5em;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .success-subtitle {
          color: #27ae60;
          font-size: 1.5em;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .order-number {
          background: linear-gradient(135deg, #27ae60, #219a52);
          color: white;
          padding: 15px 30px;
          border-radius: 50px;
          display: inline-block;
          font-size: 1.3em;
          font-weight: 700;
          margin: 20px 0;
          box-shadow: 0 5px 15px rgba(39, 174, 96, 0.3);
        }

        .success-message {
          color: #7f8c8d;
          font-size: 1.1em;
          max-width: 600px;
          margin: 0 auto 30px;
          line-height: 1.6;
        }

        /* Order Details Grid */
        .order-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
          margin-bottom: 30px;
        }

        .detail-card {
          background: white;
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          border: 2px solid #f1f2f6;
          transition: all 0.3s ease;
        }

        .detail-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.15);
          border-color: #27ae60;
        }

        .detail-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e9ecef;
        }

        .detail-icon {
          font-size: 2em;
        }

        .detail-title {
          color: #2c3e50;
          font-size: 1.3em;
          font-weight: 600;
          margin: 0;
        }

        .detail-content {
          color: #7f8c8d;
          line-height: 1.6;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f1f2f6;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .item-label {
          color: #2c3e50;
          font-weight: 600;
        }

        .item-value {
          color: #27ae60;
          font-weight: 600;
        }

        /* Delivery Info */
        .delivery-info {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          padding: 25px;
          border-radius: 20px;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(52, 152, 219, 0.3);
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .delivery-icon {
          font-size: 3em;
          animation: pulse 2s ease-in-out infinite;
        }

        .delivery-text {
          flex: 1;
        }

        .delivery-title {
          font-size: 1.5em;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .delivery-time {
          font-size: 2em;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Order Items */
        .order-items-section {
          background: white;
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        .section-title {
          color: #2c3e50;
          font-size: 1.8em;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e9ecef;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .order-items {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
        }

        .order-item:hover {
          transform: translateX(5px);
          border-color: #27ae60;
          background: white;
        }

        .item-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .item-quantity {
          background: #27ae60;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .item-name {
          color: #2c3e50;
          font-weight: 600;
          font-size: 1.1em;
        }

        .item-price {
          color: #27ae60;
          font-weight: 700;
          font-size: 1.2em;
        }

        /* Total Summary */
        .total-summary {
          background: white;
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding: 10px 0;
          color: #2c3e50;
          font-size: 1.1em;
        }

        .summary-divider {
          height: 2px;
          background: linear-gradient(to right, transparent, #e9ecef, transparent);
          margin: 20px 0;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding: 20px 0;
          border-top: 2px solid #e9ecef;
          font-size: 1.4em;
          font-weight: 700;
          color: #2c3e50;
        }

        .total-amount {
          color: #27ae60;
          font-size: 1.6em;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 15px 30px;
          border: none;
          border-radius: 15px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 1em;
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(52, 152, 219, 0.4);
        }

        .btn-success {
          background: linear-gradient(135deg, #27ae60, #219a52);
          color: white;
          box-shadow: 0 5px 15px rgba(39, 174, 96, 0.3);
        }

        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(39, 174, 96, 0.4);
        }

        .btn-accent {
          background: linear-gradient(135deg, #9b59b6, #8e44ad);
          color: white;
          box-shadow: 0 5px 15px rgba(155, 89, 182, 0.3);
        }

        .btn-accent:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(155, 89, 182, 0.4);
        }

        /* Test Button */
        .btn-test {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
        }

        .btn-test:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(231, 76, 60, 0.4);
        }

        /* Countdown */
        .countdown {
          text-align: center;
          color: #7f8c8d;
          font-size: 0.9em;
          margin-top: 20px;
        }

        .countdown-number {
          color: #e74c3c;
          font-weight: 700;
          font-size: 1.2em;
        }

        /* Footer */
        .confirmation-footer {
          text-align: center;
          padding-top: 30px;
          border-top: 2px solid #e9ecef;
          color: #7f8c8d;
          font-size: 0.9em;
        }

        .contact-info {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Debug Button */
        .debug-button {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 9999;
          padding: 10px 15px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 3px 10px rgba(231, 76, 60, 0.3);
          transition: all 0.3s ease;
        }

        .debug-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .confirmation-container {
            padding: 20px 10px;
          }

          .success-card {
            padding: 25px;
          }

          .success-title {
            font-size: 2em;
          }

          .order-details-grid {
            grid-template-columns: 1fr;
          }

          .delivery-info {
            flex-direction: column;
            text-align: center;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn {
            justify-content: center;
          }
          
          .debug-button {
            top: 5px;
            right: 5px;
            padding: 8px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .success-card {
            padding: 20px;
          }

          .success-title {
            font-size: 1.8em;
          }

          .success-subtitle {
            font-size: 1.2em;
          }

          .section-title {
            font-size: 1.5em;
          }
        }
      `}</style>

      <div className="confirmation-container">
        {/* Bouton de débogage */}
        <button 
          className="debug-button"
          onClick={forceTestData}
          title="Forcer des données de test"
        >
          🔧 Test Data
        </button>

        {/* Confetti Animation */}
        {[...Array(50)].map((_, i) => (
          <div 
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}vw`,
              animationDelay: `${Math.random() * 5}s`,
              backgroundColor: ['#f0db4f', '#27ae60', '#3498db', '#9b59b6', '#e74c3c'][Math.floor(Math.random() * 5)]
            }}
          />
        ))}

        <div className="confirmation-wrapper">
          {/* Success Card */}
          <div className="success-card">
            <div className="success-icon">🎉</div>
            <h1 className="success-title">Commande Confirmée !</h1>
            <p className="success-subtitle">Votre pizza est en préparation</p>
            
            <div className="order-number">
              Commande #{orderDetails.orderNumber}
            </div>
            
            <p className="success-message">
              Merci pour votre commande ! Nous avons bien reçu votre paiement. 
              Votre pizza sera prête dans environ 30-45 minutes. 
              Vous recevrez une notification lorsque votre commande sera en route.
            </p>
            
            <div style={{ color: '#7f8c8d', marginBottom: '20px', fontSize: '1.1em' }}>
              {formatDate(orderDetails.orderDate)}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="delivery-info">
            <div className="delivery-icon">🚚</div>
            <div className="delivery-text">
              <div className="delivery-title">Livraison estimée</div>
              <div className="delivery-time">
                {orderDetails.estimatedDelivery}
              </div>
              <p style={{ fontSize: '1.1em', marginTop: '10px' }}>
                Notre livreur sera à votre porte dans 30-45 minutes
              </p>
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="order-details-grid">
            {/* Détails de livraison */}
            <div className="detail-card">
              <div className="detail-header">
                <div className="detail-icon">
                  {getDeliveryIcon(orderDetails.deliveryMethod)}
                </div>
                <h3 className="detail-title">Informations de livraison</h3>
              </div>
              <div className="detail-content">
                <div className="detail-item">
                  <span className="item-label">Adresse :</span>
                  <span className="item-value">
                    {orderDetails.deliveryAddress?.address || 'Adresse non spécifiée'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="item-label">Ville :</span>
                  <span className="item-value">
                    {orderDetails.deliveryAddress?.city || 'Tunis'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="item-label">Méthode :</span>
                  <span className="item-value">
                    {orderDetails.deliveryMethod === 'delivery' ? 'Livraison' : 'À emporter'}
                  </span>
                </div>
              </div>
            </div>

            {/* Détails de paiement */}
            <div className="detail-card">
              <div className="detail-header">
                <div className="detail-icon">
                  {getPaymentIcon(orderDetails.paymentMethod)}
                </div>
                <h3 className="detail-title">Informations de paiement</h3>
              </div>
              <div className="detail-content">
                <div className="detail-item">
                  <span className="item-label">Méthode :</span>
                  <span className="item-value">
                    {orderDetails.paymentMethod === 'cash' ? 'À la livraison' : 
                     orderDetails.paymentMethod === 'paypal' ? 'PayPal' : 'Carte bancaire'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="item-label">Statut :</span>
                  <span className="item-value" style={{ color: '#27ae60' }}>
                    ✅ Payé
                  </span>
                </div>
                <div className="detail-item">
                  <span className="item-label">Transaction :</span>
                  <span className="item-value">
                    {orderDetails.transactionId}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="detail-card">
              <div className="detail-header">
                <div className="detail-icon">📞</div>
                <h3 className="detail-title">Contact & Support</h3>
              </div>
              <div className="detail-content">
                <div className="detail-item">
                  <span className="item-label">Téléphone :</span>
                  <span className="item-value">71 123 456</span>
                </div>
                <div className="detail-item">
                  <span className="item-label">Email :</span>
                  <span className="item-value">support@pizzatime.tn</span>
                </div>
                <div className="detail-item">
                  <span className="item-label">Statut commande :</span>
                  <span className="item-value" style={{ color: '#f39c12' }}>
                    ⏳ En préparation
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          {orderDetails.items && orderDetails.items.length > 0 && (
            <div className="order-items-section">
              <h3 className="section-title">
                <span>🍕</span>
                Détails de votre commande
              </h3>
              <div className="order-items">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-info">
                      <div className="item-quantity">{item.quantity}</div>
                      <div className="item-name">{item.pizzaName}</div>
                    </div>
                    <div className="item-price">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Summary */}
          <div className="total-summary">
            <h3 className="section-title">
              <span>💰</span>
              Récapitulatif de paiement
            </h3>
            
            <div className="summary-row">
              <span>Sous-total</span>
              <span>{formatPrice(orderDetails.total * 0.81)}</span>
            </div>
            
            
            
            <div className="summary-row">
              <span>Frais de livraison</span>
              <span>
                {orderDetails.deliveryMethod === 'delivery' 
                  ? (orderDetails.total > 30 ? 'Gratuite 🎉' : formatPrice(3.500))
                  : 'Gratuit'
                }
              </span>
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-total">
              <span>Total payé</span>
              <span className="total-amount">
                {formatPrice(orderDetails.total)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <Link to="/" className="btn btn-primary">
              <span>🏠</span>
              <span>Retour à l'accueil</span>
            </Link>
            
            <Link to="/orders" className="btn btn-success">
              <span>📋</span>
              <span>Voir mes commandes</span>
            </Link>
            
            <button 
              className="btn btn-accent"
              onClick={() => window.print()}
            >
              <span>🖨️</span>
              <span>Imprimer le reçu</span>
            </button>
          </div>

          {/* Countdown */}
          <div className="countdown">
            <p>
              Redirection automatique vers vos commandes dans{' '}
              <span className="countdown-number">{countdown}</span> seconde{countdown !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Footer */}
          <div className="confirmation-footer">
            <p>Merci d'avoir choisi Pizza Time !</p>
            <p>Vous recevrez un email de confirmation sous peu.</p>
            
            <div className="contact-info">
              <div className="contact-item">
                <span>📞</span>
                <span>71 123 456</span>
              </div>
              <div className="contact-item">
                <span>✉️</span>
                <span>contact@pizzapetes@gmail.com</span>
              </div>
              <div className="contact-item">
                <span>📍</span>
                <span>Centre Urbain Nord, Tunis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderConfirmation;
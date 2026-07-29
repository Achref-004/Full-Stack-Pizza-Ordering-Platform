import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const BACKEND_URL = "http://localhost:5004";
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const showMessage = (msg, isErrorMsg = false) => {
    setIsError(isErrorMsg);
    setMessage(msg);
    setTimeout(() => setMessage(''), 10000);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = `${BACKEND_URL}/api/admin/orders`;
      
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders || data);
        calculateStats(data.orders || data);
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération des commandes');
      }
    } catch (err) {
      console.error(err);
      showMessage('❌ ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders) => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const deliveredOrders = orders.filter(order => order.status === 'delivered').length;

    setStats({
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      pendingOrders,
      deliveredOrders
    });
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusChange = async (id, status) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('✅ Statut mis à jour avec succès', false);
        fetchOrders();
      } else {
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error(err);
      showMessage('❌ ' + err.message, true);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: '#f39c12', bg: '#fef5e7', label: 'En attente', icon: '⏳' },
      'confirmed': { color: '#3498db', bg: '#e8f4fd', label: 'Confirmée', icon: '✅' },
      'preparing': { color: '#9b59b6', bg: '#f4ecf7', label: 'En préparation', icon: '👨‍🍳' },
      'out_for_delivery': { color: '#1abc9c', bg: '#e8f6f3', label: 'En livraison', icon: '🚚' },
      'delivered': { color: '#27ae60', bg: '#d4edda', label: 'Livrée', icon: '🎉' },
      'cancelled': { color: '#e74c3c', bg: '#f8d7da', label: 'Annulée', icon: '❌' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '0.85em',
        fontWeight: '600',
        backgroundColor: config.bg,
        color: config.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        border: `1px solid ${config.color}20`
      }}>
        {config.icon} {config.label}
      </span>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };


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
          height: 100%;
        }

        body {
          font-family: system-ui, sans-serif;
          background: #f8f9fa;
          width: 100%;
        }

        .admin-container {
          min-height: 100vh;
          padding: 20px;
          width: 100%;
        }

        .admin-header {
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          margin-bottom: 30px;
          border-left: 5px solid #f39c12;
          width: 100%;
        }

        .admin-title {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          width: 100%;
        }

        .admin-title h1 {
          color: #2c3e50;
          font-size: 2.5em;
          width: 100%;
        }

        .delivery-icon {
          font-size: 2em;
          color: #f39c12;
        }

        .user-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          width: 100%;
        }

        .welcome-text {
          font-size: 1.2em;
          color: #7f8c8d;
          width: auto;
        }

        .back-button {
          background: #95a5a6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          width: auto;
        }

        .back-button:hover {
          background: #7f8c8d;
          transform: translateY(-2px);
        }

        .logout-btn {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          width: auto;
        }

        .logout-btn:hover {
          background: #c0392b;
          transform: translateY(-2px);
        }

        .admin-notice {
          background: #e8f4fd;
          border: 1px solid #b6d7f2;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          color: #2c3e50;
          width: 100%;
        }

        .admin-notice h3 {
          margin: 0 0 10px 0;
          color: #2980b9;
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .filters-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          width: 100%;
        }

        .filters {
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          font-size: 14px;
          cursor: pointer;
          min-width: 180px;
          transition: all 0.3s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .refresh-button {
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          width: auto;
        }

        .refresh-button:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
          width: 100%;
        }

        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          text-align: center;
          border-top: 4px solid #f39c12;
          width: 100%;
        }

        .stat-number {
          font-size: 2.5em;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
          width: 100%;
        }

        .stat-label {
          color: #7f8c8d;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.9em;
          width: 100%;
        }

        .orders-section {
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          overflow: hidden;
          width: 100%;
        }

        .section-header {
          padding: 25px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
          width: 100%;
        }

        .section-header h2 {
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
        }

        .orders-table th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #e9ecef;
        }

        .orders-table td {
          padding: 15px;
          border-bottom: 1px solid #e9ecef;
          vertical-align: middle;
        }

        .orders-table th:nth-child(1),
        .orders-table td:nth-child(1) {
          width: 10%;
          max-width: 100px;
        }

        .orders-table th:nth-child(2),
        .orders-table td:nth-child(2) {
          width: 18%;
        }

        .orders-table th:nth-child(3),
        .orders-table td:nth-child(3) {
          width: 8%;
        }

        .orders-table th:nth-child(4),
        .orders-table td:nth-child(4) {
          width: 12%;
        }

        .orders-table th:nth-child(5),
        .orders-table td:nth-child(5) {
          width: 12%;
        }

        .orders-table th:nth-child(6),
        .orders-table td:nth-child(6) {
          width: 40%;
        }

        .orders-table tr {
          width: 100%;
        }

        .orders-table tr:hover {
          background: #f8f9fa;
        }

        .order-number {
          font-weight: 600;
          color: #2c3e50;
          font-family: 'Courier New', monospace;
          font-size: 1em;
        }

        .customer-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .customer-name {
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.95em;
        }

        .customer-email {
          color: #7f8c8d;
          font-size: 0.8em;
        }

        .total-amount {
          font-weight: 600;
          color: #27ae60;
          font-size: 1.1em;
        }

        .status-select {
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          font-size: 13px;
          cursor: pointer;
          min-width: 140px;
          transition: all 0.3s ease;
          width: auto;
        }

        .status-select:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          width: 100%;
        }

        .btn {
          padding: 8px 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 0.85em;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          width: auto;
        }

        .btn-details {
          background: #3498db;
          color: white;
        }

        .btn-details:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #7f8c8d;
          width: 100%;
        }

        .pizza-icon {
          font-size: 4em;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .message {
          padding: 15px 20px;
          margin-bottom: 20px;
          border-radius: 8px;
          font-weight: 500;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: slideIn 0.3s ease-out;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          position: relative;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
          border-left: 4px solid #28a745;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-left: 4px solid #dc3545;
        }

        .message-icon {
          font-size: 1.2em;
          flex-shrink: 0;
        }

        .message-content {
          flex: 1;
        }

        .message-close {
          background: none;
          border: none;
          font-size: 1.5em;
          cursor: pointer;
          opacity: 0.7;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s ease;
          flex-shrink: 0;
        }

        .message-close:hover {
          opacity: 1;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          background: white;
          border-radius: 15px;
          padding: 30px;
          max-width: 600px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          animation: slideUp 0.3s ease;
          border: 1px solid #e9ecef;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f8f9fa;
        }

        .modal-icon {
          font-size: 2em;
          color: #3498db;
        }

        .modal-title {
          color: #2c3e50;
          font-size: 1.5em;
          font-weight: 700;
          margin: 0;
        }

        .modal-body {
          margin-bottom: 25px;
        }

        .order-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }

        .detail-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #3498db;
        }

        .detail-label {
          font-size: 0.85em;
          color: #7f8c8d;
          margin-bottom: 5px;
        }

        .detail-value {
          font-size: 1.1em;
          font-weight: 600;
          color: #2c3e50;
        }

        .pizza-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .pizza-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .pizza-quantity {
          color: #7f8c8d;
          font-size: 0.9em;
        }

        .pizza-price {
          font-weight: 600;
          color: #27ae60;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .modal-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1em;
        }

        .modal-btn-close {
          background: #95a5a6;
          color: white;
        }

        .modal-btn-close:hover {
          background: #7f8c8d;
          transform: translateY(-2px);
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

        .spinner {
          border: 3px solid rgba(255,255,255,0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          animation: spin 1s linear infinite;
          display: inline-block;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .admin-container {
            padding: 10px;
            width: 100%;
          }

          .user-info {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
          }

          .filters-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .filters {
            flex-direction: column;
            width: 100%;
          }

          .filter-select,
          .refresh-button {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            width: 100%;
          }

          .orders-table {
            display: block;
            overflow-x: auto;
            width: '100%';
          }

          .orders-table th,
          .orders-table td {
            white-space: nowrap;
            min-width: 120px;
          }

          .action-buttons {
            flex-direction: column;
            width: 100%;
          }

          .btn {
            width: 100%;
          }

          .status-select {
            min-width: 100%;
          }

          .modal-content {
            padding: 20px;
            width: 95%;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-btn {
            width: 100%;
          }
        }

        @media (min-width: 1200px) {
          .admin-container {
            max-width: 100%;
            margin: 0 auto;
          }
        }
      `}</style>

      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-title">
            <span className="delivery-icon">🚚</span>
            <h1>Gestion des Commandes</h1>
          </div>
          
          <div className="user-info">
            <div className="welcome-text">
              Bienvenue <strong>{currentUser?.firstName}</strong> | Gestion des commandes
            </div>

            <div className="action-buttons">
              <button 
                className="back-button"
                onClick={() => navigate('/admin')}
              >
                ← Retour au dashboard
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>

        <div className="admin-notice">
          <h3>📦 Gestion des commandes</h3>
          <p>Vous pouvez modifier le statut des commandes et consulter les détails. Les mises à jour sont automatiques.</p>
        </div>

        {message && (
          <div className={`message ${isError ? 'error' : 'success'}`}>
            <span className="message-icon">
              {isError}
            </span>
            <span className="message-content">{message}</span>
            <button 
              className="message-close"
              onClick={() => setMessage('')}
              aria-label="Fermer le message"
            >
              ×
            </button>
          </div>
        )}

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.totalOrders}</div>
              <div className="stat-label">Commandes totales</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalRevenue}dt</div>
              <div className="stat-label">Chiffre d'affaires</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.pendingOrders}</div>
              <div className="stat-label">En attente</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.deliveredOrders}</div>
              <div className="stat-label">Livrées</div>
            </div>
          </div>
        )}

        <div className="filters-section">
          <div className="filters">
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">📋 Tous les statuts</option>
              <option value="pending">⏳ En attente</option>
              <option value="confirmed">✅ Confirmées</option>
              <option value="preparing">👨‍🍳 En préparation</option>
              <option value="out_for_delivery">🚚 En livraison</option>
              <option value="delivered">🎉 Livrées</option>
              <option value="cancelled">❌ Annulées</option>
            </select>
            
            <button 
              className="refresh-button"
              onClick={fetchOrders}
            >
              🔄 Actualiser
            </button>
          </div>
        </div>

        <div className="orders-section">
          <div className="section-header">
            <h2>
              <span>📋</span>
              Liste des commandes ({orders.length})
            </h2>
            <p style={{ marginTop: '10px', color: '#7f8c8d', fontSize: '0.9em', width: '100%' }}>
              Cliquez sur "Détails" pour voir plus d'informations sur une commande.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="pizza-icon">🍕</div>
              <h3>Aucune commande trouvée</h3>
              <p>
                {statusFilter === 'all' 
                  ? "Aucune commande n'a été passée pour le moment."
                  : `Aucune commande avec ce filtre n'a été trouvée.`
                }
              </p>
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>N° Commande</th>
                    <th style={{ width: '20%' }}>Client</th>
                    <th style={{ width: '10%' }}>Total</th>
                    <th style={{ width: '15%' }}>Statut actuel</th>
                    <th style={{ width: '15%' }}>Date</th>
                    <th style={{ width: '25%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id || order._id}>
                      <td>
                        <span className="order-number">
                          #{order.orderNumber || order._id.toString().substring(0, 8)}
                        </span>
                      </td>
                      <td>
                        <div className="customer-info">
                          <span className="customer-name">
                            {order.user?.firstName} {order.user?.lastName}
                          </span>
                          <span className="customer-email">
                            {order.user?.email || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="total-amount">
                          {parseFloat(order.total || 0).toFixed(2)}dt
                        </span>
                      </td>
                      <td>
                        {getStatusBadge(order.status)}
                      </td>
                      <td>
                        {formatDate(order.createdAt)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <select 
                            className="status-select"
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id || order._id, e.target.value)}
                          >
                            <option value="pending">⏳ En attente</option>
                            <option value="confirmed">✅ Confirmée</option>
                            <option value="preparing">👨‍🍳 En préparation</option>
                            <option value="out_for_delivery">🚚 En livraison</option>
                            <option value="delivered">🎉 Livrée</option>
                            <option value="cancelled">❌ Annulée</option>
                          </select>
                          
                          <button 
                            className="btn btn-details"
                            onClick={() => viewOrderDetails(order)}
                          >
                            👁️ Détails
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showDetailsModal && selectedOrder && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <span className="modal-icon">📦</span>
                <h2 className="modal-title">
                  Détails de la commande #{selectedOrder.orderNumber || selectedOrder._id.toString().substring(0, 8)}
                </h2>
              </div>
              
              <div className="modal-body">
                <div className="order-details-grid">
                  <div className="detail-card">
                    <div className="detail-label">Client</div>
                    <div className="detail-value">
                      {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
                    </div>
                  </div>
                  
                  <div className="detail-card">
                    <div className="detail-label">Email</div>
                    <div className="detail-value">{selectedOrder.user?.email || 'N/A'}</div>
                  </div>
                  
                  <div className="detail-card">
                    <div className="detail-label">Statut</div>
                    <div className="detail-value">
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                  </div>
                  
                  <div className="detail-card">
                    <div className="detail-label">Total</div>
                    <div className="detail-value total-amount">
                      {parseFloat(selectedOrder.total || 0).toFixed(2)}€
                    </div>
                  </div>
                  
                  <div className="detail-card">
                    <div className="detail-label">Date de commande</div>
                    <div className="detail-value">{formatDate(selectedOrder.createdAt)}</div>
                  </div>
                  
                  <div className="detail-card">
                    <div className="detail-label">Adresse</div>
                    <div className="detail-value">
                      {selectedOrder.user?.address 
                        ? `${selectedOrder.user.address}, ${selectedOrder.user.city}, ${selectedOrder.user.state}`
                        : 'Non spécifiée'
                      }
                    </div>
                  </div>
                </div>

                <h4 style={{ margin: '20px 0 10px 0', color: '#2c3e50' }}>🍕 Articles commandés</h4>
                <div>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <div key={index} className="pizza-item">
                        <div>
                          <span className="pizza-name">{item.name}</span>
                          <span className="pizza-quantity"> × {item.quantity}</span>
                        </div>
                        <span className="pizza-price">
                          {(item.price * item.quantity).toFixed(2)}€
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
                      Aucun détail d'article disponible
                    </p>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="modal-btn modal-btn-close"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminOrders;
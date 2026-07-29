import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const BACKEND_URL = "http://localhost:5004";
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        const normalUsers = data.users.filter(user => !user.isAdmin);
        setUsers(normalUsers);
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération des utilisateurs');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showMessage('❌ ' + error.message, true);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const showMessage = (msg, isErrorMsg = false) => {
    setIsError(isErrorMsg);
    setMessage(msg);
    
    setTimeout(() => {
      setMessage('');
    }, 10000);
  };

  const handleDeleteClick = (userId, userEmail, userName) => {
    if (userId === currentUser.id) {
      showMessage('❌ Vous ne pouvez pas supprimer votre propre compte', true);
      return;
    }
    
    setUserToDelete({ id: userId, email: userEmail, name: userName });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('✅ Utilisateur supprimé avec succès', false);
        fetchUsers();
        fetchStats();
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showMessage('❌ ' + error.message, true);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleEditUser = (user) => {
    setEditingUser(user._id);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || ''
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${editingUser}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('✅ Utilisateur modifié avec succès', false);
        setEditingUser(null);
        fetchUsers();
      } else {
        throw new Error(data.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showMessage('❌ ' + error.message, true);
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      city: '',
      state: ''
    });
    showMessage('✅ Modification annulée', false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
          border-left: 5px solid #e74c3c;
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

        .crown-icon {
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
          border-top: 4px solid #e74c3c;
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

        .users-section {
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

        .users-table {
          width: 100%;
          border-collapse: collapse;
        }

        .users-table th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #e9ecef;
        }

        .users-table td {
          padding: 15px;
          border-bottom: 1px solid #e9ecef;
          vertical-align: middle;
        }
        
        .users-table th:nth-child(1),
        .users-table td:nth-child(1) {
          width: 10%;
          max-width: 120px;
        }

        .users-table tr {
          width: 100%;
        }

        .users-table tr:hover {
          background: #f8f9fa;
        }

        .user-role {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: 600;
          text-transform: uppercase;
          width: auto;
        }

        .role-user {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          width: 100%;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 0.9em;
          width: auto;
        }

        .btn-edit {
          background: #3498db;
          color: white;
        }

        .btn-edit:hover {
          background: #2980b9;
        }

        .btn-delete {
          background: #e74c3c;
          color: white;
        }

        .btn-delete:hover {
          background: #c0392b;
        }

        .btn-cancel {
          background: #95a5a6;
          color: white;
        }

        .btn-cancel:hover {
          background: #7f8c8d;
        }

        .btn-save {
          background: #27ae60;
          color: white;
        }

        .btn-save:hover {
          background: #219a52;
        }

        .edit-form {
          background: #f8f9fa;
          padding: 20px;
          margin: 10px 0;
          border-radius: 8px;
          border-left: 4px solid #3498db;
          width: 100%;
        }

        .form-row {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          width: 100%;
        }

        .form-group {
          flex: 1;
          width: 100%;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.9em;
          width: 100%;
        }

        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3498db;
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
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          animation: slideUp 0.3s ease;
          border: 1px solid #e9ecef;
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
          color: #e74c3c;
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

        .user-info-card {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 20px;
          margin: 15px 0;
          border-left: 4px solid #e74c3c;
        }

        .user-email {
          font-size: 1.2em;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .user-name {
          color: #7f8c8d;
          font-size: 0.9em;
        }

        .warning-text {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 15px;
          color: #856404;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 15px 0;
        }

        .warning-icon {
          font-size: 1.2em;
          flex-shrink: 0;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
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

        .modal-btn-cancel {
          background: #95a5a6;
          color: white;
        }

        .modal-btn-cancel:hover {
          background: #7f8c8d;
          transform: translateY(-2px);
        }

        .modal-btn-confirm {
          background: #e74c3c;
          color: white;
        }

        .modal-btn-confirm:hover {
          background: #c0392b;
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

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #7f8c8d;
          width: 100%;
        }

        .empty-state .pizza-icon {
          font-size: 4em;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .admin-links {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .admin-links .btn {
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
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

          .stats-grid {
            grid-template-columns: 1fr;
            width: 100%;
          }

          .users-table {
            display: block;
            overflow-x: auto;
            width: '100%';
          }

          .users-table th,
          .users-table td {
            white-space: nowrap;
            min-width: 120px;
          }

          .form-row {
            flex-direction: column;
            width: 100%;
          }

          .action-buttons {
            flex-direction: column;
            width: 100%;
          }

          .btn {
            width: 100%;
          }

          .message {
            padding: 12px 15px;
            font-size: 0.9em;
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

          .admin-links {
            flex-direction: column;
            width: 100%;
          }

          .admin-links .btn {
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
            <span className="crown-icon">👑</span>
            <h1>Administration Pizza Pete's</h1>
          </div>
          
          <div className="user-info">
            <div className="welcome-text">
              Bienvenue <strong>{currentUser?.firstName}</strong> | {currentUser?.email}
            </div>

            <div className="admin-links">
              <button 
                type="button" 
                className="btn btn-edit" 
                onClick={() => navigate('/admin/pizzas')}
              >
                🍕 Gérer les Pizzas
              </button>
              <button 
                type="button" 
                className="btn btn-edit" 
                onClick={() => navigate('/admin/orders')}
              >
                📦 Gérer les Commandes
              </button>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              Se déconnecter
            </button>
          </div>
        </div>

        <div className="admin-notice">
          <h3>🔒 Zone d'administration sécurisée</h3>
          <p>Vous pouvez gérer tous les utilisateurs normaux de l'application depuis cette interface.</p>
        </div>

        {message && (
          <div className={`message ${isError ? 'error' : 'success'}`}>
            <span className="message-icon">
              {isError }
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
              <div className="stat-number">{stats.totalRegularUsers}</div>
              <div className="stat-label">Utilisateurs normaux</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalAdmins}</div>
              <div className="stat-label">Administrateurs</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalUsers}</div>
              <div className="stat-label">Utilisateurs totaux</div>
            </div>
          </div>
        )}

        <div className="users-section">
          <div className="section-header">
            <h2>
              <span>👥</span>
              Gestion des utilisateurs ({users.length})
            </h2>
            <p style={{ marginTop: '10px', color: '#7f8c8d', fontSize: '0.9em', width: '100%' }}>
              Seuls les utilisateurs normaux sont affichés ici. Les administrateurs ne sont pas visibles.
            </p>
          </div>

          {users.length === 0 ? (
            <div className="empty-state">
              <div className="pizza-icon">🍕</div>
              <h3>Aucun utilisateur trouvé</h3>
              <p>Aucun utilisateur normal n'est inscrit pour le moment.</p>
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table className="users-table">
                <thead>

                  <tr>
                    <th style={{ width: '10%' }}>Utilisateur</th>
                    <th style={{ width: '20%' }}>Email</th>
                    <th style={{ width: '25%' }}>Adresse</th>
                    <th style={{ width: '8%' }}>Rôle</th>
                    <th style={{ width: '15%' }}>Date d'inscription</th>
                    <th style={{ width: '22%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <React.Fragment key={user._id}>
                      <tr>
                        <td>
                          <strong>{user.firstName} {user.lastName}</strong>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          {user.address ? (
                            `${user.address}, ${user.city}, ${user.state}`
                          ) : (
                            <span style={{color: '#95a5a6', fontStyle: 'italic'}}>
                              Non renseignée
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="user-role role-user">
                            Utilisateur
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn btn-edit"
                              onClick={() => handleEditUser(user)}
                              disabled={editingUser === user._id}
                            >
                              Modifier
                            </button>
                            <button 
                              className="btn btn-delete"
                              onClick={() => handleDeleteClick(user._id, user.email, `${user.firstName} ${user.lastName}`)}
                              disabled={editingUser === user._id}
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {editingUser === user._id && (
                        <tr>
                          <td colSpan="6" style={{ width: '100%' }}>
                            <form className="edit-form" onSubmit={handleUpdateUser}>
                              <h4 style={{ marginBottom: '15px', color: '#2c3e50', width: '100%' }}>
                                ✏️ Modifier l'utilisateur: {user.firstName} {user.lastName}
                              </h4>
                              
                              <div className="form-row">
                                <div className="form-group">
                                  <label>Prénom *</label>
                                  <input
                                    type="text"
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                                    required
                                  />
                                </div>
                                <div className="form-group">
                                  <label>Nom *</label>
                                  <input
                                    type="text"
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                                    required
                                  />
                                </div>
                              </div>
                              
                              <div className="form-group">
                                <label>Email *</label>
                                <input
                                  type="email"
                                  value={editForm.email}
                                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                  required
                                />
                              </div>

                              <div className="form-group">
                                <label>Adresse</label>
                                <input
                                  type="text"
                                  value={editForm.address}
                                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                  placeholder="Adresse de livraison"
                                />
                              </div>

                              <div className="form-row">
                                <div className="form-group">
                                  <label>Ville</label>
                                  <input
                                    type="text"
                                    value={editForm.city}
                                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                                    placeholder="Ville"
                                  />
                                </div>
                                <div className="form-group">
                                  <label>État/Département</label>
                                  <input
                                    type="text"
                                    value={editForm.state}
                                    onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                                    placeholder="État ou département"
                                  />
                                </div>
                              </div>

                              <div style={{ 
                                background: '#e8f4fd', 
                                padding: '10px', 
                                borderRadius: '6px', 
                                margin: '15px 0',
                                fontSize: '0.9em',
                                color: '#2c3e50',
                                width: '100%'
                              }}>
                                <strong>💡 Information :</strong> Les champs marqués d'un * sont obligatoires.
                              </div>

                              <div className="action-buttons">
                                <button type="submit" className="btn btn-save">
                                  💾 Enregistrer les modifications
                                </button>
                                <button type="button" className="btn btn-cancel" onClick={cancelEdit}>
                                  ↩️ Annuler
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showDeleteModal && userToDelete && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <span className="modal-icon">🗑️</span>
                <h2 className="modal-title">Confirmer la suppression</h2>
              </div>
              
              <div className="modal-body">
                <p>Vous êtes sur le point de supprimer définitivement un utilisateur :</p>
                
                <div className="user-info-card">
                  <div className="user-email">{userToDelete.email}</div>
                  <div className="user-name">{userToDelete.name}</div>
                </div>

                <div className="warning-text">
                  <span className="warning-icon">⚠️</span>
                  <span>Cette action est irréversible. Toutes les données de cet utilisateur seront perdues.</span>
                </div>

                <p>Souhaitez-vous vraiment continuer ?</p>
              </div>

              <div className="modal-actions">
                <button 
                  className="modal-btn modal-btn-cancel"
                  onClick={handleDeleteCancel}
                >
                  Annuler
                </button>
                <button 
                  className="modal-btn modal-btn-confirm"
                  onClick={handleDeleteConfirm}
                >
                  Confirmer la suppression
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Admin;
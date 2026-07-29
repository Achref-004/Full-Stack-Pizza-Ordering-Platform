import React, { useState, useEffect } from 'react';

const Profile = () => {
  const BACKEND_URL = "http://localhost:5004";
  const token = localStorage.getItem('token');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setEditForm({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          address: data.user.address || '',
          city: data.user.city || '',
          state: data.user.state || ''
        });
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération du profil');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setIsError(true);
      setMessage('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setMessage('✅ Profil mis à jour avec succès !');
        setUser(data.user);
        setIsEditing(false);
        
        const storedUser = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...storedUser, ...data.user }));
      } else {
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setIsError(true);
      setMessage('❌ ' + error.message);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setIsError(true);
      setMessage('❌ Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setIsError(true);
      setMessage('❌ Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setMessage('✅ Mot de passe modifié avec succès !');
        setIsChangingPassword(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error(data.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setIsError(true);
      setMessage('❌ ' + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
          borderTop: '3px solid #e74c3c',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          animation: 'spin 1s linear infinite',
          marginRight: '10px'
        }}></div>
        Chargement...
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

        .profile-container {
          min-height: 100vh;
          width: 100%;
          position: relative;
          background-image: url('https://images.unsplash.com/photo-1604382355076-af4b0eb60143?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80');
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
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          z-index: 1;
        }

        .content-wrapper {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 900px;
        }

        .profile-header {
          background: rgba(255,255,255,0.95);
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          margin-bottom: 25px;
          border-left: 5px solid #e74c3c;
        }

        .profile-title {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .profile-title h1 {
          color: #2c3e50;
          font-size: 2.2em;
          font-weight: 700;
        }

        .user-icon {
          font-size: 2.5em;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .user-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .welcome-text {
          font-size: 1.1em;
          color: #7f8c8d;
          font-weight: 500;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 1em;
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

        .btn-danger {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
        }

        .btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(231, 76, 60, 0.4);
        }

        .btn-secondary {
          background: linear-gradient(135deg, #95a5a6, #7f8c8d);
          color: white;
        }

        .btn-secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(149, 165, 166, 0.4);
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

        .profile-section {
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          padding: 30px;
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e9ecef;
        }

        .section-header h2 {
          color: #2c3e50;
          font-size: 1.5em;
          font-weight: 700;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .info-item {
          padding: 15px;
          background: rgba(248, 249, 250, 0.8);
          border-radius: 12px;
          border-left: 3px solid #e74c3c;
          transition: all 0.3s ease;
        }

        .info-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .info-label {
          font-weight: 600;
          color: #7f8c8d;
          font-size: 0.9em;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .info-value {
          color: #2c3e50;
          font-size: 1.1em;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.9em;
          text-transform: uppercase;
        }

        .form-group input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 2px solid #e8eeef;
          font-size: 16px;
          background: rgba(255,255,255,0.8);
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #e74c3c;
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .message {
          padding: 15px 20px;
          margin-bottom: 20px;
          border-radius: 12px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          animation: slideIn 0.3s ease;
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

        .message.success {
          background: linear-gradient(135deg, #d4edda, #c3e6cb);
          color: #155724;
          border: 2px solid #b1dfbb;
        }

        .message.error {
          background: linear-gradient(135deg, #f8d7da, #f5c6cb);
          color: #721c24;
          border: 2px solid #f1b0b7;
        }

        .password-info {
          background: rgba(232, 244, 253, 0.9);
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 15px;
          color: #2c3e50;
          font-size: 0.9em;
          border-left: 3px solid #3498db;
        }

        @media (max-width: 768px) {
          .profile-container {
            padding: 20px 10px;
          }

          .user-info {
            flex-direction: column;
            align-items: flex-start;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="profile-container">
        <div className="background-overlay"></div>

        <div className="content-wrapper">
          <div className="profile-header">
            <div className="profile-title">
              <span className="user-icon">👤</span>
              <h1>Mon Profil</h1>
            </div>
            
            <div className="user-info">
              <div className="welcome-text">
                Gérez vos informations personnelles
              </div>
              <button className="btn btn-danger" onClick={handleLogout}>
                 Se déconnecter
              </button>
            </div>
          </div>

          {message && (
            <div className={`message ${isError ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Section Informations Personnelles */}
          <div className="profile-section">
            <div className="section-header">
              <h2>📋 Informations personnelles</h2>
              {!isEditing && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsEditing(true)}
                >
                   Modifier
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Prénom</div>
                  <div className="info-value">{user?.firstName}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Nom</div>
                  <div className="info-value">{user?.lastName}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Email</div>
                  <div className="info-value">{user?.email}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Adresse</div>
                  <div className="info-value">{user?.address || 'Non renseignée'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Ville</div>
                  <div className="info-value">{user?.city || 'Non renseignée'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">État/Département</div>
                  <div className="info-value">{user?.state || 'Non renseigné'}</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label>Prénom </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    required
                    placeholder="Votre prénom"
                  />
                </div>

                <div className="form-group">
                  <label>Nom </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    required
                    placeholder="Votre nom"
                  />
                </div>

                <div className="form-group">
                  <label>Adresse</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    placeholder="Votre adresse complète"
                  />
                </div>

                <div className="form-group">
                  <label>Ville</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                    placeholder="Votre ville"
                  />
                </div>

                <div className="form-group">
                  <label>État/Département</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                    placeholder="Votre état ou département"
                  />
                </div>

                <div className="form-actions">
                  <button onClick={(e) => {
                    e.preventDefault();
                    handleEditSubmit(e);
                  }} className="btn btn-success">
                     Enregistrer
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        address: user?.address || '',
                        city: user?.city || '',
                        state: user?.state || ''
                      });
                    }}
                  >
                     Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section Changement de mot de passe */} 
          <div className="profile-section">
            <div className="section-header">
              <h2>🔐 Sécurité</h2>
              {!isChangingPassword && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsChangingPassword(true)}
                >
                  🔑 Changer le mot de passe
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <div>
                <div className="password-info">
                   Votre mot de passe doit contenir au moins 6 caractères
                </div>

                <div className="form-group">
                  <label>Mot de passe actuel *</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    required
                    placeholder="Entrez votre mot de passe actuel"
                  />
                </div>

                <div className="form-group">
                  <label>Nouveau mot de passe *</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    required
                    minLength={6}
                    placeholder="Nouveau mot de passe (min. 6 caractères)"
                  />
                </div>

                <div className="form-group">
                  <label>Confirmer le nouveau mot de passe *</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    required
                    minLength={6}
                    placeholder="Confirmez le nouveau mot de passe"
                  />
                </div>

                <div className="form-actions">
                  <button onClick={(e) => {
                    e.preventDefault();
                    handlePasswordSubmit(e);
                  }} className="btn btn-success">
                    🔒 Changer le mot de passe
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                  >
                     Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="password-info">
                🔐 Votre mot de passe est sécurisé. Cliquez sur "Changer le mot de passe" pour le modifier.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
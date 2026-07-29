import React, { useState } from 'react';

const Register = () => {
  const BACKEND_URL = 'http://localhost:5004';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    password: ''
  });

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setMessage(' Compte créé avec succès ! Redirection vers la connexion...');

        // Réinitialiser le formulaire
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          address: '',
          city: '',
          state: '',
          password: ''
        });

        // Redirection vers login après 2 secondes
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);

      } else {
        setIsError(true);
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setIsError(true);
      setMessage('❌ Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
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
          height: 100%;
          width: 100%;
          font-family: system-ui, sans-serif;
        }

        .register-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          width: 100%;
          position: relative;
          background-image: url('https://images.unsplash.com/photo-1604382355076-af4b0eb60143?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80');
          background-size: cover;
          background-position: center;
        }

        .background-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          z-index: 1;
        }

        .register-form {
          position: relative;
          z-index: 2;
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.3);
        }

        .form-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .pizza-icon {
          font-size: 2.5em;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .logo h1 {
          color: #e74c3c;
          font-size: 2.2em;
          font-weight: 700;
        }

        .form-row {
          display: flex;
          gap: 15px;
        }

        .form-group {
          flex: 1;
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          font-size: 0.9em;
          text-transform: uppercase;
          color: #2c3e50;
        }

        .form-group input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 2px solid #e8eeef;
          font-size: 16px;
          background: rgba(255,255,255,0.8);
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }

        .form-group input:focus {
          border-color: #e74c3c;
          background: white;
          outline: none;
        }

        .submit-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

        /* Styles améliorés pour les messages */
        .message {
          text-align: center;
          padding: 15px 20px;
          margin-bottom: 20px;
          border-radius: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          animation: slideIn 0.3s ease-out;
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

        .redirect-countdown {
          font-size: 0.9em;
          opacity: 0.8;
          margin-top: 5px;
        }

        .form-footer {
          text-align: center;
          margin-top: 25px;
        }

        .form-footer a {
          color: #e74c3c;
          text-decoration: none;
          font-weight: 600;
        }

        .form-footer a:hover {
          color: #c0392b;
          text-decoration: underline;
        }

        .security-note {
          margin-top: 10px;
          color: #555;
        }

        @media (max-width: 600px) {
          .register-form {
            max-width: 90%;
            padding: 25px 20px;
          }

          .form-row {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="register-container">
        <div className="background-overlay"></div>

        <div className="register-form">
          <div className="form-header">
            <div className="logo">
              <span className="pizza-icon">🍕</span>
              <h1>Pizza Pete's</h1>
            </div>
            <h2>Rejoignez la famille Pizza Pete's</h2>
            <p>Créez votre compte pour commander vos pizzas préférées</p>
          </div>

          {message && (
            <div className={`message ${isError ? 'error' : 'success'}`}>
              <span className="message-icon">
                {isError ? '❌' : '✅'}
              </span>
              <div>
                <div>{message}</div>
                {!isError && message.includes('Redirection') && (
                  <div className="redirect-countdown">
                    Redirection dans 2 secondes...
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="animated-form">
            <div className="form-row">
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Votre prénom"
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="exemple@email.com"
              />
            </div>

            <div className="form-group">
              <label>Adresse de livraison</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Votre adresse complète"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ville</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Votre ville"
                />
              </div>

              <div className="form-group">
                <label>État</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Votre État"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                disabled={isLoading}
                placeholder="Au moins 6 caractères"
              />
            </div>

            <button
              type="submit"
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Création en cours...
                </>
              ) : (
                '🍕 Créer mon compte'
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Vous avez déjà un compte ?{' '}
              <a href="/login" className="login-link">
                Se connecter
              </a>
            </p>
            <div className="security-note">
              <small>🔒 Vos données sont sécurisées</small>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
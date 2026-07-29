import React, { useState } from 'react';

const Login = () => {
  const BACKEND_URL = "http://localhost:5004";

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setMessage(`✅ Bienvenue ${data.user.firstName} !`);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setTimeout(() => {
          if (data.user.isAdmin) {
            window.location.href = '/admin';
          } else {
            window.location.href = '/home';
          }
        }, 1500);
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

        .login-container {
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

        .login-form {
          position: relative;
          z-index: 2;
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 440px;
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

        .form-group {
          margin-bottom: 25px;
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
          transition: all 0.3s ease;
        }

        .form-group input:focus {
          border-color: #e74c3c;
          background: white;
          outline: none;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.1);
        }

        .form-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          transition: all 0.3s ease;
          margin-bottom: 20px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(231, 76, 60, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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

        .message {
          text-align: center;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 12px;
          font-weight: 500;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .form-footer {
          text-align: center;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid #e8eeef;
        }

        .form-footer a {
          color: #e74c3c;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .form-footer a:hover {
          color: #c0392b;
          text-decoration: underline;
        }

        .security-note {
          margin-top: 15px;
          color: #7f8c8d;
          font-size: 0.9em;
        }

        .forgot-password {
          text-align: center;
          margin-bottom: 20px;
        }

        .forgot-password a {
          color: #3498db;
          text-decoration: none;
          font-size: 0.9em;
        }

        .forgot-password a:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .login-form {
            max-width: 90%;
            padding: 25px 20px;
          }
        }
      `}</style>

      <div className="login-container">
        <div className="background-overlay"></div>

        <div className="login-form">
          <div className="form-header">
            <div className="logo">
              <span className="pizza-icon">🍕</span>
              <h1>Pizza Pete's</h1>
            </div>
            <h2>Content de vous revoir !</h2>
            <p>Connectez-vous pour commander vos pizzas préférées</p>
          </div>

          {message && (
            <div className={`message ${isError ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={isLoading}
                placeholder="exemple@email.com"
              />
            </div>

            <div className="form-group">
              <label>Mot de passe</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                disabled={isLoading}
                placeholder="Votre mot de passe"
              />
            </div>

            <div className="forgot-password">
              <a href="/forgot-password">Mot de passe oublié ?</a>
            </div>

            <button 
              type="submit" 
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Connexion...
                </>
              ) : (
                '🍕 Se connecter'
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Pas de compte ?{' '}
              <a href="/register" className="register-link">
                S'inscrire
              </a>
            </p>
            <div className="security-note">
              <small>🔒 Connexion sécurisée</small>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
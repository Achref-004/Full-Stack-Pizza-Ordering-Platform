import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPizzas = () => {
  const [pizzas, setPizzas] = useState([]);
  const [form, setForm] = useState({
    name: '', 
    description: '', 
    basePrice: '', 
    category: 'classic',
    ingredients: '', 
    imageUrl: '', 
    isAvailable: true
  });
  const [editingPizza, setEditingPizza] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const BACKEND_URL = "http://localhost:5004";
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const showMessage = (msg, isErrorMsg = false) => {
    setIsError(isErrorMsg);
    setMessage(msg);
    setTimeout(() => setMessage(''), 10000);
  };

  const fetchPizzas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/pizzas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPizzas(data.pizzas || data);
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération des pizzas');
      }
    } catch (err) {
      console.error(err);
      showMessage('❌ ' + err.message, true);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchPizzas(); 
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name || form.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    
    if (!form.description || form.description.trim().length < 3) {
      newErrors.description = 'La description doit contenir au moins 3 caractères';
    }
    
    if (!form.basePrice || parseFloat(form.basePrice) <= 0) {
      newErrors.basePrice = 'Le prix doit être supérieur à 0';
    } else if (parseFloat(form.basePrice) > 100) {
      newErrors.basePrice = 'Le prix ne peut pas dépasser 100dt';
    }
    
    if (!form.category) {
      newErrors.category = 'La catégorie est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Effacer l'erreur quand l'utilisateur corrige
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) {
      showMessage('❌ Veuillez corriger les erreurs dans le formulaire', true);
      return;
    }
    
    try {
      const url = editingPizza 
        ? `${BACKEND_URL}/api/pizzas/${editingPizza.id || editingPizza._id}` 
        : `${BACKEND_URL}/api/pizzas`;
      
      const method = editingPizza ? 'PUT' : 'POST';

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        basePrice: parseFloat(form.basePrice),
        category: form.category,
        ingredients: form.ingredients.split(',').map(i => i.trim()).filter(i => i),
        imageUrl: form.imageUrl.trim(),
        isAvailable: form.isAvailable
      };

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.errors?.join(', ') || 'Erreur lors de la sauvegarde');
      }

      showMessage(
        editingPizza ? '✅ Pizza modifiée avec succès' : '✅ Pizza ajoutée avec succès', 
        false
      );
      
      setEditingPizza(null);
      setForm({ 
        name: '', 
        description: '', 
        basePrice: '', 
        category: 'classic', 
        ingredients: '', 
        imageUrl: '', 
        isAvailable: true 
      });
      setErrors({});
      
      fetchPizzas();
      
    } catch(err) {
      console.error('❌ Erreur:', err);
      showMessage('❌ ' + err.message, true);
    }
  };

  const handleEdit = pizza => {
    setEditingPizza(pizza);
    setForm({ 
      ...pizza, 
      ingredients: Array.isArray(pizza.ingredients) 
        ? pizza.ingredients.join(', ') 
        : pizza.ingredients 
    });
    setErrors({});
  };

  const handleDelete = async id => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette pizza ?')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/pizzas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
      
      showMessage('✅ Pizza supprimée avec succès', false);
      fetchPizzas();
      
    } catch(err) {
      console.error(err);
      showMessage('❌ ' + err.message, true);
    }
  };

  const cancelEdit = () => {
    setEditingPizza(null);
    setForm({ 
      name: '', 
      description: '', 
      basePrice: '', 
      category: 'classic', 
      ingredients: '', 
      imageUrl: '', 
      isAvailable: true 
    });
    setErrors({});
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

        .back-button {
          background: #95a5a6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .back-button:hover {
          background: #7f8c8d;
          transform: translateY(-2px);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .page-header h2 {
          color: #2c3e50;
          font-size: 2em;
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

        .admin-form {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .form-title {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 1.5em;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.9em;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3498db;
        }

        .form-error {
          color: #e74c3c;
          font-size: 0.85em;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .form-group.has-error input,
        .form-group.has-error textarea,
        .form-group.has-error select {
          border-color: #e74c3c;
          background-color: #fef5f5;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-submit {
          background: #27ae60;
          color: white;
        }

        .btn-submit:hover {
          background: #219a52;
        }

        .btn-submit:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }

        .btn-cancel {
          background: #95a5a6;
          color: white;
        }

        .btn-cancel:hover {
          background: #7f8c8d;
        }

        .admin-table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .table-header {
          padding: 25px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .table-header h3 {
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #e9ecef;
        }

        .admin-table td {
          padding: 15px;
          border-bottom: 1px solid #e9ecef;
          vertical-align: middle;
        }

        .admin-table tr:hover {
          background: #f8f9fa;
        }

        .availability-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: 600;
          text-transform: uppercase;
        }

        .available {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .unavailable {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .table-actions {
          display: flex;
          gap: 8px;
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

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #7f8c8d;
        }

        .pizza-icon {
          font-size: 4em;
          margin-bottom: 20px;
          opacity: 0.5;
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

        .character-count {
          color: #7f8c8d;
          font-size: 0.85em;
          margin-top: 5px;
          text-align: right;
        }

        .character-count.warning {
          color: #f39c12;
        }

        .character-count.error {
          color: #e74c3c;
        }

        @media (max-width: 768px) {
          .admin-container {
            padding: 10px;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .admin-table {
            display: block;
            overflow-x: auto;
          }

          .admin-table th,
          .admin-table td {
            white-space: nowrap;
            min-width: 120px;
          }

          .table-actions {
            flex-direction: column;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="admin-container">
        <button className="back-button" onClick={() => navigate('/admin')}>
          ← Retour au tableau de bord
        </button>

        <div className="page-header">
          <h2>🍕 Gestion des Pizzas</h2>
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

        <form className="admin-form" onSubmit={handleSubmit}>
          <h3 className="form-title">
            {editingPizza ? '✏️ Modifier une pizza' : '➕ Ajouter une nouvelle pizza'}
          </h3>
          
          <div className="form-grid">
            <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
              <label>Nom de la pizza *</label>
              <input
                type="text"
                name="name"
                placeholder="Ex: Margherita"
                value={form.name}
                onChange={handleChange}
                required
                minLength="2"
                maxLength="100"
              />
              {errors.name && (
                <div className="form-error">
                  ❌ {errors.name}
                </div>
              )}
            </div>

            <div className={`form-group ${errors.basePrice ? 'has-error' : ''}`}>
              <label>Prix de base (dt) *</label>
              <input
                type="number"
                name="basePrice"
                placeholder="Ex: 12.50"
                step="0.01"
                min="0.01"
                max="100"
                value={form.basePrice}
                onChange={handleChange}
                required
              />
              {errors.basePrice && (
                <div className="form-error">
                  ❌ {errors.basePrice}
                </div>
              )}
            </div>

            <div className={`form-group ${errors.category ? 'has-error' : ''}`}>
              <label>Catégorie *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="classic">Classique</option>
                <option value="special">Spéciale</option>
                <option value="vegetarian">Végétarienne</option>
                <option value="spicy">Épicée</option>
                <option value="custom">Personnalisée</option>
              </select>
              {errors.category && (
                <div className="form-error">
                  ❌ {errors.category}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>URL de l'image</label>
              <input
                type="text"
                name="imageUrl"
                placeholder="https://exemple.com/image.jpg"
                value={form.imageUrl}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={`form-group ${errors.description ? 'has-error' : ''}`}>
            <label>Description *</label>
            <textarea
              name="description"
              placeholder="Décrivez la pizza... (minimum 3 caractères)"
              value={form.description}
              onChange={handleChange}
              required
              minLength="3"
              maxLength="500"
            />
            <div className={`character-count ${
              form.description.length < 3 ? 'error' : 
              form.description.length > 450 ? 'warning' : ''
            }`}>
              {form.description.length}/500 caractères
            </div>
            {errors.description && (
              <div className="form-error">
                ❌ {errors.description}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Ingrédients (séparés par des virgules)</label>
            <input
              type="text"
              name="ingredients"
              placeholder="Ex: tomate, mozzarella, basilic, huile d'olive"
              value={form.ingredients}
              onChange={handleChange}
            />
            <small style={{color: '#7f8c8d', fontSize: '0.85em'}}>
              Séparez les ingrédients par des virgules
            </small>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="isAvailable"
              name="isAvailable"
              checked={form.isAvailable}
              onChange={handleChange}
            />
            <label htmlFor="isAvailable" style={{marginBottom: 0, fontWeight: 'normal'}}>
              Disponible à la vente
            </label>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-submit"
              disabled={Object.keys(errors).length > 0}
            >
              {editingPizza ? '💾 Enregistrer les modifications' : '➕ Ajouter la pizza'}
            </button>
            
            {editingPizza && (
              <button 
                type="button" 
                className="btn btn-cancel"
                onClick={cancelEdit}
              >
                ↩️ Annuler
              </button>
            )}
          </div>
        </form>

        <div className="admin-table-container">
          <div className="table-header">
            <h3>📋 Liste des pizzas ({pizzas.length})</h3>
          </div>

          {pizzas.length === 0 ? (
            <div className="empty-state">
              <div className="pizza-icon">🍕</div>
              <h3>Aucune pizza trouvée</h3>
              <p>Commencez par ajouter votre première pizza !</p>
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Prix</th>
                    <th>Catégorie</th>
                    <th>Disponibilité</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pizzas.map(pizza => (
                    <tr key={pizza.id || pizza._id}>
                      <td>
                        <strong>{pizza.name}</strong>
                        {pizza.imageUrl && (
                          <div style={{marginTop: '5px'}}>
                            <img 
                              src={pizza.imageUrl} 
                              alt={pizza.name}
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '6px'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td style={{maxWidth: '200px'}}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {pizza.description}
                        </div>
                      </td>
                      <td>{parseFloat(pizza.basePrice).toFixed(2)}dt</td>
                      <td>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8em',
                          fontWeight: '600',
                          backgroundColor: '#e8f4fd',
                          color: '#2980b9'
                        }}>
                          {pizza.category}
                        </span>
                      </td>
                      <td>
                        <span className={`availability-badge ${pizza.isAvailable ? 'available' : 'unavailable'}`}>
                          {pizza.isAvailable ? 'Disponible' : 'Indisponible'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="btn btn-edit"
                            onClick={() => handleEdit(pizza)}
                          >
                            ✏️ Modifier
                          </button>
                          <button 
                            className="btn btn-delete"
                            onClick={() => handleDelete(pizza.id || pizza._id)}
                          >
                            🗑️ Supprimer
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
      </div>
    </>
  );
};

export default AdminPizzas;
// pages/MyCustomPizzas.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MyCustomPizzas = () => {
  const BACKEND_URL = "http://localhost:5004";
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [user, setUser] = useState(userData);
  const [customPizzas, setCustomPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [selectedPizza, setSelectedPizza] = useState(null);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    basePrice: 0
  });

  // Constantes API
  const API_BASE = {
    CUSTOM_PIZZAS: `${BACKEND_URL}/api/custom-pizzas`,
    CART: `${BACKEND_URL}/api/cart`,
    USER: `${BACKEND_URL}/api/user`
  };

  // Options pour la personnalisation
  const sizes = [
    { id: 'small', name: 'Petite', price: 2, icon: '🟢' },
    { id: 'medium', name: 'Moyenne', price: 4, icon: '🟡' },
    { id: 'large', name: 'Grande', price: 6, icon: '🔴' }
  ];

  const crusts = [
    { id: 'thin', name: 'Fine', price: 0, icon: '🥨' },
    { id: 'pan', name: 'Épaisse', price: 1, icon: '🥞' },
    { id: 'stuffed', name: 'Fourrée', price: 2, icon: '🥟' }
  ];

  // Fonction pour normaliser les données pizza
  const normalizePizzaData = (pizza) => {
    if (!pizza) return null;
    
    // S'assurer que config existe (renommer customConfig en config)
    const config = pizza.config || pizza.customConfig || {};
    
    // Créer un objet normalisé
    return {
      ...pizza,
      // Pour compatibilité avec le frontend
      config: config,
      customConfig: config, // Garder une copie aussi
      // Assurer que les IDs sont présents
      _id: pizza._id || pizza.id,
      customPizzaId: pizza.customPizzaId || pizza._id || pizza.id,
      // Ingrédients par défaut
      ingredients: pizza.ingredients || [],
      // Détails par défaut
      name: pizza.name || 'Pizza sans nom',
      description: pizza.description || '',
      basePrice: pizza.basePrice || 0,
      // Dates
      createdAt: pizza.createdAt || pizza.updatedAt || new Date().toISOString(),
      updatedAt: pizza.updatedAt || pizza.createdAt || new Date().toISOString()
    };
  };

  // Fonction pour déterminer le statut de la pizza
  const getPizzaStatus = (pizza) => {
    if (!pizza) return 'inactive';
    
    // Statut basé sur la date de création
    const createdAt = new Date(pizza.createdAt || pizza.updatedAt || Date.now());
    const now = new Date();
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCreation < 1) return 'new';
    if (daysSinceCreation < 7) return 'active';
    if (daysSinceCreation < 30) return 'regular';
    return 'classic';
  };

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (pizza) => {
    const status = getPizzaStatus(pizza);
    
    const statusConfig = {
      'new': { 
        icon: '🆕', 
        label: 'Nouveau', 
        color: '#e74c3c', 
        bg: '#fde8e8'
      },
      'active': { 
        icon: '🔥', 
        label: 'Actif', 
        color: '#f39c12', 
        bg: '#fef5e7'
      },
      'regular': { 
        icon: '⭐', 
        label: 'Régulier', 
        color: '#3498db', 
        bg: '#e8f4fd'
      },
      'classic': { 
        icon: '🏆', 
        label: 'Classique', 
        color: '#9b59b6', 
        bg: '#f4ecf7'
      },
      'inactive': { 
        icon: '💤', 
        label: 'Inactif', 
        color: '#95a5a6', 
        bg: '#f8f9fa'
      }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    
    return (
      <span className="badge status-badge" style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}30`
      }}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  // Fonction pour obtenir le score de popularité
  const getPopularityScore = (pizza) => {
    // Score basé sur plusieurs facteurs
    let score = 0;
    
    // Facteur 1: Âge de la pizza (plus récente = plus de points)
    const createdAt = new Date(pizza.createdAt || pizza.updatedAt || Date.now());
    const now = new Date();
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCreation < 1) score += 30;
    else if (daysSinceCreation < 7) score += 20;
    else if (daysSinceCreation < 30) score += 10;
    
    // Facteur 2: Nombre d'ingrédients
    if (pizza.ingredients && pizza.ingredients.length > 0) {
      score += Math.min(pizza.ingredients.length * 2, 20);
    }
    
    // Facteur 3: Longueur de la description
    if (pizza.description && pizza.description.length > 50) {
      score += 10;
    }
    
    // Facteur 4: Prix (prix moyen = plus de points)
    if (pizza.basePrice >= 8 && pizza.basePrice <= 12) {
      score += 15;
    }
    
    return Math.min(score, 100); // Maximum 100%
  };

  // Fonction pour obtenir l'icône de popularité
  const getPopularityIcon = (score) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '⭐';
    if (score >= 40) return '✨';
    if (score >= 20) return '💫';
    return '🌱';
  };

  // Fonction pour obtenir l'ID d'affichage
  const getDisplayId = (pizza) => {
    if (!pizza) return 'N/A';
    
    // Préférer customPizzaId car il est plus lisible
    if (pizza.customPizzaId && pizza.customPizzaId.startsWith('custom_')) {
      return pizza.customPizzaId.substring(0, 15) + '...';
    }
    
    // Sinon utiliser _id raccourci
    if (pizza._id) {
      return pizza._id.substring(0, 8) + '...';
    }
    
    return 'N/A';
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCustomPizzas();
  }, []);

  const fetchCustomPizzas = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des pizzas personnalisées...');
      
      const response = await axios.get(`${API_BASE.CUSTOM_PIZZAS}/my-pizzas`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        console.log('✅ Pizzas personnalisées chargées:', response.data);
        
        // Normaliser les données du backend
        const normalizedPizzas = (response.data.pizzas || []).map(normalizePizzaData);
        
        // Trier et calculer la popularité
        const sortedPizzas = normalizedPizzas
          .filter(pizza => pizza !== null)
          .map((pizza, index) => {
            const popularityScore = getPopularityScore(pizza);
            const popularityIcon = getPopularityIcon(popularityScore);
            
            return {
              ...pizza,
              popularityScore,
              popularityIcon
            };
          })
          .sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA; // Décroissant
          });
        
        console.log('📊 Pizzas normalisées:', sortedPizzas.length);
        setCustomPizzas(sortedPizzas);
      } else {
        console.error('❌ Réponse API non réussie:', response.data);
        setIsError(true);
        setMessage('❌ Erreur lors du chargement des pizzas personnalisées');
      }
    } catch (error) {
      console.error('❌ Erreur fetchCustomPizzas:', error);
      setIsError(true);
      setMessage('❌ Impossible de charger les pizzas personnalisées');
      setCustomPizzas([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePizzaClick = (pizza) => {
    const normalizedPizza = normalizePizzaData(pizza);
    setSelectedPizza(normalizedPizza);
    setEditForm({
      name: normalizedPizza.name,
      description: normalizedPizza.description,
      basePrice: normalizedPizza.basePrice
    });
    setEditMode(true);
    setConfiguratorOpen(true);
  };

  const handleOrderAgain = async (pizza) => {
    try {
      const normalizedPizza = normalizePizzaData(pizza);
      
      // Utiliser customPizzaId pour les pizzas personnalisées
      const pizzaId = normalizedPizza.customPizzaId || normalizedPizza._id;
      
      // S'assurer que config existe
      const config = normalizedPizza.config || normalizedPizza.customConfig || {};
      
      // Préparer la configuration de la pizza
      const order = {
        pizzaId: pizzaId,
        pizzaName: normalizedPizza.name,
        config: {
          size: config.size || 'medium',
          crust: config.crust || 'thin',
          toppings: config.toppings || [],
          quantity: 1
        },
        totalPrice: normalizedPizza.basePrice,
        isCustom: true,
        customDescription: normalizedPizza.description
      };

      console.log('📤 Commande de pizza personnalisée:', order);

      const response = await axios.post(`${API_BASE.CART}/add`, order, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setIsError(false);
        setMessage(`✅ ${normalizedPizza.name} ajoutée au panier !`);
        
        setTimeout(() => {
          setMessage('');
          navigate('/cart');
        }, 2000);
      } else {
        setIsError(true);
        setMessage('❌ Erreur lors de l\'ajout au panier');
      }
    } catch (error) {
      console.error('❌ Erreur handleOrderAgain:', error);
      setIsError(true);
      setMessage('❌ Erreur lors de l\'ajout au panier');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedPizza) {
      setIsError(true);
      setMessage('❌ Aucune pizza sélectionnée');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!editForm.name.trim()) {
      setIsError(true);
      setMessage('❌ Veuillez donner un nom à votre pizza');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // DÉTERMINER L'ID CORRECTEMENT
    let pizzaId = selectedPizza.customPizzaId || selectedPizza._id;
    
    // Convertir ObjectId en string si nécessaire
    if (pizzaId && typeof pizzaId === 'object') {
      pizzaId = pizzaId.toString();
    }
    
    if (!pizzaId) {
      console.error('❌ Aucun ID pour la pizza sélectionnée:', selectedPizza);
      setIsError(true);
      setMessage('❌ Impossible de trouver l\'ID de la pizza');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (pizzaId === 'undefined' || pizzaId === 'null') {
      console.error('❌ ID invalide pour la pizza:', pizzaId);
      setIsError(true);
      setMessage('❌ ID de pizza invalide');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      console.log('✏️ Tentative de mise à jour:', {
        pizzaId,
        pizzaName: selectedPizza.name,
        editData: editForm,
        type: pizzaId.startsWith('custom_') ? 'customPizzaId' : 'ObjectId'
      });
      
      const response = await axios.put(
        `${API_BASE.CUSTOM_PIZZAS}/${pizzaId}`,
        editForm,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.data.success) {
        setIsError(false);
        setMessage('✅ Pizza mise à jour avec succès !');
        
        // Rafraîchir la liste
        fetchCustomPizzas();
        
        setTimeout(() => {
          setMessage('');
          setConfiguratorOpen(false);
          setSelectedPizza(null);
          setEditMode(false);
        }, 2000);
      } else {
        setIsError(true);
        setMessage(response.data.message || '❌ Erreur lors de la mise à jour');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('❌ Erreur handleEditSubmit:', error);
      
      let errorMessage = '❌ Erreur lors de la mise à jour';
      
      if (error.response) {
        console.error('Détails erreur backend:', error.response.data);
        errorMessage = `❌ ${error.response.data.message || 'Erreur serveur'}`;
        
        // Si l'erreur est liée à l'ID, essayer avec l'autre ID
        if (error.response.status === 400 && error.response.data.message?.includes('ID')) {
          console.log('Tentative avec l\'autre ID...');
          const otherId = pizzaId.startsWith('custom_') 
            ? selectedPizza._id 
            : selectedPizza.customPizzaId;
          
          if (otherId && otherId !== pizzaId) {
            console.log('ID alternatif disponible:', otherId);
            setMessage(`Essayer avec l'autre ID: ${otherId.substring(0, 10)}...`);
          }
        }
      } else if (error.request) {
        errorMessage = '❌ Pas de réponse du serveur';
      } else {
        errorMessage = `❌ Erreur: ${error.message}`;
      }
      
      setIsError(true);
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (pizza) => {
    const normalizedPizza = normalizePizzaData(pizza);
    
    if (!normalizedPizza) {
      console.error('❌ Pizza object is null or undefined');
      setIsError(true);
      setMessage('❌ Données de pizza invalides');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // ESSAYER D'ABORD AVEC customPizzaId, PUIS _id
    let pizzaId = normalizedPizza.customPizzaId || normalizedPizza._id;
    
    if (!pizzaId) {
      console.error('❌ Aucun ID trouvé pour la pizza:', normalizedPizza);
      setIsError(true);
      setMessage(`❌ Impossible de supprimer "${normalizedPizza.name || 'la pizza'}": ID manquant`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Convertir ObjectId en string si nécessaire
    if (typeof pizzaId === 'object') {
      pizzaId = pizzaId.toString();
    }

    if (pizzaId === 'undefined' || pizzaId === 'null') {
      console.error('❌ ID invalide:', pizzaId);
      setIsError(true);
      setMessage(`❌ ID invalide pour "${normalizedPizza.name || 'la pizza'}"`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const pizzaName = normalizedPizza.name || 'cette pizza';
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${pizzaName}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      console.log('🗑️ Tentative de suppression:', {
        name: pizzaName,
        id: pizzaId,
        type: typeof pizzaId
      });
      
      const response = await axios.delete(
        `${API_BASE.CUSTOM_PIZZAS}/${pizzaId}`,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.data.success) {
        setIsError(false);
        setMessage(`✅ "${pizzaName}" supprimée avec succès !`);
        
        // Rafraîchir immédiatement
        setTimeout(() => {
          fetchCustomPizzas();
        }, 300);
        
        setTimeout(() => setMessage(''), 2000);
      } else {
        setIsError(true);
        setMessage(`❌ ${response.data.message || 'Erreur lors de la suppression'}`);
        
        // Essayer avec l'autre ID si disponible
        if (response.data.message?.includes('ID') && normalizedPizza.customPizzaId && normalizedPizza._id) {
          const otherId = pizzaId === normalizedPizza.customPizzaId ? normalizedPizza._id : normalizedPizza.customPizzaId;
          console.log('ID alternatif disponible pour retry:', otherId);
        }
        
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('❌ Erreur handleDelete:', error);
      
      let errorMessage = '❌ Erreur lors de la suppression';
      
      if (error.response) {
        console.error('Détails serveur:', error.response.data);
        errorMessage = `❌ ${error.response.data.message || 'Erreur serveur'}`;
      } else if (error.request) {
        errorMessage = '❌ Pas de réponse du serveur';
      } else {
        errorMessage = `❌ Erreur: ${error.message}`;
      }
      
      setIsError(true);
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(price) + ' DT';
  };

  const getSizeName = (sizeId) => {
    const size = sizes.find(s => s.id === sizeId);
    return size ? size.name : 'Moyenne';
  };

  const getCrustName = (crustId) => {
    const crust = crusts.find(c => c.id === crustId);
    return crust ? crust.name : 'Fine';
  };

  if (loading) {
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
          animation: 'spin 1s linear infinite',
        }}></div>
        <div>Chargement de vos pizzas personnalisées...</div>
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

        /* Historique Container */
        .history-container {
          min-height: 100vh;
          width: 100%;
          position: relative;
          background-image: url('https://images.unsplash.com/photo-1555072956-7758afb20e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80');
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
        }

        /* Message Alert */
        .message-alert {
          position: fixed;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          padding: 16px 30px;
          border-radius: 12px;
          font-weight: 600;
          box-shadow: 0 15px 35px rgba(0,0,0,0.3);
          animation: slideIn 0.3s ease;
          z-index: 10000;
          backdrop-filter: blur(10px);
          border: 2px solid transparent;
          text-align: center;
          max-width: 500px;
          width: 90%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .message-alert.success {
          background: linear-gradient(135deg, rgba(39, 174, 96, 0.95), rgba(33, 154, 82, 0.95));
          color: white;
          border-color: #27ae60;
        }

        .message-alert.error {
          background: linear-gradient(135deg, rgba(231, 76, 60, 0.95), rgba(192, 57, 43, 0.95));
          color: white;
          border-color: #e74c3c;
        }

        /* Header Section */
        .header-section {
          background: rgba(255,255,255,0.95);
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          margin-bottom: 25px;
          border-left: 5px solid #f39c12;
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
          background: linear-gradient(135deg, #f39c12, #d35400);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: white;
          box-shadow: 0 8px 20px rgba(243, 156, 18, 0.3);
          animation: float 3s ease-in-out infinite;
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

        .btn-accent {
          background: linear-gradient(135deg, #9b59b6, #8e44ad);
          color: white;
          box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
        }

        .btn-accent:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(155, 89, 182, 0.4);
        }

        /* Stats Grid */
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
        }

        .stat-card:hover {
          transform: translateY(-5px);
          border-color: #f39c12;
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

        /* Pizzas Section */
        .pizzas-section {
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 25px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e9ecef;
        }

        .section-title h2 {
          color: #2c3e50;
          font-size: 1.8em;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pizza-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 25px;
          margin-top: 20px;
        }

        .pizza-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          transition: all 0.4s ease;
          border: 2px solid #f1f2f6;
          position: relative;
        }

        .pizza-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          border-color: #f39c12;
        }

        .card-image {
          height: 180px;
          background: linear-gradient(135deg, #f39c12, #e67e22);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pizza-emoji {
          font-size: 100px;
          animation: float 4s ease-in-out infinite;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
        }

        .card-badges {
          position: absolute;
          top: 15px;
          left: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          white-space: nowrap;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .badge.custom {
          background: rgba(243, 156, 18, 0.95);
          color: white;
        }

        .badge.status-badge {
          background: rgba(255,255,255,0.95);
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .badge.date {
          background: rgba(255,255,255,0.95);
          color: #2c3e50;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          font-size: 11px;
        }

        .badge.popularity {
          background: linear-gradient(135deg, rgba(255, 193, 7, 0.95), rgba(255, 152, 0, 0.95));
          color: white;
          position: absolute;
          top: 15px;
          right: 15px;
        }

        .card-content {
          padding: 25px;
          background: white;
        }

        .pizza-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .pizza-name {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
          margin: 0;
          flex: 1;
        }

        .pizza-price {
          font-size: 24px;
          font-weight: 700;
          color: #27ae60;
          margin-left: 15px;
        }

        .pizza-description {
          color: #7f8c8d;
          line-height: 1.6;
          margin-bottom: 20px;
          font-size: 15px;
          min-height: 60px;
        }

        .pizza-config {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .config-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .config-label {
          font-weight: 600;
          color: #2c3e50;
        }

        .config-value {
          color: #7f8c8d;
        }

        .ingredients {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }

        .ingredient-tag {
          background: #f1f2f6;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          color: #2c3e50;
          font-weight: 500;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 2px solid #f1f2f6;
          gap: 10px;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 14px;
        }

        /* Popularity Bar */
        .popularity-bar {
          margin-top: 10px;
        }

        .popularity-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 12px;
          color: #7f8c8d;
        }

        .popularity-progress {
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .popularity-fill {
          height: 100%;
          background: linear-gradient(90deg, #f39c12, #e74c3c);
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        /* Empty State */
        .empty-state {
          grid-column: 1 / -1;
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
          animation: float 3s ease-in-out infinite;
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

        /* Modal Edit */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          backdrop-filter: blur(10px);
          animation: fadeIn 0.3s ease;
        }

        .modal-container {
          background: white;
          border-radius: 24px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 40px 60px rgba(0,0,0,0.4);
          animation: slideIn 0.4s ease;
          border: 2px solid #e9ecef;
        }

        .modal-header {
          padding: 30px;
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          border-radius: 24px 24px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title h2 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .close-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 30px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #f39c12;
          box-shadow: 0 0 0 3px rgba(243, 156, 18, 0.1);
        }

        .form-textarea {
          min-height: 100px;
          resize: vertical;
        }

        .form-hint {
          margin-top: 6px;
          font-size: 14px;
          color: #7f8c8d;
        }

        .modal-footer {
          padding: 30px;
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          background: rgba(255,255,255,0.9);
          border-radius: 0 0 24px 24px;
          border-top: 2px solid #e9ecef;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .history-container {
            padding: 20px 10px;
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

          .pizza-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .card-footer {
            flex-direction: column;
            align-items: stretch;
          }

          .action-buttons {
            width: 100%;
            flex-direction: column;
          }

          .modal-container {
            max-height: 85vh;
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding: 20px;
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
          
          .card-badges {
            flex-direction: row;
            flex-wrap: wrap;
          }
          
          .badge {
            font-size: 10px;
            padding: 6px 12px;
          }
        }
      `}</style>

      <div className="history-container">
        <div className="background-overlay"></div>

        <div className="content-wrapper">
          {/* Message Alert */}
          {message && (
            <div className={`message-alert ${isError ? 'error' : 'success'}`}>
              <span>{isError ? '❌' : '✅'}</span>
              <span>{message}</span>
            </div>
          )}

          {/* Header Section */}
          <div className="header-section">
            <div className="header-top">
              <div className="user-info">
                <div className="user-avatar">
                  {user?.firstName?.[0] || '👋'}
                </div>
                <div className="user-details">
                  <h1>Vos Créations Personnalisées, {user?.firstName || 'Pizza Lover'} !</h1>
                  <p>Retrouvez et gérez toutes vos pizzas créées</p>
                </div>
              </div>
              
              <div className="header-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/')}
                >
                  <span>🏠</span>
                  <span>Accueil</span>
                </button>
                
                <button 
                  className="btn btn-success"
                  onClick={() => navigate('/cart')}
                >
                  <span>🛒</span>
                  <span>Panier</span>
                </button>
                
                <button 
                  className="btn btn-danger"
                  onClick={handleLogout}
                >
                  <span>🚪</span>
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{customPizzas.length}</div>
                <div className="stat-label">Pizzas créées</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">
                  {customPizzas.length > 0 
                    ? formatPrice(customPizzas.reduce((sum, pizza) => sum + pizza.basePrice, 0) / customPizzas.length)
                    : '0 DT'}
                </div>
                <div className="stat-label">Prix moyen</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">
                  {new Date().toLocaleDateString('fr-FR')}
                </div>
                <div className="stat-label">Dernière visite</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">🎨</div>
                <div className="stat-label">Vos créations</div>
              </div>
            </div>
          </div>

          {/* Pizzas Section */}
          <div className="pizzas-section">
            <div className="section-title">
              <h2>
                <span>📜</span>
                Historique de vos Pizzas Personnalisées ({customPizzas.length})
              </h2>
              <button 
                className="btn btn-warning"
                onClick={() => navigate('/')}
              >
                <span>🎨</span>
                <span>Créer une nouvelle pizza</span>
              </button>
            </div>
            
            <div className="pizza-grid">
              {customPizzas.length > 0 ? (
                customPizzas.map(pizza => (
                  <div 
                    key={pizza._id || pizza.customPizzaId || pizza.name} 
                    className="pizza-card"
                  >
                    <div className="card-image">
                      <div className="pizza-emoji">🍕</div>
                      
                      <div className="card-badges">
                        <div className="badge custom">
                          <span>🎨</span>
                          <span>Personnalisée</span>
                        </div>
                        {getStatusBadge(pizza)}
                        <div className="badge date">
                          <span>🔢</span>
                          <span>{getDisplayId(pizza)}</span>
                        </div>
                        <div className="badge popularity">
                          <span>{pizza.popularityIcon || '⭐'}</span>
                          <span>{pizza.popularityScore || 0}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <div className="pizza-header">
                        <h3 className="pizza-name">{pizza.name}</h3>
                        <div className="pizza-price">{formatPrice(pizza.basePrice)}</div>
                      </div>
                      
                      <p className="pizza-description">{pizza.description}</p>
                      
                      {/* Barre de popularité */}
                      <div className="popularity-bar">
                        <div className="popularity-label">
                          <span>Popularité</span>
                          <span>{pizza.popularityScore || 0}%</span>
                        </div>
                        <div className="popularity-progress">
                          <div 
                            className="popularity-fill" 
                            style={{ width: `${pizza.popularityScore || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {pizza.config && (
                        <div className="pizza-config">
                          <div className="config-item">
                            <span className="config-label">Taille :</span>
                            <span className="config-value">{getSizeName(pizza.config.size)}</span>
                          </div>
                          <div className="config-item">
                            <span className="config-label">Pâte :</span>
                            <span className="config-value">{getCrustName(pizza.config.crust)}</span>
                          </div>
                          {pizza.config.toppings && pizza.config.toppings.length > 0 && (
                            <div className="config-item">
                              <span className="config-label">Garnitures :</span>
                              <span className="config-value">{pizza.config.toppings.length}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {pizza.ingredients && pizza.ingredients.length > 0 && (
                        <div className="ingredients">
                          {pizza.ingredients.slice(0, 4).map((ingredient, index) => (
                            <span key={index} className="ingredient-tag">
                              {ingredient}
                            </span>
                          ))}
                          {pizza.ingredients.length > 4 && (
                            <span className="ingredient-tag">
                              +{pizza.ingredients.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="card-footer">
                        <div className="action-buttons">
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleOrderAgain(pizza)}
                          >
                            <span>🛒</span>
                            <span>Commander</span>
                          </button>
                          
                          <button 
                            className="btn btn-warning btn-sm"
                            onClick={() => handlePizzaClick(pizza)}
                          >
                            <span>✏️</span>
                            <span>Modifier</span>
                          </button>
                          
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(pizza)}
                          >
                            <span>🗑️</span>
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🎨</div>
                  <h3>Aucune pizza personnalisée</h3>
                  <p>
                    Vous n'avez pas encore créé de pizza personnalisée.<br />
                    Créez votre première pizza et elle apparaîtra ici !
                  </p>
                  <button 
                    className="btn btn-warning"
                    style={{ marginTop: '20px' }}
                    onClick={() => navigate('/')}
                  >
                    <span>🎨</span>
                    <span>Créer ma première pizza</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {configuratorOpen && selectedPizza && editMode && (
        <div className="modal-overlay" onClick={() => setConfiguratorOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>
                  <span>✏️</span>
                  Modifier {selectedPizza.name}
                </h2>
                <p>Mettez à jour les informations de votre pizza personnalisée</p>
              </div>
              <button 
                className="close-btn"
                onClick={() => {
                  setConfiguratorOpen(false);
                  setEditMode(false);
                  setSelectedPizza(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  <span>📝</span>
                  Nom de votre pizza
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  maxLength={50}
                />
                <div className="form-hint">
                  Donnez un nom unique à votre création ({editForm.name.length}/50 caractères)
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <span>💬</span>
                  Description
                </label>
                <textarea
                  className="form-input form-textarea"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  maxLength={200}
                />
                <div className="form-hint">
                  Décrivez votre création ({editForm.description.length}/200 caractères)
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <span>💰</span>
                  Prix (DT)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.basePrice}
                  onChange={(e) => setEditForm({...editForm, basePrice: parseFloat(e.target.value) || 0})}
                  min="0"
                  step="0.001"
                />
                <div className="form-hint">
                  Prix de votre pizza personnalisée
                </div>
              </div>
              
              <div style={{ 
                background: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '12px', 
                marginTop: '20px' 
              }}>
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>
                  <span>⚙️</span>
                  Configuration actuelle
                </h4>
                <div className="config-item">
                  <span className="config-label">Taille :</span>
                  <span className="config-value">{getSizeName(selectedPizza.config?.size)}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Pâte :</span>
                  <span className="config-value">{getCrustName(selectedPizza.config?.crust)}</span>
                </div>
                {selectedPizza.config?.toppings && selectedPizza.config.toppings.length > 0 && (
                  <div className="config-item">
                    <span className="config-label">Garnitures :</span>
                    <span className="config-value">{selectedPizza.config.toppings.length}</span>
                  </div>
                )}
                
                <h4 style={{ margin: '15px 0 10px 0', color: '#2c3e50' }}>
                  <span>📊</span>
                  Statistiques
                </h4>
                <div className="config-item">
                  <span className="config-label">ID :</span>
                  <span className="config-value">{getDisplayId(selectedPizza)}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Statut :</span>
                  <span className="config-value">{getPizzaStatus(selectedPizza)}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Score de popularité :</span>
                  <span className="config-value">{selectedPizza.popularityScore || 0}%</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-danger"
                onClick={() => {
                  setConfiguratorOpen(false);
                  setEditMode(false);
                  setSelectedPizza(null);
                }}
              >
                Annuler
              </button>
              
              <button 
                className="btn btn-success"
                onClick={handleEditSubmit}
                disabled={!editForm.name.trim()}
              >
                <span>💾</span>
                <span>Sauvegarder les modifications</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyCustomPizzas;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Orders from './Orders';

const Home = () => {
  const BACKEND_URL = "http://localhost:5004";
  const navigate = useNavigate();
  
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [user, setUser] = useState(userData);
  const [pizzas, setPizzas] = useState([]);
  const [favoritesIds, setFavoritesIds] = useState([]);
  const [favoritesDetails, setFavoritesDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPizza, setSelectedPizza] = useState(null);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [pizzaConfig, setPizzaConfig] = useState({
    size: 'medium',
    crust: 'thin',
    toppings: [],
    quantity: 1
  });

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Nouveaux états pour les pizzas personnalisées
  const [customPizzaName, setCustomPizzaName] = useState('');
  const [customPizzaDescription, setCustomPizzaDescription] = useState('');
  const [showCustomPizzaForm, setShowCustomPizzaForm] = useState(false);
  const [isCreatingCustomPizza, setIsCreatingCustomPizza] = useState(false);
  const [customPizzasCount, setCustomPizzasCount] = useState(0);

  // Options pour la personnalisation
  const sizes = [
    { id: 'small', name: 'Petite', price: 2, icon: '🟢', description: '25cm - 1-2 personnes' },
    { id: 'medium', name: 'Moyenne', price: 4, icon: '🟡', description: '30cm - 2-3 personnes' },
    { id: 'large', name: 'Grande', price: 6, icon: '🔴', description: '35cm - 3-4 personnes' }
  ];

  const crusts = [
    { id: 'thin', name: 'Fine', price: 0, icon: '🥨', description: 'Croustillante et légère' },
    { id: 'pan', name: 'Épaisse', price: 1, icon: '🥞', description: 'Moelleuse et généreuse' },
    { id: 'stuffed', name: 'Fourrée', price: 2, icon: '🥟', description: 'Bordure garnie de fromage' }
  ];

  const toppingsList = [
    { id: 'pepperoni', name: 'Pepperoni', price: 1.5, icon: '🍖', category: 'viande', spicy: true },
    { id: 'mushrooms', name: 'Champignons', price: 1, icon: '🍄', category: 'légumes' },
    { id: 'onions', name: 'Oignons', price: 0.8, icon: '🧅', category: 'légumes' },
    { id: 'sausage', name: 'Saucisse', price: 2, icon: '🌭', category: 'viande' },
    { id: 'bacon', name: 'Bacon', price: 2.5, icon: '🥓', category: 'viande' },
    { id: 'extra_cheese', name: 'Extra fromage', price: 1.8, icon: '🧀', category: 'fromage' },
    { id: 'peppers', name: 'Poivrons', price: 1, icon: '🫑', category: 'légumes' },
    { id: 'olives', name: 'Olives', price: 0.8, icon: '🫒', category: 'légumes' },
    { id: 'pineapple', name: 'Ananas', price: 1.2, icon: '🍍', category: 'fruits' },
    { id: 'spinach', name: 'Épinards', price: 1, icon: '🥬', category: 'légumes' },
    { id: 'jalapeno', name: 'Jalapeño', price: 1.2, icon: '🌶️', category: 'épicé' },
    { id: 'anchovies', name: 'Anchois', price: 2, icon: '🐟', category: 'poisson' }
  ];

  const categories = [
    { id: 'all', name: 'Toutes', icon: '🍕', color: '#e74c3c' },
    { id: 'favorites', name: 'Favoris', icon: '❤️', color: '#e74c3c' },
    { id: 'vegetarian', name: 'Végétariennes', icon: '🌱', color: '#27ae60' },
    { id: 'spicy', name: 'Épicées', icon: '🌶️', color: '#e74c3c' },
    { id: 'special', name: 'Spéciales', icon: '✨', color: '#9b59b6' },
    { id: 'classic', name: 'Classiques', icon: '⭐', color: '#3498db' },
    { id: 'custom', name: 'Personnalisée', icon: '🎨', color: '#f39c12' }
  ];

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchUserData();
    fetchPizzas();
    fetchCartCount();
    fetchFavoritesIds();
    fetchCustomPizzasCount();
  }, []);

  useEffect(() => {
    // Charger les détails des favoris si on a des IDs
    if (favoritesIds.length > 0) {
      fetchFavoritesDetails();
    } else {
      setFavoritesDetails([]);
    }
  }, [favoritesIds]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const fetchPizzas = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des pizzas depuis la base de données...');
      
      const response = await axios.get(`${BACKEND_URL}/api/pizzas`);
      
      if (response.data.success) {
        console.log('✅ Pizzas chargées:', response.data.pizzas.length);
        
        const formattedPizzas = response.data.pizzas.map(pizza => ({
          _id: pizza.id,
          name: pizza.name,
          description: pizza.description,
          basePrice: pizza.basePrice,
          category: pizza.category,
          ingredients: pizza.ingredients || [],
          isAvailable: pizza.isAvailable,
          isCustom: pizza.isCustom || false,
          customConfig: pizza.customConfig || null,
          tags: getTagsFromCategory(pizza.category),
          popularity: pizza.popularity || 100,
          popular: pizza.popularity > 100
        }));
        
        setPizzas(formattedPizzas);
      } else {
        console.error('❌ Réponse API non réussie:', response.data);
        setMessage('❌ Erreur lors du chargement des pizzas');
        setIsError(true);
      }
    } catch (error) {
      console.error('❌ Erreur fetchPizzas:', error);
      setIsError(true);
      setMessage('❌ Impossible de charger les pizzas. Vérifiez la connexion au serveur.');
      setPizzas([]);
    } finally {
      setLoading(false);
    }
  };

  const getTagsFromCategory = (category) => {
    switch(category) {
      case 'vegetarian': return ['vegetarian'];
      case 'spicy': return ['spicy'];
      case 'special': return ['special'];
      case 'classic': return ['classic'];
      case 'custom': return ['custom'];
      default: return [category];
    }
  };

  const fetchFavoritesIds = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/user/favorites/ids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        console.log('✅ IDs favoris chargés:', response.data.favorites);
        setFavoritesIds(response.data.favorites || []);
      }
    } catch (error) {
      console.error('❌ Erreur fetchFavoritesIds, essai avec endpoint complet:', error);
      
      // Fallback: utiliser l'endpoint complet
      try {
        const fullResponse = await axios.get(`${BACKEND_URL}/api/user/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (fullResponse.data.success) {
          const ids = fullResponse.data.favorites?.map(p => p._id) || [];
          console.log('✅ Favoris chargés (format complet):', ids);
          setFavoritesIds(ids);
        }
      } catch (fallbackError) {
        console.error('❌ Erreur fallback fetchFavoritesIds:', fallbackError);
        setFavoritesIds([]);
      }
    }
  };

  const fetchFavoritesDetails = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/user/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        console.log('✅ Détails favoris chargés:', response.data.favorites);
        setFavoritesDetails(response.data.favorites || []);
      }
    } catch (error) {
      console.error('❌ Erreur fetchFavoritesDetails:', error);
      setFavoritesDetails([]);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/cart/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const count = response.data.itemCount || 0;
        console.log('✅ Nombre d\'articles dans le panier:', count);
        setCartCount(count);
      }
    } catch (error) {
      console.error('❌ Erreur récupération panier:', error);
      // Si erreur 404 (panier vide), mettre à 0
      if (error.response?.status === 404) {
        setCartCount(0);
      } else {
        setCartCount(0);
      }
    }
  };

  const fetchCustomPizzasCount = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/custom-pizzas/my-pizzas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCustomPizzasCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('❌ Erreur récupération pizzas personnalisées:', error);
      setCustomPizzasCount(0);
    }
  };

  const toggleFavorite = async (pizzaId, e) => {
    if (e) e.stopPropagation();
    
    if (!token) {
      setIsError(true);
      setMessage('🔐 Connectez-vous pour ajouter des favoris');
      setTimeout(() => setMessage(''), 3000);
      navigate('/login');
      return;
    }

    try {
      const isCurrentlyFavorite = favoritesIds.includes(pizzaId);
      
      if (isCurrentlyFavorite) {
        await axios.delete(`${BACKEND_URL}/api/user/favorites/${pizzaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavoritesIds(prev => prev.filter(id => id !== pizzaId));
        setIsError(false);
        setMessage('💔 Retiré des favoris');
      } else {
        await axios.post(`${BACKEND_URL}/api/user/favorites/${pizzaId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavoritesIds(prev => [...prev, pizzaId]);
        setIsError(false);
        setMessage('❤️ Ajouté aux favoris');
      }
      
      // Recharger les détails des favoris
      if (favoritesIds.length > 0 || !isCurrentlyFavorite) {
        fetchFavoritesDetails();
      }
      
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('❌ Erreur toggleFavorite:', error);
      setIsError(true);
      setMessage('❌ Erreur lors de la mise à jour des favoris');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handlePizzaClick = (pizza) => {
    setSelectedPizza(pizza);
    setConfiguratorOpen(true);
    
    // Si c'est une pizza personnalisée, charger sa configuration
    if (pizza.isCustom && pizza.customConfig) {
      setPizzaConfig({
        size: pizza.customConfig.size || 'medium',
        crust: pizza.customConfig.crust || 'thin',
        toppings: pizza.customConfig.toppings || [],
        quantity: 1
      });
      setIsCreatingCustomPizza(false);
    } else {
      setPizzaConfig({
        size: 'medium',
        crust: 'thin',
        toppings: [],
        quantity: 1
      });
      
      if (pizza._id === 'custom' || pizza._id === 'surprise') {
        setIsCreatingCustomPizza(true);
      } else {
        setIsCreatingCustomPizza(false);
      }
    }
  };

  const handleSizeChange = (size) => {
    setPizzaConfig(prev => ({ ...prev, size }));
  };

  const handleCrustChange = (crust) => {
    setPizzaConfig(prev => ({ ...prev, crust }));
  };

  const handleToppingToggle = (toppingId) => {
    setPizzaConfig(prev => {
      if (prev.toppings.length >= 8 && !prev.toppings.includes(toppingId)) {
        setIsError(true);
        setMessage('❌ Maximum 8 garnitures autorisées');
        setTimeout(() => setMessage(''), 2000);
        return prev;
      }
      
      if (prev.toppings.includes(toppingId)) {
        return { ...prev, toppings: prev.toppings.filter(id => id !== toppingId) };
      } else {
        return { ...prev, toppings: [...prev.toppings, toppingId] };
      }
    });
  };

  const handleQuantityChange = (delta) => {
    setPizzaConfig(prev => ({
      ...prev,
      quantity: Math.max(1, Math.min(10, prev.quantity + delta))
    }));
  };

  const calculateTotal = () => {
    if (!selectedPizza) return 0;
    
    let total = selectedPizza.basePrice || 0;
    
    const sizeObj = sizes.find(s => s.id === pizzaConfig.size);
    if (sizeObj) total += sizeObj.price;
    
    const crustObj = crusts.find(c => c.id === pizzaConfig.crust);
    if (crustObj) total += crustObj.price;
    
    pizzaConfig.toppings.forEach(toppingId => {
      const topping = toppingsList.find(t => t.id === toppingId);
      if (topping) total += topping.price;
    });
    
    total *= pizzaConfig.quantity;
    
    return total.toFixed(2);
  };

  // Dans Home.js - MODIFIER LA FONCTION addToCart
  const addToCart = async () => {
    if (!selectedPizza) {
      setIsError(true);
      setMessage('❌ Aucune pizza sélectionnée');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const order = {
        pizzaId: selectedPizza._id,
        pizzaName: isCreatingCustomPizza ? customPizzaName : selectedPizza.name,
        config: {
          size: pizzaConfig.size,
          crust: pizzaConfig.crust,
          toppings: pizzaConfig.toppings,
          quantity: pizzaConfig.quantity
        },
        totalPrice: parseFloat(calculateTotal()),
        isCustom: isCreatingCustomPizza || selectedPizza.isCustom || selectedPizza._id === 'custom' || selectedPizza._id === 'surprise',
        customDescription: isCreatingCustomPizza ? customPizzaDescription : selectedPizza.description
      };

      console.log('📤 Envoi de la commande:', order);

      const response = await axios.post(`${BACKEND_URL}/api/cart/add`, order, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const newCount = response.data.cart?.itemCount || response.data.cart?.count || 0;
        setCartCount(newCount);
        
        setIsError(false);
        setMessage(`🎉 ${isCreatingCustomPizza ? 'Pizza personnalisée' : selectedPizza.name} ajoutée au panier !`);
        
        setTimeout(() => {
          setMessage('');
          setConfiguratorOpen(false);
          setSelectedPizza(null);
          setCustomPizzaName('');
          setCustomPizzaDescription('');
          setIsCreatingCustomPizza(false);
        }, 2000);
      } else {
        setIsError(true);
        setMessage('❌ Erreur lors de l\'ajout au panier');
      }
      
    } catch (error) {
      console.error('❌ Erreur addToCart:', error);
      setIsError(true);
      
      if (error.response?.status === 400) {
        setMessage('❌ Données invalides pour le panier');
      } else if (error.response?.status === 401) {
        setMessage('🔐 Session expirée, reconnectez-vous');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }, 2000);
      } else if (error.response?.status === 404) {
        setMessage('❌ Pizza non trouvée');
      } else {
        setMessage('❌ Erreur lors de l\'ajout au panier');
      }
      
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'vegetarian': return '🌱';
      case 'spicy': return '🌶️';
      case 'special': return '✨';
      case 'classic': return '⭐';
      case 'custom': return '🎨';
      default: return '🍕';
    }
  };

  const getCategoryName = (category) => {
    switch(category) {
      case 'vegetarian': return 'Végétarienne';
      case 'spicy': return 'Épicée';
      case 'special': return 'Spéciale';
      case 'classic': return 'Classique';
      case 'custom': return 'Personnalisée';
      default: return 'Classique';
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'vegetarian': return '#27ae60';
      case 'spicy': return '#e74c3c';
      case 'special': return '#9b59b6';
      case 'classic': return '#3498db';
      case 'custom': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  // Fonction pour rafraîchir les données
  const refreshData = () => {
    fetchPizzas();
    fetchFavoritesIds();
    fetchCartCount();
    fetchCustomPizzasCount();
    setIsError(false);
    setMessage('🔄 Données rafraîchies avec succès !');
    setTimeout(() => setMessage(''), 3000);
  };

  // Fonction pour basculer l'affichage des favoris
  const toggleFavoritesView = () => {
    if (activeCategory === 'favorites') {
      setActiveCategory('all');
      setShowFavoritesOnly(false);
    } else {
      setActiveCategory('favorites');
      setShowFavoritesOnly(true);
      if (favoritesIds.length === 0) {
        setIsError(true);
        setMessage('⭐ Vous n\'avez pas encore de pizzas favorites');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  // Fonction pour créer une pizza surprise
  const createSurprisePizza = () => {
    const randomSize = sizes[Math.floor(Math.random() * sizes.length)].id;
    const randomCrust = crusts[Math.floor(Math.random() * crusts.length)].id;
    
    // Sélectionner 3 à 5 garnitures aléatoires
    const randomToppings = [];
    const numberOfToppings = Math.floor(Math.random() * 3) + 3; // 3 à 5 garnitures
    const availableToppings = [...toppingsList];
    
    for (let i = 0; i < numberOfToppings; i++) {
      if (availableToppings.length === 0) break;
      const randomIndex = Math.floor(Math.random() * availableToppings.length);
      randomToppings.push(availableToppings[randomIndex].id);
      availableToppings.splice(randomIndex, 1);
    }
    
    const surprisePizza = {
      _id: 'surprise',
      name: 'Pizza Surprise 🎲',
      description: 'Une création unique avec une sélection aléatoire de nos meilleurs ingrédients !',
      basePrice: 12.99,
      category: 'special',
      ingredients: ['Création aléatoire', 'Sélection du chef'],
      isAvailable: true,
      tags: ['surprise', 'special', 'random'],
      popular: true,
      isCustom: true
    };
    
    setSelectedPizza(surprisePizza);
    setPizzaConfig({
      size: randomSize,
      crust: randomCrust,
      toppings: randomToppings,
      quantity: 1
    });
    setConfiguratorOpen(true);
    setIsCreatingCustomPizza(true);
    setCustomPizzaName('Pizza Surprise');
    setCustomPizzaDescription('Une création unique aléatoire !');
    
    setIsError(false);
    setMessage('🎲 Pizza surprise créée ! Personnalisez-la si vous le souhaitez.');
    setTimeout(() => setMessage(''), 3000);
  };

  // Fonction pour créer une nouvelle pizza personnalisée
  const createCustomPizza = () => {
    const customPizza = {
      _id: 'custom',
      name: 'Pizza Personnalisée 🎨',
      description: 'Créez votre propre pizza avec vos ingrédients préférés',
      basePrice: 8.99, // Prix de base pour une pizza personnalisée
      category: 'custom',
      ingredients: ['Votre sélection'],
      isAvailable: true,
      tags: ['custom', 'personalized'],
      popular: false,
      isCustom: true
    };
    
    setSelectedPizza(customPizza);
    setConfiguratorOpen(true);
    setIsCreatingCustomPizza(true);
    setCustomPizzaName('');
    setCustomPizzaDescription('');
  };

  // Fonction pour sauvegarder une pizza personnalisée comme nouvelle pizza
  const saveCustomPizza = async () => {
    if (!customPizzaName.trim()) {
      setIsError(true);
      setMessage('❌ Veuillez donner un nom à votre pizza');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (customPizzaName.length < 3) {
      setIsError(true);
      setMessage('❌ Le nom doit contenir au moins 3 caractères');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const pizzaData = {
        name: customPizzaName,
        description: customPizzaDescription || 'Ma création personnalisée',
        basePrice: parseFloat(calculateTotal()),
        ingredients: pizzaConfig.toppings.map(toppingId => {
          const topping = toppingsList.find(t => t.id === toppingId);
          return topping ? topping.name : toppingId;
        }),
        config: {
          size: pizzaConfig.size,
          crust: pizzaConfig.crust,
          toppings: pizzaConfig.toppings
        },
        category: 'custom'
      };

      // Utiliser le nouvel endpoint
      const response = await axios.post(`${BACKEND_URL}/api/custom-pizzas/create`, pizzaData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setIsError(false);
        setMessage('✅ Pizza personnalisée sauvegardée avec succès !');
        
        // Rafraîchir la liste des pizzas et le compteur
        fetchPizzas();
        fetchCustomPizzasCount();
        
        setTimeout(() => {
          setMessage('');
          setConfiguratorOpen(false);
          setSelectedPizza(null);
          setCustomPizzaName('');
          setCustomPizzaDescription('');
          setIsCreatingCustomPizza(false);
        }, 2000);
      } else {
        setIsError(true);
        setMessage('❌ Erreur lors de la sauvegarde');
      }
      
    } catch (error) {
      console.error('❌ Erreur saveCustomPizza:', error);
      setIsError(true);
      
      if (error.response?.status === 400) {
        if (error.response.data.errors) {
          setMessage(`❌ ${error.response.data.errors[0]}`);
        } else {
          setMessage(`❌ ${error.response.data.message || 'Données invalides'}`);
        }
      } else if (error.response?.status === 409) {
        setMessage('❌ Vous avez déjà une pizza avec ce nom');
      } else {
        setMessage('❌ Erreur lors de la sauvegarde de la pizza');
      }
      
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Fonction pour naviguer vers la page historique
  const navigateToHistory = () => {
    navigate('/my-custom-pizzas');
  };

  // Fonction pour naviguer vers la page des pizzas personnalisées
  const navigateToCustomPizzas = () => {
    navigate('/my-custom-pizzas');
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
        Chargement des pizzas...
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
          0% { transform: translateY(-100px) rotate(0deg); }
          100% { transform: translateY(100vh) rotate(360deg); }
        }

        /* Home Container avec fond style Profile */
        .home-container {
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
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(8px);
          z-index: 1;
        }

        .content-wrapper {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1400px;
        }

        /* Header Section */
        .header-section {
          background: rgba(255,255,255,0.95);
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          margin-bottom: 25px;
          border-left: 5px solid #e74c3c;
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
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: white;
          box-shadow: 0 8px 20px rgba(231, 76, 60, 0.3);
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

        .btn-accent {
          background: linear-gradient(135deg, #9b59b6, #8e44ad);
          color: white;
          box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
        }

        .btn-accent:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(155, 89, 182, 0.4);
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

        .btn-magical {
          background: linear-gradient(135deg, #FF6B9D, #C779D0, #4BC0C8);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
          animation: pulse 2s infinite;
        }

        .btn-magical:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 107, 157, 0.4);
          animation: none;
        }

        .btn-history {
          background: linear-gradient(135deg, #8e44ad, #9b59b6);
          color: white;
          box-shadow: 0 4px 12px rgba(142, 68, 173, 0.3);
        }

        .btn-history:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(142, 68, 173, 0.4);
        }

        .btn-custom {
          background: linear-gradient(135deg, #f39c12, #d35400);
          color: white;
          box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
        }

        .btn-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(243, 156, 18, 0.4);
        }

        .cart-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #e74c3c;
          color: white;
          font-size: 12px;
          font-weight: bold;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
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
        }

        .stat-card:hover {
          transform: translateY(-5px);
          border-color: #e74c3c;
          box-shadow: 0 12px 30px rgba(0,0,0,0.15);
        }

        .stat-value {
          font-size: 2.5em;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 5px;
          text-align: center;
        }

        .stat-label {
          color: #7f8c8d;
          font-size: 0.9em;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-align: center;
          font-weight: 600;
        }

        /* Creation Actions */
        .creation-actions {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }

        .creation-btn {
          flex: 1;
          min-width: 250px;
        }

        /* Search Section */
        .search-section {
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 25px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .search-container {
          position: relative;
          margin-bottom: 20px;
        }

        .search-input {
          width: 100%;
          padding: 16px 24px;
          padding-left: 60px;
          border-radius: 12px;
          border: 2px solid #e8eeef;
          font-size: 16px;
          background: rgba(255,255,255,0.9);
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #e74c3c;
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 24px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
          color: #7f8c8d;
        }

        /* Categories Section */
        .categories-section {
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

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
        }

        .category-card {
          background: rgba(255,255,255,0.9);
          border-radius: 16px;
          padding: 25px 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          border: 2px solid transparent;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }

        .category-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }

        .category-card.active {
          border-color: currentColor;
          background: linear-gradient(135deg, currentColor, rgba(255,255,255,0.9));
        }

        .category-card.active .category-icon,
        .category-card.active .category-name {
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .category-icon {
          font-size: 40px;
          margin-bottom: 15px;
          display: block;
          animation: float 2s ease-in-out infinite;
          transition: all 0.3s ease;
        }

        .category-name {
          font-size: 16px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 5px;
          transition: all 0.3s ease;
        }

        .category-count {
          font-size: 12px;
          color: #7f8c8d;
          font-weight: 600;
          background: rgba(0,0,0,0.05);
          padding: 3px 8px;
          border-radius: 10px;
          display: inline-block;
          transition: all 0.3s ease;
        }

        .category-card.active .category-count {
          background: rgba(255,255,255,0.2);
          color: white;
        }

        /* Favorites Highlight */
        .favorites-highlight {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #e74c3c;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        /* Pizzas Section */
        .pizzas-section {
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 25px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .pizza-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 25px;
          margin-top: 20px;
        }

        .pizza-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          transition: all 0.4s ease;
          cursor: pointer;
          position: relative;
          border: 2px solid #f1f2f6;
        }

        .pizza-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          border-color: #e74c3c;
        }

        .card-image {
          height: 220px;
          background: linear-gradient(135deg, #f39c12, #e74c3c);
          position: relative;
          overflow: hidden;
        }

        .pizza-emoji {
          font-size: 120px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
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
          backdropFilter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          animation: slideIn 0.5s ease;
        }

        .badge.popular {
          background: rgba(231, 76, 60, 0.95);
          color: white;
        }

        .badge.category {
          background: rgba(255,255,255,0.95);
          color: #2c3e50;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .badge.custom {
          background: rgba(243, 156, 18, 0.95);
          color: white;
        }

        .favorite-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(255,255,255,0.95);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          z-index: 2;
        }

        .favorite-btn:hover {
          transform: scale(1.2) rotate(10deg);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }

        .favorite-btn.active {
          background: #e74c3c;
          color: white;
          animation: pulse 0.5s ease;
        }

        .card-content {
          padding: 25px;
          background: white;
        }

        .pizza-name {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 10px;
          color: #2c3e50;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pizza-description {
          color: #7f8c8d;
          line-height: 1.6;
          margin-bottom: 20px;
          font-size: 15px;
          min-height: 60px;
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
          transition: all 0.3s ease;
        }

        .ingredient-tag:hover {
          background: #e74c3c;
          color: white;
          transform: translateY(-2px);
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 2px solid #f1f2f6;
        }

        .price-info {
          display: flex;
          flex-direction: column;
        }

        .price-label {
          font-size: 12px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .price {
          font-size: 32px;
          font-weight: 700;
          color: #27ae60;
        }

        .customize-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
        }

        .customize-btn:hover {
          transform: translateX(5px);
          box-shadow: 0 8px 20px rgba(231, 76, 60, 0.4);
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

        .message-alert.info {
          background: linear-gradient(135deg, rgba(52, 152, 219, 0.95), rgba(41, 128, 185, 0.95));
          color: white;
          border-color: #3498db;
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

        /* Refresh Button */
        .refresh-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          border: none;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(52, 152, 219, 0.4);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .refresh-btn:hover {
          transform: rotate(180deg) scale(1.1);
          box-shadow: 0 15px 40px rgba(52, 152, 219, 0.6);
        }

        /* Modal Configurator */
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
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 40px 60px rgba(0,0,0,0.4);
          animation: slideIn 0.4s ease;
          border: 2px solid #e9ecef;
        }

        .modal-header {
          padding: 30px;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
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

        .modal-title p {
          opacity: 0.9;
          font-size: 16px;
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

        /* Custom Pizza Form */
        .custom-pizza-form {
          background: rgba(243, 156, 18, 0.05);
          border: 2px solid #f39c12;
          border-radius: 16px;
          padding: 25px;
          margin-bottom: 30px;
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

        .option-section {
          margin-bottom: 40px;
        }

        .section-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e9ecef;
        }

        .section-label h3 {
          font-size: 22px;
          font-weight: 700;
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .option-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .option-card {
          border: 2px solid #e9ecef;
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(255,255,255,0.9);
        }

        .option-card:hover {
          border-color: #3498db;
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(52, 152, 219, 0.1);
        }

        .option-card.selected {
          border-color: #27ae60;
          background: rgba(39, 174, 96, 0.05);
          box-shadow: 0 10px 25px rgba(39, 174, 96, 0.1);
        }

        .option-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 10px;
        }

        .option-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .option-info h4 {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .option-price {
          font-size: 20px;
          font-weight: 700;
          color: #27ae60;
        }

        .option-description {
          color: #7f8c8d;
          font-size: 14px;
          line-height: 1.5;
        }

        /* Toppings */
        .toppings-filter {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .topping-filter-btn {
          padding: 10px 20px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          background: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .topping-filter-btn:hover {
          border-color: #3498db;
        }

        .topping-filter-btn.active {
          background: #3498db;
          color: white;
          border-color: #3498db;
        }

        .toppings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 15px;
        }

        .topping-card {
          border: 2px solid #e9ecef;
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
          display: flex;
          align-items: center;
          gap: 15px;
          position: relative;
        }

        .topping-card:hover {
          border-color: #3498db;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .topping-card.selected {
          border-color: #27ae60;
          background: rgba(39, 174, 96, 0.05);
        }

        .topping-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .topping-info {
          flex: 1;
        }

        .topping-info h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 5px;
          color: #2c3e50;
        }

        .topping-price {
          font-size: 16px;
          font-weight: 700;
          color: #27ae60;
        }

        .topping-category {
          font-size: 12px;
          color: #7f8c8d;
          background: #f1f2f6;
          padding: 3px 8px;
          border-radius: 10px;
          display: inline-block;
          margin-top: 5px;
        }

        .topping-selector {
          width: 24px;
          height: 24px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          color: #7f8c8d;
          transition: all 0.3s ease;
        }

        .topping-card.selected .topping-selector {
          background: #27ae60;
          border-color: #27ae60;
          color: white;
        }

        /* Quantity */
        .quantity-section {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 20px;
          background: rgba(255,255,255,0.9);
          border-radius: 16px;
          padding: 15px;
          border: 2px solid #e9ecef;
        }

        .qty-btn {
          width: 44px;
          height: 44px;
          border: none;
          background: white;
          border-radius: 12px;
          font-size: 24px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          color: #2c3e50;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .qty-btn:hover {
          background: #f1f2f6;
          transform: scale(1.1);
        }

        .qty-value {
          font-size: 28px;
          font-weight: 700;
          min-width: 50px;
          text-align: center;
          color: #2c3e50;
        }

        /* Summary */
        .summary-section {
          background: rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 30px;
          margin-top: 30px;
          border: 2px solid #e9ecef;
        }

        .summary-section h3 {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .summary-list {
          margin-top: 20px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e9ecef;
          font-size: 16px;
          color: #2c3e50;
        }

        .summary-item:last-child {
          border-bottom: none;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          padding: 20px 0;
          margin-top: 15px;
          font-size: 28px;
          font-weight: 700;
          color: #2c3e50;
          border-top: 3px solid #e9ecef;
        }

        .total-amount {
          color: #27ae60;
          font-size: 32px;
        }

        .modal-footer {
          padding: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.9);
          border-radius: 0 0 24px 24px;
          border-top: 2px solid #e9ecef;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .home-container {
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

          .creation-actions {
            flex-direction: column;
          }

          .creation-btn {
            min-width: 100%;
          }

          .categories-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .pizza-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .modal-container {
            max-height: 85vh;
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding: 20px;
          }

          .modal-footer {
            flex-direction: column;
            gap: 15px;
          }

          .modal-footer .btn {
            width: 100%;
          }

          .option-grid,
          .toppings-grid {
            grid-template-columns: 1fr;
          }

          .refresh-btn {
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .categories-grid {
            grid-template-columns: repeat(2, 1fr);
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
        }
      `}</style>

      <div className="home-container">
        <div className="background-overlay"></div>

        <div className="content-wrapper">
          {/* Message Alert */}
          {message && (
            <div className={`message-alert ${isError ? 'error' : 'success'}`}>
              <span>{isError ? '❌' : '✅'}</span>
              <span>{message}</span>
            </div>
          )}

          {/* Bouton de rafraîchissement */}
          <button className="refresh-btn" onClick={refreshData} title="Rafraîchir les données">
            🔄
          </button>

          {/* Header Section */}
          <div className="header-section">
            <div className="header-top">
              <div className="user-info">
                <div className="user-avatar">
                  {user?.firstName?.[0] || '👋'}
                </div>
                <div className="user-details">
                  <h1>Bonjour, {user?.firstName || 'Pizza Lover'} !</h1>
                  <p>Prêt à commander votre prochaine pizza ?</p>
                </div>
              </div>
              
              <div className="header-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/profile')}
                >
                  <span>👤</span>
                  <span>Profil</span>
                </button>
                
                <button 
                  className="btn btn-success"
                  onClick={() => navigate('/Cart')}
                  style={{ position: 'relative' }}
                >
                  <span>🛒</span>
                  <span>Panier</span>
                  {cartCount > 0 && (
                    <span className="cart-badge">{cartCount}</span>
                  )}
                </button>
                
                {/* Bouton Historique (nouveau) */}
                <button 
                  className="btn btn-history"
                  onClick={() => navigate('/orders')}
                >
                  <span>📜</span>
                  <span>Historique</span>
                </button>
                
                {/* Ajout du bouton Mes Créations */}
                <button 
                  className="btn btn-custom"
                  onClick={navigateToCustomPizzas}
                >
                  <span>🎨</span>
                  <span>Mes Créations ({customPizzasCount})</span>
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
            
            <div className="creation-actions">
              <button 
                className="btn btn-warning creation-btn"
                onClick={createCustomPizza}
              >
                <span>🎨</span>
                <span>Créer une pizza personnalisée</span>
              </button>
              
              <button 
                className="btn btn-magical creation-btn"
                onClick={createSurprisePizza}
              >
                <span>🎲</span>
                <span>Pizza surprise !</span>
              </button>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{pizzas.length}</div>
                <div className="stat-label">Pizzas disponibles</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{favoritesIds.length}</div>
                <div className="stat-label">Pizzas favorites</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{cartCount}</div>
                <div className="stat-label">Articles dans le panier</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{customPizzasCount}</div>
                <div className="stat-label">Pizzas personnalisées</div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <div className="search-container">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher une pizza, un ingrédient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Categories Section */}
          <div className="categories-section">
            <div className="section-title">
              <h2>
                <span>🏷️</span>
                Catégories
              </h2>
              <button 
                className={`btn ${activeCategory === 'favorites' ? 'btn-danger' : 'btn-accent'}`}
                onClick={toggleFavoritesView}
              >
                {activeCategory === 'favorites' ? (
                  <>
                    <span>❤️</span>
                    <span>Voir toutes ({favoritesIds.length})</span>
                  </>
                ) : (
                  <>
                    <span>🤍</span>
                    <span>Mes Favoris ({favoritesIds.length})</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="categories-grid">
              {categories.map(category => (
                <div
                  key={category.id}
                  className={`category-card ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => {
                    if (category.id === 'favorites') {
                      toggleFavoritesView();
                    } else {
                      setActiveCategory(category.id);
                      setShowFavoritesOnly(false);
                    }
                  }}
                  style={{ 
                    color: category.color,
                    borderColor: activeCategory === category.id ? category.color : 'transparent'
                  }}
                >
                  {category.id === 'favorites' && favoritesIds.length > 0 && (
                    <div className="favorites-highlight">
                      {favoritesIds.length}
                    </div>
                  )}
                  
                  <span className="category-icon">{category.icon}</span>
                  <div className="category-name">{category.name}</div>
                  <div className="category-count">
                    {category.id === 'all' && pizzas.length}
                    {category.id === 'favorites' && favoritesIds.length}
                    {category.id === 'vegetarian' && pizzas.filter(p => p.category === 'vegetarian').length}
                    {category.id === 'spicy' && pizzas.filter(p => p.category === 'spicy').length}
                    {category.id === 'special' && pizzas.filter(p => p.category === 'special').length}
                    {category.id === 'classic' && pizzas.filter(p => p.category === 'classic').length}
                    {category.id === 'custom' && pizzas.filter(p => p.category === 'custom').length}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pizzas Section */}
          <div className="pizzas-section">
            <div className="section-title">
              <div>
                <h2>
                  {activeCategory === 'favorites' ? '❤️' : '🍕'}
                  {activeCategory === 'favorites' ? ' Mes Pizzas Favorites' : ' Notre Carte des Pizzas'}
                </h2>
                <p>
                  {activeCategory === 'favorites' 
                    ? `${favoritesDetails.length} pizza${favoritesDetails.length !== 1 ? 's' : ''} favorite${favoritesDetails.length !== 1 ? 's' : ''}`
                    : `${pizzas.filter(pizza => {
                        if (activeCategory === 'all') return true;
                        if (activeCategory === 'vegetarian') return pizza.category === 'vegetarian';
                        if (activeCategory === 'spicy') return pizza.category === 'spicy';
                        if (activeCategory === 'special') return pizza.category === 'special';
                        if (activeCategory === 'classic') return pizza.category === 'classic';
                        if (activeCategory === 'custom') return pizza.category === 'custom';
                        return false;
                      }).filter(pizza => {
                        if (!searchTerm) return true;
                        const term = searchTerm.toLowerCase();
                        return (
                          pizza.name.toLowerCase().includes(term) ||
                          pizza.description.toLowerCase().includes(term) ||
                          pizza.ingredients?.some(ing => ing.toLowerCase().includes(term))
                        );
                      }).length} pizza${pizzas.filter(pizza => {
                        if (activeCategory === 'all') return true;
                        if (activeCategory === 'vegetarian') return pizza.category === 'vegetarian';
                        if (activeCategory === 'spicy') return pizza.category === 'spicy';
                        if (activeCategory === 'special') return pizza.category === 'special';
                        if (activeCategory === 'classic') return pizza.category === 'classic';
                        if (activeCategory === 'custom') return pizza.category === 'custom';
                        return false;
                      }).filter(pizza => {
                        if (!searchTerm) return true;
                        const term = searchTerm.toLowerCase();
                        return (
                          pizza.name.toLowerCase().includes(term) ||
                          pizza.description.toLowerCase().includes(term) ||
                          pizza.ingredients?.some(ing => ing.toLowerCase().includes(term))
                        );
                      }).length !== 1 ? 's' : ''} disponible${pizzas.filter(pizza => {
                        if (activeCategory === 'all') return true;
                        if (activeCategory === 'vegetarian') return pizza.category === 'vegetarian';
                        if (activeCategory === 'spicy') return pizza.category === 'spicy';
                        if (activeCategory === 'special') return pizza.category === 'special';
                        if (activeCategory === 'classic') return pizza.category === 'classic';
                        if (activeCategory === 'custom') return pizza.category === 'custom';
                        return false;
                      }).filter(pizza => {
                        if (!searchTerm) return true;
                        const term = searchTerm.toLowerCase();
                        return (
                          pizza.name.toLowerCase().includes(term) ||
                          pizza.description.toLowerCase().includes(term) ||
                          pizza.ingredients?.some(ing => ing.toLowerCase().includes(term))
                        );
                      }).length !== 1 ? 's' : ''}
                `}
                </p>
              </div>
            </div>
            
            <div className="pizza-grid">
              {/* Afficher les favoris si la catégorie est sélectionnée */}
              {activeCategory === 'favorites' ? (
                favoritesDetails.length > 0 ? (
                  favoritesDetails
                    .filter(fav => {
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return (
                        fav.name?.toLowerCase().includes(term) ||
                        fav.description?.toLowerCase().includes(term) ||
                        fav.ingredients?.some(ing => ing.toLowerCase().includes(term))
                      );
                    })
                    .map(pizza => (
                      <div 
                        key={pizza._id} 
                        className="pizza-card"
                        onClick={() => handlePizzaClick(pizza)}
                      >
                        <div className="card-image">
                          <div className="pizza-emoji">🍕</div>
                          
                          <div className="card-badges">
                            {pizza.isCustom && (
                              <div className="badge custom">
                                <span>🎨</span>
                                <span>Personnalisée</span>
                              </div>
                            )}
                            <div 
                              className="badge category"
                              style={{ 
                                backgroundColor: getCategoryColor(pizza.category) + '20', 
                                color: getCategoryColor(pizza.category) 
                              }}
                            >
                              {getCategoryIcon(pizza.category)}
                              <span>{getCategoryName(pizza.category)}</span>
                            </div>
                            <div className="badge popular">
                              <span>❤️</span>
                              <span>Favorite</span>
                            </div>
                          </div>
                          
                          <button 
                            className={`favorite-btn active`}
                            onClick={(e) => toggleFavorite(pizza._id, e)}
                            title="Retirer des favoris"
                          >
                            ❤️
                          </button>
                        </div>
                        
                        <div className="card-content">
                          <div className="pizza-name">
                            <span>{pizza.name}</span>
                            <span style={{ color: '#27ae60', fontSize: '24px' }}>{pizza.basePrice}dt</span>
                          </div>
                          
                          <p className="pizza-description">{pizza.description}</p>
                          
                          {pizza.ingredients && pizza.ingredients.length > 0 && (
                            <div className="ingredients">
                              {pizza.ingredients.slice(0, 3).map((ingredient, index) => (
                                <span key={index} className="ingredient-tag">
                                  {ingredient}
                                </span>
                              ))}
                              {pizza.ingredients.length > 3 && (
                                <span className="ingredient-tag">
                                  +{pizza.ingredients.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="card-footer">
                            <div className="price-info">
                              <div className="price-label">À partir de</div>
                              <div className="price">{pizza.basePrice}dt</div>
                            </div>
                            <button className="customize-btn">
                              <span>{pizza.isCustom ? 'Commander à nouveau' : 'Commander'}</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">❤️</div>
                    <h3>Aucune pizza favorite</h3>
                    <p>
                      Vous n'avez pas encore ajouté de pizzas à vos favoris.<br />
                      Cliquez sur l'icône cœur sur une pizza pour l'ajouter à vos favoris.
                    </p>
                    <button 
                      className="btn btn-primary"
                      style={{ marginTop: '20px' }}
                      onClick={() => setActiveCategory('all')}
                    >
                      Voir toutes les pizzas
                    </button>
                  </div>
                )
              ) : (
                // Afficher les pizzas par catégorie
                pizzas
                  .filter(pizza => {
                    if (activeCategory === 'all') return true;
                    if (activeCategory === 'vegetarian') return pizza.category === 'vegetarian';
                    if (activeCategory === 'spicy') return pizza.category === 'spicy';
                    if (activeCategory === 'special') return pizza.category === 'special';
                    if (activeCategory === 'classic') return pizza.category === 'classic';
                    if (activeCategory === 'custom') return pizza.category === 'custom';
                    return false;
                  })
                  .filter(pizza => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return (
                      pizza.name.toLowerCase().includes(term) ||
                      pizza.description.toLowerCase().includes(term) ||
                      pizza.ingredients?.some(ing => ing.toLowerCase().includes(term))
                    );
                  })
                  .map(pizza => (
                    <div 
                      key={pizza._id} 
                      className="pizza-card"
                      onClick={() => handlePizzaClick(pizza)}
                    >
                      <div className="card-image">
                        <div className="pizza-emoji">🍕</div>
                        
                        <div className="card-badges">
                          {pizza.popular && (
                            <div className="badge popular">
                              <span>🔥</span>
                              <span>Populaire</span>
                            </div>
                          )}
                          {pizza.isCustom && (
                            <div className="badge custom">
                              <span>🎨</span>
                              <span>Personnalisée</span>
                            </div>
                          )}
                          <div 
                            className="badge category"
                            style={{ 
                              backgroundColor: getCategoryColor(pizza.category) + '20', 
                              color: getCategoryColor(pizza.category) 
                            }}
                          >
                            {getCategoryIcon(pizza.category)}
                            <span>{getCategoryName(pizza.category)}</span>
                          </div>
                        </div>
                        
                        <button 
                          className={`favorite-btn ${favoritesIds.includes(pizza._id) ? 'active' : ''}`}
                          onClick={(e) => toggleFavorite(pizza._id, e)}
                          title={favoritesIds.includes(pizza._id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                        >
                          {favoritesIds.includes(pizza._id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      
                      <div className="card-content">
                        <div className="pizza-name">
                          <span>{pizza.name}</span>
                          <span style={{ color: '#27ae60', fontSize: '24px' }}>{pizza.basePrice}dt</span>
                        </div>
                        
                        <p className="pizza-description">{pizza.description}</p>
                        
                        {pizza.ingredients && pizza.ingredients.length > 0 && (
                          <div className="ingredients">
                            {pizza.ingredients.slice(0, 3).map((ingredient, index) => (
                              <span key={index} className="ingredient-tag">
                                {ingredient}
                              </span>
                            ))}
                            {pizza.ingredients.length > 3 && (
                              <span className="ingredient-tag">
                                +{pizza.ingredients.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="card-footer">
                          <div className="price-info">
                            <div className="price-label">À partir de</div>
                            <div className="price">{pizza.basePrice}dt</div>
                          </div>
                          <button className="customize-btn">
                            <span>{pizza.isCustom ? 'Commander à nouveau' : 'Personnaliser'}</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
              
              {/* Message si aucune pizza ne correspond aux filtres */}
              {activeCategory !== 'favorites' && 
               pizzas.filter(pizza => {
                 if (activeCategory === 'all') return true;
                 if (activeCategory === 'vegetarian') return pizza.category === 'vegetarian';
                 if (activeCategory === 'spicy') return pizza.category === 'spicy';
                 if (activeCategory === 'special') return pizza.category === 'special';
                 if (activeCategory === 'classic') return pizza.category === 'classic';
                 if (activeCategory === 'custom') return pizza.category === 'custom';
                 return false;
               }).filter(pizza => {
                 if (!searchTerm) return true;
                 const term = searchTerm.toLowerCase();
                 return (
                   pizza.name.toLowerCase().includes(term) ||
                   pizza.description.toLowerCase().includes(term) ||
                   pizza.ingredients?.some(ing => ing.toLowerCase().includes(term))
                 );
               }).length === 0 && (
                <div className="empty-state">
                  {searchTerm ? (
                    <>
                      <div className="empty-icon">🔍</div>
                      <h3>Aucun résultat</h3>
                      <p>Aucune pizza ne correspond à votre recherche "{searchTerm}"</p>
                      <button 
                        className="btn btn-primary"
                        style={{ marginTop: '20px' }}
                        onClick={() => setSearchTerm('')}
                      >
                        Effacer la recherche
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="empty-icon">🍕</div>
                      <h3>Aucune pizza disponible</h3>
                      <p>Il n'y a pas de pizza dans cette catégorie pour le moment</p>
                      <button 
                        className="btn btn-primary"
                        style={{ marginTop: '20px' }}
                        onClick={() => setActiveCategory('all')}
                      >
                        Voir toutes les pizzas
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Configurator Modal */}
      {configuratorOpen && selectedPizza && (
        <div className="modal-overlay" onClick={() => setConfiguratorOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>
                  {selectedPizza.isCustom ? '🎨' : '🍕'} 
                  {isCreatingCustomPizza ? 'Créer votre pizza' : `Personnaliser ${selectedPizza.name}`}
                  {!isCreatingCustomPizza && selectedPizza._id !== 'surprise' && favoritesIds.includes(selectedPizza._id) && (
                    <span style={{ marginLeft: '10px', animation: 'pulse 2s infinite' }}>❤️</span>
                  )}
                </h2>
                <p>{selectedPizza.description}</p>
              </div>
              <button 
                className="close-btn"
                onClick={() => setConfiguratorOpen(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {/* Formulaire pour pizza personnalisée */}
              {isCreatingCustomPizza && (
                <div className="custom-pizza-form">
                  <div className="form-group">
                    <label className="form-label">
                      <span>📝</span>
                      Nom de votre pizza
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Ma création spéciale, Pizza du chef..."
                      value={customPizzaName}
                      onChange={(e) => setCustomPizzaName(e.target.value)}
                      maxLength={50}
                    />
                    <div className="form-hint">
                      Donnez un nom unique à votre création ({customPizzaName.length}/50 caractères)
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <span>💬</span>
                      Description (optionnel)
                    </label>
                    <textarea
                      className="form-input form-textarea"
                      placeholder="Décrivez votre pizza..."
                      value={customPizzaDescription}
                      onChange={(e) => setCustomPizzaDescription(e.target.value)}
                      maxLength={200}
                    />
                    <div className="form-hint">
                      Décrivez votre création ({customPizzaDescription.length}/200 caractères)
                    </div>
                  </div>
                </div>
              )}
              
              {/* Size */}
              <div className="option-section">
                <div className="section-label">
                  <h3>
                    <span>📏</span>
                    Taille
                  </h3>
                  <span style={{ color: '#27ae60', fontWeight: '600' }}>Requis</span>
                </div>
                <div className="option-grid">
                  {sizes.map(size => (
                    <div
                      key={size.id}
                      className={`option-card ${pizzaConfig.size === size.id ? 'selected' : ''}`}
                      onClick={() => handleSizeChange(size.id)}
                    >
                      <div className="option-header">
                        <div className="option-icon">{size.icon}</div>
                        <div className="option-info">
                          <h4>{size.name}</h4>
                          <div className="option-price">+{size.price}dt</div>
                        </div>
                      </div>
                      <p className="option-description">{size.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Crust */}
              <div className="option-section">
                <div className="section-label">
                  <h3>
                    <span>🥨</span>
                    Type de pâte
                  </h3>
                  <span style={{ color: '#27ae60', fontWeight: '600' }}>Requis</span>
                </div>
                <div className="option-grid">
                  {crusts.map(crust => (
                    <div
                      key={crust.id}
                      className={`option-card ${pizzaConfig.crust === crust.id ? 'selected' : ''}`}
                      onClick={() => handleCrustChange(crust.id)}
                    >
                      <div className="option-header">
                        <div className="option-icon">{crust.icon}</div>
                        <div className="option-info">
                          <h4>{crust.name}</h4>
                          <div className="option-price">+{crust.price}dt</div>
                        </div>
                      </div>
                      <p className="option-description">{crust.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Toppings */}
              <div className="option-section">
                <div className="section-label">
                  <h3>
                    <span>🧀</span>
                    Garnitures
                  </h3>
                  <span style={{ color: '#7f8c8d', fontWeight: '600' }}>Optionnel</span>
                </div>
                
                <div className="toppings-grid">
                  {toppingsList.map(topping => (
                    <div
                      key={topping.id}
                      className={`topping-card ${pizzaConfig.toppings.includes(topping.id) ? 'selected' : ''}`}
                      onClick={() => handleToppingToggle(topping.id)}
                    >
                      <div className="topping-icon">{topping.icon}</div>
                      <div className="topping-info">
                        <h4>{topping.name}</h4>
                        <div className="topping-price">+{topping.price}dt</div>
                        <div className="topping-category">{topping.category}</div>
                      </div>
                      <div className="topping-selector">
                        {pizzaConfig.toppings.includes(topping.id) ? '✓' : '+'}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '15px', color: '#7f8c8d', fontSize: '14px' }}>
                  {pizzaConfig.toppings.length} / 8 garnitures sélectionnées
                </div>
              </div>
              
              {/* Quantity */}
              <div className="option-section">
                <h3 style={{ color: '#2c3e50', fontSize: '22px', marginBottom: '20px' }}>
                  <span>🔢</span>
                  Quantité
                </h3>
                <div className="quantity-section">
                  <div className="quantity-selector">
                    <button 
                      className="qty-btn"
                      onClick={() => handleQuantityChange(-1)}
                    >
                      −
                    </button>
                    <span className="qty-value">{pizzaConfig.quantity}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => handleQuantityChange(1)}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ color: '#7f8c8d', fontSize: '16px' }}>
                    {pizzaConfig.quantity} pizza{pizzaConfig.quantity > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              {/* Summary */}
              <div className="summary-section">
                <h3>
                  <span>📝</span>
                  Récapitulatif de votre commande
                </h3>
                <div className="summary-list">
                  <div className="summary-item">
                    <span>{isCreatingCustomPizza ? (customPizzaName || 'Pizza personnalisée') : selectedPizza.name}</span>
                    <span>{selectedPizza.basePrice}dt</span>
                  </div>
                  
                  {pizzaConfig.size && (
                    <div className="summary-item">
                      <span>Taille {sizes.find(s => s.id === pizzaConfig.size)?.name.toLowerCase()}</span>
                      <span>+{sizes.find(s => s.id === pizzaConfig.size)?.price}dt</span>
                    </div>
                  )}
                  
                  {pizzaConfig.crust && (
                    <div className="summary-item">
                      <span>Pâte {crusts.find(c => c.id === pizzaConfig.crust)?.name.toLowerCase()}</span>
                      <span>+{crusts.find(c => c.id === pizzaConfig.crust)?.price}dt</span>
                    </div>
                  )}
                  
                  {pizzaConfig.toppings.map(toppingId => {
                    const topping = toppingsList.find(t => t.id === toppingId);
                    return topping ? (
                      <div key={toppingId} className="summary-item">
                        <span>{topping.name}</span>
                        <span>+{topping.price}dt</span>
                      </div>
                    ) : null;
                  })}
                  
                  <div className="summary-total">
                    <span>Total ({pizzaConfig.quantity} pizza{pizzaConfig.quantity > 1 ? 's' : ''})</span>
                    <span className="total-amount">{calculateTotal()}dt</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              {!isCreatingCustomPizza && selectedPizza._id !== 'custom' && selectedPizza._id !== 'surprise' && (
                <button 
                  className="btn btn-accent"
                  onClick={(e) => toggleFavorite(selectedPizza._id, e)}
                >
                  {favoritesIds.includes(selectedPizza._id) ? '❤️ Retirer des favoris' : '🤍 Ajouter aux favoris'}
                </button>
              )}
              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  className="btn btn-danger"
                  onClick={() => setConfiguratorOpen(false)}
                >
                  Annuler
                </button>
                
                {isCreatingCustomPizza && selectedPizza._id !== 'surprise' && (
                  <button 
                    className="btn btn-warning"
                    onClick={saveCustomPizza}
                    disabled={!customPizzaName.trim()}
                  >
                    <span>💾</span>
                    <span>Sauvegarder la pizza</span>
                  </button>
                )}
                
                <button 
                  className="btn btn-success"
                  onClick={addToCart}
                  disabled={isCreatingCustomPizza && !customPizzaName.trim()}
                >
                  <span>🛒</span>
                  <span>Ajouter au panier · {calculateTotal()}dt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
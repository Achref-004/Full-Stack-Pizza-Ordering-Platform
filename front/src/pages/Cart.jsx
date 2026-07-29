// pages/Cart.jsx - VERSION CORRIGÉE - Prix unitaires fixes avec CSS intégré

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Cart = () => {
  const BACKEND_URL = "http://localhost:5004";
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [user, setUser] = useState(userData);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    deliveryAddress: {
      address: userData.address || '',
      city: userData.city || '',
      state: userData.state || '',
      zipCode: userData.zipCode || ''
    },
    deliveryMethod: 'delivery',
    paymentMethod: 'cash',
    notes: '',
    contactPhone: userData.phone || ''
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCardPayment, setShowCardPayment] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: '', cardHolder: '', expiryMonth: '', expiryYear: '', cvv: ''
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCart();
    loadSuggestions();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const cartData = response.data.cart;
        
        const formattedItems = cartData.items?.map(item => {
          let unitPrice;
          if (item.unitPrice) {
            unitPrice = item.unitPrice;
          } else if (item.price) {
            const qty = item.quantity || 1;
            unitPrice = item.price / qty;
          } else {
            unitPrice = 12.500;
          }
          
          return {
            id: item.id || item._id,
            pizzaId: item.pizzaId?._id || item.pizzaId,
            pizzaName: item.pizzaName,
            config: item.config,
            unitPrice: unitPrice,
            quantity: item.quantity || 1,
            isCustom: item.isCustom || false,
            customDescription: item.customDescription || '',
            image: getPizzaImage(item.isCustom)
          };
        }) || [];
        
        setCartItems(formattedItems);
        
        console.log('📦 Panier:', formattedItems.map(i => ({
          name: i.pizzaName,
          unitPrice: i.unitPrice,
          qty: i.quantity,
          total: i.unitPrice * i.quantity
        })));
      }
    } catch (error) {
      console.error('❌ Erreur fetchCart:', error);
      if (error.response?.status === 404) {
        setCartItems([]);
      } else {
        setIsError(true);
        setMessage('❌ Erreur lors du chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/pizzas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const pizzas = response.data.pizzas
          .filter(p => p.isAvailable !== false)
          .slice(0, 4)
          .map(p => ({
            id: p.id || p._id,
            name: p.name,
            description: p.description,
            basePrice: p.basePrice,
            category: p.category,
            ingredients: p.ingredients || [],
            image: getPizzaImage(false)
          }));
        setSuggestions(pizzas);
      }
    } catch (error) {
      console.error('Erreur suggestions:', error);
    }
  };

  const getPizzaImage = (isCustom) => {
    const images = [
      'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1595708684082-a173bb3a06c5?w=200&h=200&fit=crop'
    ];
    return isCustom 
      ? 'https://images.unsplash.com/photo-1555072956-7758afb20e8f?w=200&h=200&fit=crop'
      : images[Math.floor(Math.random() * images.length)];
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    try {
      await axios.put(
        `${BACKEND_URL}/api/cart/item/${itemId}/quantity`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCart();
      setMessage('✅ Quantité mise à jour');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setIsError(true);
      setMessage('❌ Erreur mise à jour');
    }
  };

  const removeFromCart = async (itemId) => {
    if (!window.confirm('Supprimer cet article ?')) return;
    
    try {
      await axios.delete(
        `${BACKEND_URL}/api/cart/item/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCart();
      setMessage('✅ Article supprimé');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setIsError(true);
      setMessage('❌ Erreur suppression');
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Vider tout le panier ?')) return;
    
    try {
      await axios.delete(`${BACKEND_URL}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems([]);
      setMessage('✅ Panier vidé');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setIsError(true);
      setMessage('❌ Erreur');
    }
  };

  const addSuggestionToCart = async (pizza) => {
    try {
      const unitPrice = pizza.basePrice || 12.500;
      
      const itemData = {
        pizzaId: pizza.id,
        pizzaName: pizza.name,
        config: {
          size: "medium",
          crust: "thin",
          toppings: pizza.ingredients || ["Sauce tomate", "Mozzarella"],
          quantity: 1
        },
        unitPrice: unitPrice,
        totalPrice: unitPrice,
        isCustom: false,
        customDescription: pizza.description || ""
      };

      await axios.post(`${BACKEND_URL}/api/cart/add`, itemData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchCart();
      setMessage(`✅ ${pizza.name} ajoutée !`);
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setIsError(true);
      setMessage('❌ Erreur ajout');
    }
  };

  const handleCheckoutChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCheckoutData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setCheckoutData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setCardData(prev => ({ ...prev, [name]: formatted.slice(0, 19) }));
    } else if (name === 'cvv') {
      setCardData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 3) }));
    } else {
      setCardData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!checkoutData.deliveryAddress.address || !checkoutData.contactPhone) {
      setIsError(true);
      setMessage('❌ Complétez les champs obligatoires');
      return;
    }
    if (checkoutData.paymentMethod === 'card') {
      setShowCardPayment(true);
      return;
    }
    await processOrder();
  };

  const processOrder = async (additionalData = {}) => {
    setCheckoutLoading(true);
    try {
      const orderData = {
        ...checkoutData,
        ...additionalData,
        items: cartItems.map(item => ({
          pizzaId: item.pizzaId,
          pizzaName: item.pizzaName,
          config: item.config,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          isCustom: item.isCustom
        })),
        subtotal,
        deliveryFee: checkoutData.deliveryMethod === 'delivery' ? deliveryFee : 0,
        total: checkoutData.deliveryMethod === 'delivery' ? total : subtotal
      };

      const response = await axios.post(
        `${BACKEND_URL}/api/orders/place`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        navigate('/confirmation', {
          state: { orderDetails: { ...response.data.order, items: cartItems } }
        });
      }
    } catch (error) {
      setIsError(true);
      setMessage('❌ Erreur commande');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(price || 0) + ' DT';
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee = subtotal > 30 ? 0 : 3.500;
  const total = subtotal + deliveryFee;

  const getSizeName = (id) => ({
    small: 'Petite', medium: 'Moyenne', large: 'Grande'
  }[id] || 'Moyenne');

  const getCrustName = (id) => ({
    thin: 'Fine', pan: 'Épaisse', stuffed: 'Fourrée'
  }[id] || 'Fine');



  return (
    <>
      <div className="cart-container">
        <div className="background-overlay"></div>
        
        {message && (
          <div className={`message-alert ${isError ? 'error' : 'success'}`}>
            {isError} {message}
          </div>
        )}

        <div className="content-wrapper">
          {/* Header Section */}
          <div className="header-section">
            <div className="header-top">
              <div className="user-info">
                <div className="user-avatar">
                  {userData.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="user-details">
                  <h1>🛒 Votre Panier ({itemCount} articles)</h1>
                  <p>Bonjour, {userData.name || 'Utilisateur'} 👋</p>
                </div>
              </div>
              <div className="header-actions">
                <Link to="/" className="btn btn-primary">
                  ← Continuer mes achats
                </Link>
                <button className="btn btn-danger" onClick={clearCart} disabled={cartItems.length === 0}>
                  🗑️ Vider le panier
                </button>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{itemCount}</div>
                <div className="stat-label">Articles</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatPrice(subtotal)}</div>
                <div className="stat-label">Sous-total</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{deliveryFee === 0 ? 'Gratuite' : formatPrice(deliveryFee)}</div>
                <div className="stat-label">Livraison</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatPrice(total)}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {cartItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <h3>Votre panier est vide</h3>
              <p>Commencez par ajouter de délicieuses pizzas à votre panier !</p>
              <Link to="/" className="btn btn-success">
                Explorer notre carte
              </Link>
            </div>
          ) : (
            <div className="cart-content-grid">
              {/* Cart Items Section */}
              <div className="cart-items-section">
                <div className="section-title">
                  <h2>📋 Mes articles</h2>
                  <button className="btn-clear" onClick={clearCart}>
                    🗑️ Tout supprimer
                  </button>
                </div>

                <div className="cart-items">
                  {cartItems.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-image">
                        <img src={item.image} alt={item.pizzaName} />
                        <div className="item-quantity-badge">{item.quantity}</div>
                      </div>
                      
                      <div className="cart-item-details">
                        <div className="cart-item-header">
                          <h3 className="cart-item-title">{item.pizzaName}</h3>
                          <div className="item-price">{formatPrice(item.unitPrice * item.quantity)}</div>
                        </div>

                        <div className="cart-item-specs">
                          <div className="spec-row">
                            <span className="spec-label">Taille:</span>
                            <span className="spec-value">{getSizeName(item.config?.size)}</span>
                          </div>
                          <div className="spec-row">
                            <span className="spec-label">Pâte:</span>
                            <span className="spec-value">{getCrustName(item.config?.crust)}</span>
                          </div>
                          <div className="spec-row">
                            <span className="spec-label">Prix unitaire:</span>
                            <span className="spec-value">{formatPrice(item.unitPrice)}</span>
                          </div>
                          {item.customDescription && (
                            <div className="spec-row">
                              <span className="spec-label">Personnalisation:</span>
                              <span className="spec-value">{item.customDescription}</span>
                            </div>
                          )}
                        </div>

                        <div className="cart-item-controls">
                          <div className="quantity-control">
                            <span className="control-label">Quantité:</span>
                            <div className="quantity-buttons">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="qty-btn"
                                disabled={item.quantity <= 1}
                              >
                                −
                              </button>
                              <span className="qty-display">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="qty-btn"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="btn-remove-item"
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Section */}
              <div className="cart-summary">
                <div className="summary-header">
                  <h2>💰 Récapitulatif</h2>
                </div>

                <div className="summary-details">
                  <div className="summary-row">
                    <span>Sous-total ({itemCount} articles)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Livraison</span>
                    <span style={{ color: deliveryFee === 0 ? '#27ae60' : 'inherit' }}>
                      {deliveryFee === 0 ? 'Gratuite 🎉' : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-total">
                    <span>Total à payer</span>
                    <span className="total-amount">{formatPrice(total)}</span>
                  </div>
                </div>

                {deliveryFee > 0 && subtotal < 30 && (
                  <div className="delivery-message info">
                    <span>🎯</span>
                    <span>Plus que {formatPrice(30 - subtotal)} pour la livraison gratuite !</span>
                  </div>
                )}

                <div className="summary-actions">
                  <button
                    onClick={() => setShowCheckoutForm(true)}
                    className="btn btn-success btn-checkout"
                  >
                    ✅ Finaliser la commande
                  </button>
                  <Link to="/" className="btn btn-secondary">
                    ← Continuer mes achats
                  </Link>
                </div>

                <div className="summary-footer">
                  <div className="secure-payment">
                    🔒 Paiement sécurisé
                  </div>
                  <div className="payment-methods">
                    💳 • 💰 • 📱
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions Section */}
          {suggestions.length > 0 && cartItems.length > 0 && (
            <div className="suggestions-section">
              <div 
                className="suggestions-toggle"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <h3>🍕 Vous aimerez peut-être</h3>
                <span className={`toggle-icon ${showSuggestions ? 'open' : ''}`}>▼</span>
              </div>

              {showSuggestions && (
                <div className="suggestions-grid">
                  {suggestions.map(pizza => (
                    <div key={pizza.id} className="suggestion-card">
                      <div className="suggestion-image">
                        <img src={pizza.image} alt={pizza.name} />
                        <div className="suggestion-badges">
                          <div className="suggestion-badge category">
                            {pizza.category || 'Classique'}
                          </div>
                        </div>
                      </div>
                      <div className="suggestion-content">
                        <h3 className="suggestion-title">{pizza.name}</h3>
                        <p className="suggestion-toppings">
                          {pizza.ingredients?.join(', ') || 'Ingrédients secrets...'}
                        </p>
                        <div className="suggestion-price">
                          {formatPrice(pizza.basePrice)}
                        </div>
                        <button
                          onClick={() => addSuggestionToCart(pizza)}
                          className="suggestion-action"
                        >
                          + Ajouter au panier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Checkout Form Modal */}
      {showCheckoutForm && (
        <div className="checkout-overlay">
          <div className="checkout-form-container">
            <div className="checkout-header">
              <h2>📝 Finaliser la commande</h2>
              <button 
                className="close-checkout"
                onClick={() => setShowCheckoutForm(false)}
                disabled={checkoutLoading}
              >
                ×
              </button>
            </div>

            <div className="checkout-body">
              <div className="checkout-grid">
                {/* Delivery Address */}
                <div className="form-section">
                  <h3>📍 Adresse de livraison</h3>
                  <div className="form-group">
                    <label className="form-label required">Adresse</label>
                    <input
                      type="text"
                      name="deliveryAddress.address"
                      value={checkoutData.deliveryAddress.address}
                      onChange={handleCheckoutChange}
                      className="form-control"
                      placeholder="123 Rue de la Pizza"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Ville</label>
                    <input
                      type="text"
                      name="deliveryAddress.city"
                      value={checkoutData.deliveryAddress.city}
                      onChange={handleCheckoutChange}
                      className="form-control"
                      placeholder="Tunis"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Code postal</label>
                    <input
                      type="text"
                      name="deliveryAddress.zipCode"
                      value={checkoutData.deliveryAddress.zipCode}
                      onChange={handleCheckoutChange}
                      className="form-control"
                      placeholder="1000"
                    />
                  </div>
                </div>

                {/* Contact & Delivery */}
                <div className="form-section">
                  <h3>📞 Contact & Livraison</h3>
                  <div className="form-group">
                    <label className="form-label required">Téléphone</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={checkoutData.contactPhone}
                      onChange={handleCheckoutChange}
                      className="form-control"
                      placeholder="+216 XX XXX XXX"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mode de livraison</label>
                    <div className="radio-group">
                      <div className="radio-option">
                        <input
                          type="radio"
                          id="delivery"
                          name="deliveryMethod"
                          value="delivery"
                          checked={checkoutData.deliveryMethod === 'delivery'}
                          onChange={handleCheckoutChange}
                          className="radio-input"
                        />
                        <label htmlFor="delivery" className="radio-label">
                          🚚 Livraison
                        </label>
                      </div>
                      <div className="radio-option">
                        <input
                          type="radio"
                          id="pickup"
                          name="deliveryMethod"
                          value="pickup"
                          checked={checkoutData.deliveryMethod === 'pickup'}
                          onChange={handleCheckoutChange}
                          className="radio-input"
                        />
                        <label htmlFor="pickup" className="radio-label">
                          🏪 Retrait en magasin
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Moyen de paiement</label>
                    <div className="radio-group">
                      <div className="radio-option">
                        <input
                          type="radio"
                          id="cash"
                          name="paymentMethod"
                          value="cash"
                          checked={checkoutData.paymentMethod === 'cash'}
                          onChange={handleCheckoutChange}
                          className="radio-input"
                        />
                        <label htmlFor="cash" className="radio-label">
                          💵 Espèces
                        </label>
                      </div>
                      <div className="radio-option">
                        <input
                          type="radio"
                          id="card"
                          name="paymentMethod"
                          value="card"
                          checked={checkoutData.paymentMethod === 'card'}
                          onChange={handleCheckoutChange}
                          className="radio-input"
                        />
                        <label htmlFor="card" className="radio-label">
                          💳 Carte bancaire
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="checkout-order-summary">
                <h3>📋 Récapitulatif de commande</h3>
                <div className="order-items-list">
                  {cartItems.map(item => (
                    <div key={item.id} className="order-item">
                      <span className="order-item-name">
                        {item.pizzaName} × {item.quantity}
                      </span>
                      <span className="order-item-price">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="checkout-totals">
                  <div className="summary-row">
                    <span>Sous-total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Livraison</span>
                    <span>
                      {checkoutData.deliveryMethod === 'delivery' 
                        ? (deliveryFee === 0 ? 'Gratuite' : formatPrice(deliveryFee))
                        : '—'
                      }
                    </span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-total">
                    <span>Total</span>
                    <span className="total-amount">
                      {formatPrice(checkoutData.deliveryMethod === 'delivery' ? total : subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="form-section">
                <h3>📝 Notes supplémentaires</h3>
                <textarea
                  name="notes"
                  value={checkoutData.notes}
                  onChange={handleCheckoutChange}
                  className="textarea-control"
                  placeholder="Instructions spéciales, allergies, horaire de livraison préféré..."
                  rows="3"
                />
              </div>

              {/* Action Buttons */}
              <div className="checkout-action-buttons">
                <button
                  onClick={handlePlaceOrder}
                  className="btn btn-success btn-checkout-submit"
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Traitement...
                    </>
                  ) : (
                    '✅ Confirmer la commande'
                  )}
                </button>
                <button
                  onClick={() => setShowCheckoutForm(false)}
                  className="btn btn-checkout-cancel"
                  disabled={checkoutLoading}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Payment Modal */}
      {showCardPayment && (
        <div className="card-payment-overlay">
          <div className="card-payment-container">
            <div className="card-payment-header">
              <h2>💳 Paiement par carte</h2>
              <div className="payment-security">
                🔒 Paiement 100% sécurisé
              </div>
            </div>

            <div className="card-payment-body">
              {/* Demo Card */}
              <div className="fake-card">
                <div className="fake-card-row">
                  <span>VISA</span>
                  <span>PLATINUM</span>
                </div>
                <div className="fake-card-number">
                  {cardData.cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="fake-card-row">
                  <span>{cardData.cardHolder || 'NOM DU TITULAIRE'}</span>
                  <span>{cardData.expiryMonth || 'MM'}/{cardData.expiryYear || 'AA'}</span>
                </div>
                <div className="fake-card-info">
                  Carte de démonstration - Pas de transaction réelle
                </div>
              </div>

              <div className="payment-total">
                <h3>Montant à payer</h3>
                <div className="amount">{formatPrice(total)}</div>
              </div>

              <form className="card-form">
                <div className="card-input-group">
                  <label>Numéro de carte</label>
                  <span className="card-icon">💳</span>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardData.cardNumber}
                    onChange={handleCardChange}
                    className="card-input"
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                </div>

                <div className="card-input-group">
                  <label>Titulaire de la carte</label>
                  <span className="card-icon">👤</span>
                  <input
                    type="text"
                    name="cardHolder"
                    value={cardData.cardHolder}
                    onChange={handleCardChange}
                    className="card-input"
                    placeholder="JEAN DUPONT"
                  />
                </div>

                <div className="card-row">
                  <div className="card-input-group">
                    <label>Date d'expiration</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        name="expiryMonth"
                        value={cardData.expiryMonth}
                        onChange={handleCardChange}
                        className="card-input"
                        placeholder="MM"
                        maxLength="2"
                        style={{ textAlign: 'center' }}
                      />
                      <span style={{ alignSelf: 'center' }}>/</span>
                      <input
                        type="text"
                        name="expiryYear"
                        value={cardData.expiryYear}
                        onChange={handleCardChange}
                        className="card-input"
                        placeholder="AA"
                        maxLength="2"
                        style={{ textAlign: 'center' }}
                      />
                    </div>
                  </div>

                  <div className="card-input-group">
                    <label>CVV</label>
                    <span className="card-icon">🔒</span>
                    <input
                      type="text"
                      name="cvv"
                      value={cardData.cvv}
                      onChange={handleCardChange}
                      className="card-input"
                      placeholder="123"
                      maxLength="3"
                    />
                  </div>
                </div>

                <div className="card-logo">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" />
                </div>

                <div className="test-cards">
                  <h4>💡 Cartes de test (sans transaction réelle)</h4>
                  <ul>
                    <li>Visa: 4242 4242 4242 4242</li>
                    <li>Mastercard: 5555 5555 5555 4444</li>
                    <li>CVV: 123</li>
                    <li>Date: future</li>
                  </ul>
                </div>

                <div className="payment-buttons">
                  <button
                    type="button"
                    onClick={() => processOrder({ cardPayment: true })}
                    className="btn btn-pay"
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Traitement...
                      </>
                    ) : (
                      '✅ Payer maintenant'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCardPayment(false)}
                    className="btn btn-cancel-payment"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body, #root {
          width: 100%;
          min-height: 100vh;
          font-family: system-ui, sans-serif;
          background: #f5f5f5;
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

        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          gap: 20px;
        }

        .loading-container .loading-spinner {
          border: 4px solid rgba(52, 152, 219, 0.3);
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }

        /* Container Principal */
        .cart-container {
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
          border-left: 5px solid #27ae60;
          animation: slideUp 0.5s ease;
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
          border-color: #27ae60;
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

        /* Main Content Grid */
        .cart-content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 25px;
          margin-bottom: 25px;
          animation: slideUp 0.6s ease;
        }

        @media (max-width: 1024px) {
          .cart-content-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Cart Items Section */
        .cart-items-section {
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 30px;
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

        .btn-clear {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
          border: 2px solid #ff6b6b;
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-clear:hover {
          background: #ff6b6b;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
        }

        /* Cart Items */
        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cart-item {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          border: 2px solid #f1f2f6;
          display: flex;
          gap: 20px;
          align-items: flex-start;
          animation: slideUp 0.3s ease;
        }

        .cart-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          border-color: #27ae60;
        }

        .cart-item-image {
          position: relative;
          flex-shrink: 0;
        }

        .cart-item-image img {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 12px;
          border: 3px solid #f1f2f6;
        }

        .item-quantity-badge {
          position: absolute;
          top: -10px;
          right: -10px;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
        }

        .cart-item-details {
          flex: 1;
        }

        .cart-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .cart-item-title {
          font-size: 1.4em;
          font-weight: 700;
          color: #2c3e50;
          margin: 0;
        }

        .item-price {
          font-size: 1.5em;
          font-weight: 700;
          color: #27ae60;
          margin-left: 15px;
        }

        .cart-item-specs {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .spec-row {
          display: flex;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .spec-label {
          font-weight: 600;
          color: #2c3e50;
          min-width: 120px;
        }

        .spec-value {
          color: #7f8c8d;
          flex: 1;
        }

        .cart-item-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .quantity-control {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .control-label {
          font-weight: 600;
          color: #2c3e50;
        }

        .quantity-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8f9fa;
          border-radius: 10px;
          padding: 5px;
        }

        .qty-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: white;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          color: #2c3e50;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .qty-btn:hover:not(:disabled) {
          background: #e9ecef;
          transform: translateY(-2px);
        }

        .qty-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .qty-display {
          min-width: 30px;
          text-align: center;
          font-weight: 700;
          color: #2c3e50;
        }

        .btn-remove-item {
          background: rgba(149, 165, 166, 0.1);
          color: #95a5a6;
          border: 2px solid #95a5a6;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-remove-item:hover {
          border-color: #ff6b6b;
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
          transform: translateY(-2px);
        }

        /* Summary Section */
        .cart-summary {
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          height: fit-content;
          position: sticky;
          top: 20px;
          animation: slideUp 0.7s ease;
        }

        .summary-header {
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e9ecef;
        }

        .summary-header h2 {
          color: #2c3e50;
          font-size: 1.8em;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
        }

        .summary-details {
          margin-bottom: 25px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 8px 0;
          color: #2c3e50;
          font-size: 15px;
        }

        .summary-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #e9ecef, transparent);
          margin: 20px 0;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding: 20px 0;
          border-top: 2px solid #e9ecef;
          font-size: 1.3em;
          font-weight: 700;
          color: #2c3e50;
        }

        .total-amount {
          color: #27ae60;
          font-size: 1.5em;
        }

        .delivery-message {
          padding: 15px;
          border-radius: 10px;
          margin-top: 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }

        .delivery-message.success {
          background: rgba(39, 174, 96, 0.1);
          color: #27ae60;
          border: 2px solid rgba(39, 174, 96, 0.2);
        }

        .delivery-message.info {
          background: rgba(52, 152, 219, 0.1);
          color: #2980b9;
          border: 2px solid rgba(52, 152, 219, 0.2);
        }

        .delivery-message.warning {
          background: rgba(243, 156, 18, 0.1);
          color: #f39c12;
          border: 2px solid rgba(243, 156, 18, 0.2);
        }

        .summary-actions {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 25px;
        }

        .btn-checkout {
          width: 100%;
          justify-content: center;
          font-size: 1.1em;
          padding: 16px;
        }

        .btn-checkout:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(39, 174, 96, 0.4);
        }

        .summary-footer {
          padding-top: 20px;
          border-top: 2px solid #e9ecef;
          text-align: center;
        }

        .secure-payment {
          color: #7f8c8d;
          font-size: 14px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .payment-methods {
          color: #95a5a6;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* FORMULAIRE DE COMMANDE */
        .checkout-overlay {
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

        .checkout-form-container {
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

        .checkout-header {
          background: linear-gradient(135deg, #27ae60, #219a52);
          color: white;
          padding: 25px 30px;
          border-radius: 18px 18px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .checkout-header h2 {
          font-size: 1.8em;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .close-checkout {
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

        .close-checkout:hover {
          background: rgba(255,255,255,0.3);
          transform: rotate(90deg);
        }

        .checkout-body {
          padding: 30px;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          margin-bottom: 25px;
        }

        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }
        }

        .form-section {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 25px;
          border: 2px solid #e9ecef;
        }

        .form-section h3 {
          color: #2c3e50;
          font-size: 1.3em;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #27ae60;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          color: #2c3e50;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .required::after {
          content: " *";
          color: #e74c3c;
        }

        .form-control {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.3s ease;
          background: white;
        }

        .form-control:focus {
          outline: none;
          border-color: #27ae60;
          box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
        }

        .radio-group {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .radio-option {
          flex: 1;
          min-width: 120px;
        }

        .radio-input {
          display: none;
        }

        .radio-label {
          display: block;
          padding: 15px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
          font-weight: 600;
          color: #2c3e50;
        }

        .radio-input:checked + .radio-label {
          border-color: #27ae60;
          background: rgba(39, 174, 96, 0.1);
          color: #27ae60;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(39, 174, 96, 0.2);
        }

        .textarea-control {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 15px;
          min-height: 100px;
          resize: vertical;
          transition: all 0.3s ease;
          background: white;
        }

        .textarea-control:focus {
          outline: none;
          border-color: #27ae60;
          box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
        }

        .checkout-order-summary {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 25px;
          border: 2px solid #e9ecef;
        }

        .checkout-order-summary h3 {
          color: #2c3e50;
          font-size: 1.3em;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e74c3c;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .order-items-list {
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 20px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .order-item-name {
          color: #2c3e50;
          font-weight: 600;
        }

        .order-item-price {
          color: #27ae60;
          font-weight: 600;
        }

        .checkout-totals {
          border-top: 2px solid #e9ecef;
          padding-top: 20px;
        }

        .checkout-action-buttons {
          display: flex;
          gap: 15px;
        }

        .btn-checkout-submit {
          flex: 2;
          justify-content: center;
          font-size: 1.1em;
          padding: 16px;
        }

        .btn-checkout-cancel {
          flex: 1;
          background: #95a5a6;
          color: white;
        }

        .btn-checkout-cancel:hover {
          background: #7f8c8d;
        }

        .loading-spinner {
          border: 3px solid rgba(255,255,255,0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 30px;
          background: rgba(255,255,255,0.9);
          border-radius: 20px;
          border: 2px dashed #e9ecef;
          margin: 20px 0;
          animation: slideUp 0.5s ease;
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

        /* Suggestions */
        .suggestions-section {
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 30px;
          margin-top: 30px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          animation: slideUp 0.8s ease;
        }

        .suggestions-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          cursor: pointer;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
        }

        .suggestions-toggle:hover {
          background: white;
          border-color: #27ae60;
        }

        .suggestions-toggle h3 {
          color: #2c3e50;
          font-size: 1.4em;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .toggle-icon {
          font-size: 1.2em;
          transition: transform 0.3s ease;
        }

        .toggle-icon.open {
          transform: rotate(180deg);
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .suggestion-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          border: 2px solid #f1f2f6;
          transition: all 0.3s ease;
        }

        .suggestion-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.15);
          border-color: #e74c3c;
        }

        .suggestion-image {
          height: 150px;
          overflow: hidden;
          position: relative;
        }

        .suggestion-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .suggestion-card:hover .suggestion-image img {
          transform: scale(1.1);
        }

        /* Badges pour les suggestions */
        .suggestion-badges {
          position: absolute;
          top: 10px;
          left: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .suggestion-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          animation: slideIn 0.5s ease;
        }

        .suggestion-badge.category {
          background: rgba(255,255,255,0.95);
          color: #2c3e50;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .suggestion-content {
          padding: 15px;
        }

        .suggestion-title {
          font-size: 1.2em;
          font-weight: 700;
          color: #2c3e50;
          margin: 0 0 10px 0;
        }

        .suggestion-toppings {
          color: #7f8c8d;
          font-size: 13px;
          margin-bottom: 15px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }

        .suggestion-price {
          color: #27ae60;
          font-weight: 700;
          font-size: 1.1em;
          margin-bottom: 15px;
        }

        .suggestion-action {
          width: 100%;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .suggestion-action:hover {
          background: linear-gradient(135deg, #c0392b, #a93226);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
        }

        /* CARD PAYMENT MODAL */
        .card-payment-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        .card-payment-container {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.4);
          animation: slideIn 0.3s ease;
          border: 3px solid #3498db;
          overflow: hidden;
        }

        .card-payment-header {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          padding: 25px 30px;
          text-align: center;
        }

        .card-payment-header h2 {
          font-size: 1.8em;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .payment-security {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
          font-size: 0.9em;
          opacity: 0.9;
        }

        .card-payment-body {
          padding: 30px;
        }

        .card-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-input-group {
          position: relative;
        }

        .card-input-group label {
          display: block;
          color: #2c3e50;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .card-input {
          width: 100%;
          padding: 14px 15px;
          padding-left: 45px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: white;
        }

        .card-input:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }

        .card-icon {
          position: absolute;
          left: 15px;
          top: 40px;
          font-size: 20px;
          color: #7f8c8d;
        }

        .card-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .card-logo {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .card-logo img {
          height: 30px;
          opacity: 0.7;
        }

        .payment-total {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
          border: 2px solid #e9ecef;
        }

        .payment-total h3 {
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 1.1em;
        }

        .payment-total .amount {
          font-size: 2em;
          font-weight: 700;
          color: #27ae60;
        }

        .payment-buttons {
          display: flex;
          gap: 15px;
          margin-top: 20px;
        }

        .btn-pay {
          flex: 2;
          justify-content: center;
          font-size: 1.1em;
          padding: 16px;
          background: linear-gradient(135deg, #27ae60, #219a52);
        }

        .btn-cancel-payment {
          flex: 1;
          background: #95a5a6;
          color: white;
        }

        .btn-cancel-payment:hover {
          background: #7f8c8d;
        }

        .fake-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 15px;
          margin-bottom: 20px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          position: relative;
          overflow: hidden;
        }

        .fake-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          transform: rotate(30deg);
        }

        .fake-card-number {
          font-size: 1.4em;
          letter-spacing: 2px;
          margin: 20px 0;
          font-family: monospace;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .fake-card-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9em;
          opacity: 0.9;
        }

        .fake-card-info {
          font-size: 0.8em;
          opacity: 0.7;
          margin-top: 10px;
        }

        .test-cards {
          background: #fff8e1;
          border-radius: 10px;
          padding: 15px;
          margin-top: 20px;
          border: 2px dashed #f39c12;
          font-size: 0.85em;
        }

        .test-cards h4 {
          color: #f39c12;
          margin-bottom: 10px;
          font-size: 1em;
        }

        .test-cards ul {
          margin: 0;
          padding-left: 20px;
          color: #7f8c8d;
        }

        .test-cards li {
          margin-bottom: 5px;
          font-family: monospace;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .cart-container {
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

          .cart-item {
            flex-direction: column;
          }

          .cart-item-image img {
            width: 100%;
            height: 180px;
          }

          .cart-item-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .quantity-control {
            justify-content: space-between;
          }

          .checkout-action-buttons {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .payment-buttons {
            flex-direction: column;
          }

          .suggestions-grid {
            grid-template-columns: 1fr;
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

          .section-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .section-title h2 {
            font-size: 1.5em;
          }

          .card-row {
            grid-template-columns: 1fr;
          }
        }

        /* Scrollbar Styling */
        .order-items-list::-webkit-scrollbar {
          width: 6px;
        }

        .order-items-list::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .order-items-list::-webkit-scrollbar-thumb {
          background: #27ae60;
          border-radius: 10px;
        }

        .order-items-list::-webkit-scrollbar-thumb:hover {
          background: #219a52;
        }
      `}</style>
    </>
  );
};

export default Cart;
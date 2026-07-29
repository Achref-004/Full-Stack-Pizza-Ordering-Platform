const mongoose = require('mongoose');

const handleCustomPizzaId = (req, res, next) => {
  try {
    const { pizzaId, isCustom } = req.body;
    
    console.log('🛠️ Middleware customIdHandler - Données reçues:', {
      pizzaId,
      isCustom,
      body: req.body
    });
    
    // Si c'est une pizza personnalisée non sauvegardée, on crée un ID temporaire
    if (isCustom && (!pizzaId || pizzaId === 'custom' || pizzaId === 'surprise')) {
      const tempId = new mongoose.Types.ObjectId().toString();
      req.body.pizzaId = tempId;
      req.body.isCustom = true;
      console.log('🎨 ID temporaire généré pour pizza custom:', tempId);
    }
    
    // Si c'est une pizza personnalisée sauvegardée mais l'ID est un customPizzaId
    if (isCustom && pizzaId && pizzaId.startsWith('custom_')) {
      // On va chercher la pizza dans la base de données par customPizzaId
      // Pour le panier, on garde le customPizzaId comme pizzaId
      req.customPizzaId = pizzaId;
      console.log('🔍 Custom pizza détectée avec customPizzaId:', pizzaId);
    }
    
    // Si c'est une pizza normale avec ObjectId invalide (string vide ou undefined)
    if (!isCustom && pizzaId && !mongoose.Types.ObjectId.isValid(pizzaId)) {
      console.log('⚠️ PizzaId invalide pour pizza non-custom:', pizzaId);
      // Pour les pizzas normales, on ne peut pas avoir d'ID invalide
      // On pourrait soit:
      // 1. Rejeter la requête
      // 2. Chercher par customPizzaId si c'est le cas
      // Ici, on va juste logger l'erreur et continuer
    }
    
    console.log('🛠️ Middleware customIdHandler - Données après traitement:', {
      pizzaId: req.body.pizzaId,
      isCustom: req.body.isCustom,
      customPizzaId: req.customPizzaId
    });
    
    next();
  } catch (error) {
    console.error('❌ Erreur handleCustomPizzaId:', error);
    // On continue même en cas d'erreur pour ne pas bloquer le flux
    next();
  }
};

module.exports = {
  handleCustomPizzaId
};
const { Cart } = require('../model');
const mongoose = require('mongoose');

class CartRepository {
  // Récupérer le panier d'un utilisateur
  async findByUserId(userId) {
    return await Cart.findOne({ user: userId }).lean();
  }

  // Récupérer le panier d'un utilisateur (sans populate pour certaines opérations)
  async findCartByUserId(userId) {
    return await Cart.findOne({ user: userId });
  }

  // Créer un nouveau panier
  async create(userId) {
    const cart = new Cart({
      user: userId,
      items: [],
      total: 0
    });
    return await cart.save();
  }

  // Trouver ou créer un panier
  async findOrCreateCart(userId) {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await this.create(userId);
    }
    return cart;
  }

  // Ajouter un item au panier
  async addItem(userId, itemData) {
    const cart = await this.findOrCreateCart(userId);
    
    console.log('🛒 Ajout d\'item au panier:', {
      userId,
      itemData,
      existingItemsCount: cart.items.length
    });
    
    // S'assurer que pizzaId est valide
    let finalPizzaId = itemData.pizzaId;
    
    // Si c'est une pizza custom sans ID ou avec "custom" ou "surprise"
    if (itemData.isCustom && (!itemData.pizzaId || itemData.pizzaId === 'custom' || itemData.pizzaId === 'surprise')) {
      finalPizzaId = new mongoose.Types.ObjectId();
      console.log('🎨 ID généré pour pizza custom:', finalPizzaId);
    }
    // Si c'est un customPizzaId (commence par 'custom_')
    else if (typeof itemData.pizzaId === 'string' && itemData.pizzaId.startsWith('custom_')) {
      finalPizzaId = itemData.pizzaId;
      console.log('🔖 Utilisation du customPizzaId:', finalPizzaId);
    }
    // Si c'est un ObjectId valide mais en string
    else if (typeof itemData.pizzaId === 'string' && mongoose.Types.ObjectId.isValid(itemData.pizzaId)) {
      finalPizzaId = new mongoose.Types.ObjectId(itemData.pizzaId);
    }
    else {
      console.log('⚠️ Utilisation de l\'ID tel quel:', itemData.pizzaId);
    }
    
    // ✅ CORRECTION CRITIQUE : Calculer le prix unitaire AVANT toute opération
    const pricePerUnit = parseFloat(itemData.price) / parseInt(itemData.config.quantity);
    console.log('💰 Prix unitaire calculé:', {
      totalPrice: itemData.price,
      quantity: itemData.config.quantity,
      unitPrice: pricePerUnit
    });
    
    // Convertir en string pour la comparaison
    const newPizzaIdStr = finalPizzaId?.toString();
    
    console.log('🔍 Comparaison des IDs - Nouvel ID:', newPizzaIdStr);
    
    // Vérifier si l'item existe déjà avec la même configuration
    const existingItemIndex = cart.items.findIndex(item => {
      const itemPizzaIdStr = item.pizzaId?.toString();
      
      console.log('🔍 Comparaison avec item existant:', {
        itemPizzaIdStr,
        newPizzaIdStr,
        sameId: itemPizzaIdStr === newPizzaIdStr
      });
      
      // Comparer les pizzaId
      if (itemPizzaIdStr !== newPizzaIdStr) return false;
      
      // Comparer la configuration
      if (item.config.size !== itemData.config.size) return false;
      if (item.config.crust !== itemData.config.crust) return false;
      
      // Comparer les toppings (triés)
      const itemToppings = item.config.toppings?.sort() || [];
      const newToppings = itemData.config.toppings?.sort() || [];
      if (JSON.stringify(itemToppings) !== JSON.stringify(newToppings)) return false;
      
      // Comparer le statut custom
      if (item.isCustom !== itemData.isCustom) return false;
      
      return true;
    });

    if (existingItemIndex > -1) {
      // ✅ CORRECTION : Utiliser le prix unitaire stocké de l'item existant
      const existingItem = cart.items[existingItemIndex];
      const existingUnitPrice = existingItem.unitPrice || 
                                (existingItem.price / existingItem.config.quantity);
      
      console.log('📦 Item existant trouvé:', {
        currentQuantity: existingItem.config.quantity,
        currentPrice: existingItem.price,
        currentUnitPrice: existingUnitPrice,
        quantityToAdd: itemData.config.quantity
      });
      
      // Ajouter la quantité
      existingItem.config.quantity += parseInt(itemData.config.quantity);
      
      // Recalculer le prix total avec le prix unitaire ORIGINAL
      existingItem.price = existingUnitPrice * existingItem.config.quantity;
      
      // S'assurer que unitPrice est bien stocké
      existingItem.unitPrice = existingUnitPrice;
      
      console.log('🔄 Item mis à jour:', {
        newQuantity: existingItem.config.quantity,
        unitPrice: existingItem.unitPrice,
        newTotalPrice: existingItem.price
      });
    } else {
      // Ajouter un nouvel item
      const newItem = {
        pizzaId: finalPizzaId,
        pizzaName: itemData.pizzaName,
        config: itemData.config,
        price: parseFloat(itemData.price),
        unitPrice: pricePerUnit, // ✅ CRUCIAL : Stocker le prix unitaire
        isCustom: itemData.isCustom || false,
        customDescription: itemData.customDescription || ''
      };
      
      cart.items.push(newItem);
      console.log('✅ Nouvel item ajouté:', {
        id: finalPizzaId,
        quantity: itemData.config.quantity,
        unitPrice: pricePerUnit,
        totalPrice: itemData.price
      });
    }

    await cart.save();
    
    // Log final pour vérification
    console.log('💾 Panier sauvegardé:', {
      itemsCount: cart.items.length,
      total: cart.total
    });
    
    return cart;
  }

  // Mettre à jour la quantité d'un item
  async updateItemQuantity(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      throw new Error('Panier non trouvé');
    }

    const itemIndex = cart.items.findIndex(item => 
      item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      throw new Error('Item non trouvé dans le panier');
    }

    const item = cart.items[itemIndex];
    
    // ✅ CORRECTION : Utiliser le prix unitaire stocké ou le calculer UNE FOIS
    let pricePerUnit = item.unitPrice;
    
    // Si unitPrice n'existe pas (ancien item), le calculer et le sauvegarder
    if (!pricePerUnit) {
      pricePerUnit = item.price / item.config.quantity;
      item.unitPrice = pricePerUnit;
      console.log('⚠️ unitPrice manquant, calculé:', pricePerUnit);
    }
    
    console.log('🔄 Mise à jour quantité:', {
      itemId,
      oldQuantity: item.config.quantity,
      newQuantity: quantity,
      unitPrice: pricePerUnit
    });
    
    // Mettre à jour la quantité
    item.config.quantity = parseInt(quantity);
    
    // Recalculer le prix total avec le prix unitaire FIXE
    item.price = pricePerUnit * item.config.quantity;
    
    console.log('✅ Quantité mise à jour:', {
      quantity: item.config.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.price
    });

    await cart.save();
    return cart;
  }

  // Supprimer un item du panier
  async removeItem(userId, itemId) {
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      throw new Error('Panier non trouvé');
    }

    const itemToRemove = cart.items.find(item => item._id.toString() === itemId);
    
    if (itemToRemove) {
      console.log('🗑️ Suppression item:', {
        itemId,
        pizzaName: itemToRemove.pizzaName,
        quantity: itemToRemove.config.quantity,
        price: itemToRemove.price
      });
    }

    cart.items = cart.items.filter(item => 
      item._id.toString() !== itemId
    );

    await cart.save();
    
    console.log('✅ Item supprimé, items restants:', cart.items.length);
    
    return cart;
  }

  // Vider le panier
  async clearCart(userId) {
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      throw new Error('Panier non trouvé');
    }

    console.log('🗑️ Vidage du panier:', {
      userId,
      itemsCount: cart.items.length,
      total: cart.total
    });

    cart.items = [];
    cart.total = 0;
    
    await cart.save();
    
    console.log('✅ Panier vidé');
    
    return cart;
  }

  // Récupérer le nombre d'items dans le panier
  async getItemCount(userId) {
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return 0;
    }

    return cart.items.reduce((count, item) => count + item.config.quantity, 0);
  }

  // Récupérer le total du panier
  async getCartTotal(userId) {
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return 0;
    }

    return cart.total;
  }

  // Mettre à jour le panier
  async updateCart(userId, updateData) {
    return await Cart.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  // ✅ NOUVELLE MÉTHODE : Corriger les prix unitaires manquants (migration)
  async fixMissingUnitPrices(userId) {
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return null;
    }

    let modified = false;
    
    cart.items.forEach(item => {
      if (!item.unitPrice && item.price && item.config && item.config.quantity) {
        item.unitPrice = item.price / item.config.quantity;
        modified = true;
        console.log('🔧 Prix unitaire corrigé pour:', {
          pizzaName: item.pizzaName,
          unitPrice: item.unitPrice
        });
      }
    });

    if (modified) {
      await cart.save();
      console.log('✅ Panier corrigé pour userId:', userId);
    }

    return cart;
  }
}

module.exports = new CartRepository();
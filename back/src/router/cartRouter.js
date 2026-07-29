// router/cartRouter.js - CORRIGÉ
const express = require('express');
const cartService = require('../service/cartService');
const { authMiddleware } = require('../middleware/auth');
const { handleCustomPizzaId } = require('../middleware/customIdHandler');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes
router.get('/', (req, res) => cartService.getCart(req, res));
router.post('/add', handleCustomPizzaId, (req, res) => cartService.addToCart(req, res));
router.put('/item/:itemId/quantity', (req, res) => cartService.updateItemQuantity(req, res));
router.delete('/item/:itemId', (req, res) => cartService.removeItem(req, res));
router.delete('/clear', (req, res) => cartService.clearCart(req, res));
router.get('/count', (req, res) => cartService.getCartItemCount(req, res));
router.get('/total', (req, res) => cartService.calculateCartTotal(req, res));

// ✅ CORRECTION : Utiliser cartService (minuscule) au lieu de CartService
router.post('/fix-prices', (req, res) => cartService.fixCartPrices(req, res));

module.exports = router;
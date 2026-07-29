const express = require('express');
const orderService = require('../service/orderService');
const { authMiddleware } = require('../middleware/auth');
const { validateRequest, placeOrderSchema } = require('../schema');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Passer une commande
router.post('/place', validateRequest(placeOrderSchema), (req, res) => orderService.placeOrder(req, res));

// Récupérer les commandes de l'utilisateur
router.get('/my-orders', (req, res) => orderService.getUserOrders(req, res));

// Récupérer les détails d'une commande spécifique
router.get('/:id', (req, res) => orderService.getOrderDetails(req, res));

// Annuler une commande (si elle est encore en attente)
router.put('/:id/cancel', (req, res) => orderService.cancelOrder(req, res));

// Suivre une commande
router.get('/track/:orderNumber', (req, res) => orderService.trackOrder(req, res));

// Récupérer l'historique des commandes avec filtres
router.get('/history', (req, res) => orderService.getOrderHistory(req, res));

module.exports = router;
// src/router/adminOrderRouter.js
const express = require('express');
const adminOrderService = require('../service/adminOrderService');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// Liste des commandes
router.get('/', (req, res) => adminOrderService.getAllOrders(req, res));

// Mettre à jour le statut
router.put('/:id/status', (req, res) => adminOrderService.updateOrderStatus(req, res));

module.exports = router;
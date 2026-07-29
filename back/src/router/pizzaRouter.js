const express = require('express');
const pizzaService = require('../service/pizzaService');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Routes publiques
router.get('/', (req, res) => pizzaService.getAllPizzas(req, res));
router.get('/category/:category', (req, res) => pizzaService.getPizzasByCategory(req, res));
router.get('/search', (req, res) => pizzaService.searchPizzas(req, res));
router.get('/:id', (req, res) => pizzaService.getPizzaById(req, res));

// Routes protégées (admin uniquement)
router.post('/', authMiddleware, adminMiddleware, (req, res) => pizzaService.createPizza(req, res));
router.put('/:id', authMiddleware, adminMiddleware, (req, res) => pizzaService.updatePizza(req, res));
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => pizzaService.deletePizza(req, res));
router.get('/stats/all', authMiddleware, adminMiddleware, (req, res) => pizzaService.getPizzaStats(req, res));

module.exports = router;
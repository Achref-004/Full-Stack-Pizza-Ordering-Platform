// src/router/customPizzaRouter.js
const express = require('express');
const pizzaService = require('../service/pizzaService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Routes pour les pizzas personnalisées (authentification requise)
router.get('/my-pizzas', authMiddleware, (req, res) => pizzaService.getUserCustomPizzas(req, res));
router.post('/create', authMiddleware, (req, res) => pizzaService.createCustomPizza(req, res));
router.post('/', authMiddleware, (req, res) => pizzaService.createCustomPizza(req, res));
router.put('/:id', authMiddleware, (req, res) => pizzaService.updateCustomPizza(req, res));
router.delete('/:id', authMiddleware, (req, res) => pizzaService.deleteCustomPizza(req, res));
router.get('/:id', authMiddleware, (req, res) => pizzaService.getCustomPizzaById(req, res)); // Nouvelle route

// Route pour dupliquer une pizza en personnalisée
router.post('/duplicate/:pizzaId', authMiddleware, (req, res) => pizzaService.duplicateAsCustom(req, res));

// Routes publiques pour voir les pizzas personnalisées populaires
router.get('/popular', (req, res) => pizzaService.getPopularCustomPizzas(req, res));

// Routes admin pour voir toutes les pizzas personnalisées
router.get('/admin/all', authMiddleware, (req, res) => {
  // Vérifier si l'utilisateur est admin
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }
  return pizzaService.getAllCustomPizzas(req, res);
});

module.exports = router;
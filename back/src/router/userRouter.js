const express = require('express');
const userService = require('../service/userService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes de base
router.get('/profile', (req, res) => userService.getProfile(req, res));
router.put('/profile', (req, res) => userService.updateProfile(req, res));

// ==================== ROUTES FAVORIS ====================

// Récupérer toutes les pizzas favorites
router.get('/favorites', (req, res) => userService.getFavorites(req, res));

// Récupérer seulement les IDs des favoris
router.get('/favorites/ids', (req, res) => userService.getFavoritesIds(req, res));

// Ajouter une pizza aux favoris
router.post('/favorites/:pizzaId', (req, res) => userService.addToFavorites(req, res));

// Retirer une pizza des favoris
router.delete('/favorites/:pizzaId', (req, res) => userService.removeFromFavorites(req, res));

// Vérifier si une pizza est favorite
router.get('/favorites/check/:pizzaId', (req, res) => userService.checkFavorite(req, res));

// Basculer une pizza des favoris (ajouter/retirer)
router.post('/favorites/toggle/:pizzaId', (req, res) => userService.toggleFavorite(req, res));

// Vider tous les favoris
router.delete('/favorites', (req, res) => userService.clearFavorites(req, res));

// Récupérer le nombre de favoris
router.get('/favorites/count', (req, res) => userService.getFavoritesCount(req, res));

// Récupérer les pizzas populaires
router.get('/popular', (req, res) => userService.getPopularPizzas(req, res));

module.exports = router;
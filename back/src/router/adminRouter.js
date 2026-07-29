// src/router/adminRouter.js - VERSION COMPLÈTE CORRIGÉE
const express = require('express');
const adminService = require('../service/adminService');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// Récupérer TOUS les utilisateurs
router.get('/users', (req, res) => adminService.getAllUsers(req, res));

// Récupérer UN utilisateur spécifique (NOUVELLE ROUTE)
router.get('/users/:id', (req, res) => adminService.getUserById(req, res));

router.get('/stats', (req, res) => adminService.getStats(req, res));
router.put('/users/:id', (req, res) => adminService.updateUser(req, res));
router.delete('/users/:id', (req, res) => adminService.deleteUser(req, res));

module.exports = router;
const express = require('express');
const authService = require('../service/authService');
const { registerSchema, adminRegisterSchema, loginSchema, validateRequest } = require('../schema');

const router = express.Router();


router.post('/register', validateRequest(registerSchema), (req, res) =>
  authService.register(req, res)
);

router.post('/register-admin', validateRequest(adminRegisterSchema), (req, res) =>
  authService.registerAdmin(req, res)
);

router.post('/login', validateRequest(loginSchema), (req, res) =>
  authService.login(req, res)
);


module.exports = router;
const { verifyToken } = require('../config/jwt');
const { User } = require('../model');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erreur auth middleware:', error);
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Accès admin requis'
    });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
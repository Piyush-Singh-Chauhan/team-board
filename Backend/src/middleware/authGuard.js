import { checkToken } from '../utils/jwt.js';
import User from '../models/User.js';

export const authGuard = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'invalid token',
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = checkToken(token);
      
      const user = await User.findById(decoded.userId).select('-passwordHash');
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (err) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }
  } catch (err) {
    next(err);
  }
};

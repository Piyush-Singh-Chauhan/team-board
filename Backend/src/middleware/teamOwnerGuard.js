export const teamOwnerGuard = (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!req.team) {
      res.status(500).json({
        success: false,
        message: 'Team context missing',
      });
      return;
    }

    const userId = req.user.userId;
    const isOwner = req.team.members.some(
      (member) => member.role === 'owner' && member.userId.toString() === userId
    );

    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'Only team owners can perform this action',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};



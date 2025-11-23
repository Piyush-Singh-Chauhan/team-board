import mongoose from 'mongoose';
import Team from '../models/Team.js';
import Board from '../models/Board.js';
import Card from '../models/Card.js';

export const teamGuard = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const userId = req.user.userId;
    let teamId = null;

    if (req.params.teamId) {
      if (!mongoose.Types.ObjectId.isValid(req.params.teamId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid team ID',
        });
        return;
      }
      teamId = req.params.teamId;
    } else if (req.params.boardId) {
      if (!mongoose.Types.ObjectId.isValid(req.params.boardId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid board ID',
        });
        return;
      }
      const board = await Board.findById(req.params.boardId);
      if (!board) {
        res.status(404).json({
          success: false,
          message: 'Board not found',
        });
        return;
      }
      teamId = board.teamId.toString();
    } else if (req.params.cardId) {
      if (!mongoose.Types.ObjectId.isValid(req.params.cardId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid card ID',
        });
        return;
      }
      const card = await Card.findById(req.params.cardId).populate('boardId');
      if (!card) {
        res.status(404).json({
          success: false,
          message: 'Card not found',
        });
        return;
      }
      const board = await Board.findById(card.boardId);
      if (!board) {
        res.status(404).json({
          success: false,
          message: 'Board not found',
        });
        return;
      }
      teamId = board.teamId.toString();
    }

    if (!teamId) {
      res.status(400).json({
        success: false,
        message: 'Team ID is required',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid team ID',
      });
      return;
    }

    const team = await Team.findById(teamId);

    if (!team) {
      res.status(404).json({
        success: false,
        message: 'Team not found',
      });
      return;
    }

    const isMember = team.members.some(
      (member) => member.userId.toString() === userId
    );

    if (!isMember) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this team',
      });
      return;
    }

    req.team = team;
    next();
  } catch (error) {
    next(error);
  }
};

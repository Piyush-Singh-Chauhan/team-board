import Board from '../models/Board.js';
import Card from '../models/Card.js';

export const addBoard = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { name, description } = req.body;

    const board = await Board.create({
      teamId,
      name: name.trim(),
      description: description?.trim(),
    });

    const populatedBoard = await Board.findById(board._id)
      .populate('teamId', 'name');

    res.status(201).json({
      success: true,
      message: 'Board created successfully',
      data: populatedBoard,
    });
  } catch (error) {
    next(error);
  }
};

export const getBoards = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const boards = await Board.find({ teamId })
      .populate('teamId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: boards,
    });
  } catch (error) {
    next(error);
  }
};

export const getBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;

    const board = await Board.findById(boardId)
      .populate('teamId', 'name');

    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found',
      });
      return;
    }

    const cards = await Card.find({ boardId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const boardWithCards = {
      ...board.toObject(),
      cards: cards.reduce((acc, card) => {
        if (!acc[card.columnId]) {
          acc[card.columnId] = [];
        }
        acc[card.columnId].push(card);
        return acc;
      }, {}),
    };

    res.json({
      success: true,
      data: boardWithCards,
    });
  } catch (error) {
    next(error);
  }
};

export const editBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { name, description } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found',
      });
      return;
    }

    if (name) board.name = name.trim();
    if (description !== undefined) board.description = description?.trim();

    await board.save();

    const updatedBoard = await Board.findById(boardId)
      .populate('teamId', 'name');

    res.json({
      success: true,
      message: 'Board updated successfully',
      data: updatedBoard,
    });
  } catch (error) {
    next(error);
  }
};

export const moveCards = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { sourceColumnId, destinationColumnId, sourceIndex, destinationIndex, cardId } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found',
      });
      return;
    }

    const sourceColumn = board.columns.find(col => col.id === sourceColumnId);
    const destinationColumn = board.columns.find(col => col.id === destinationColumnId);

    if (!sourceColumn || !destinationColumn) {
      res.status(400).json({
        success: false,
        message: 'Invalid column IDs',
      });
      return;
    }

    const cardIndex = sourceColumn.cardOrder.findIndex(
      id => id.toString() === cardId
    );

    if (cardIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'Card not found in source column',
      });
      return;
    }

    const [cardObjectId] = sourceColumn.cardOrder.splice(cardIndex, 1);

    destinationColumn.cardOrder.splice(destinationIndex, 0, cardObjectId);

    if (sourceColumnId !== destinationColumnId) {
      await Card.findByIdAndUpdate(cardId, {
        columnId: destinationColumnId,
        status: destinationColumnId,
      });
    }

    await board.save();

    res.json({
      success: true,
      message: 'Cards reordered successfully',
      data: board,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found',
      });
      return;
    }

    // Delete all cards associated with this board
    await Card.deleteMany({ boardId });

    // Delete the board
    await Board.findByIdAndDelete(boardId);

    res.json({
      success: true,
      message: 'Board deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

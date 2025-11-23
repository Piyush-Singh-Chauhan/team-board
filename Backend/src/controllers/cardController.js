import Card from '../models/Card.js';
import Board from '../models/Board.js';

export const addCard = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { title, description, columnId = 'todo', assignedTo, dueDate, priority = 'medium' } = req.body;
    const userId = req.user.userId;

    const board = await Board.findById(boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found',
      });
      return;
    }

    const card = await Card.create({
      boardId,
      title: title.trim(),
      description: description?.trim() || undefined,
      columnId,
      status: columnId,
      assignedTo: assignedTo && assignedTo.trim() !== '' ? assignedTo : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
      createdBy: userId,
    });

    const column = board.columns.find(col => col.id === columnId);
    if (column) {
      column.cardOrder.push(card._id);
      await board.save();
    }

    const populatedCard = await Card.findById(card._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('boardId', 'name');

    res.status(201).json({
      success: true,
      message: 'Card created successfully',
      data: populatedCard,
    });
  } catch (error) {
    next(error);
  }
};

export const editCard = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const { title, description, columnId, assignedTo, dueDate, priority, status } = req.body;

    const card = await Card.findById(cardId);
    if (!card) {
      res.status(404).json({
        success: false,
        message: 'Card not found',
      });
      return;
    }

    const oldColumnId = card.columnId.toString();
    let newColumnId = columnId || status;

    if (status && !columnId) {
      newColumnId = status;
    }

    if (title) card.title = title.trim();
    if (description !== undefined) card.description = description?.trim() || undefined;
    if (assignedTo !== undefined) {
      card.assignedTo = assignedTo && assignedTo.trim() !== '' ? assignedTo : undefined;
    }
    if (dueDate !== undefined) card.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority) card.priority = priority;
    if (status) card.status = status;
    if (newColumnId) {
      card.columnId = newColumnId;
      card.status = newColumnId;
    }

    await card.save();

    if (newColumnId && newColumnId !== oldColumnId) {
      const board = await Board.findById(card.boardId);
      if (board) {
        board.columns.forEach(col => {
          const index = col.cardOrder.findIndex(id => id.toString() === cardId);
          if (index !== -1) {
            col.cardOrder.splice(index, 1);
          }
        });

        const newColumn = board.columns.find(col => col.id === newColumnId);
        if (newColumn) {
          newColumn.cardOrder.push(card._id);
        }

        await board.save();
      }
    }

    const populatedCard = await Card.findById(cardId)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('boardId', 'name');

    res.json({
      success: true,
      message: 'Card updated successfully',
      data: populatedCard,
    });
  } catch (error) {
    next(error);
  }
};

export const removeCard = async (req, res, next) => {
  try {
    const { cardId } = req.params;

    const card = await Card.findById(cardId);
    if (!card) {
      res.status(404).json({
        success: false,
        message: 'Card not found',
      });
      return;
    }

    const board = await Board.findById(card.boardId);
    if (board) {
      board.columns.forEach(col => {
        const index = col.cardOrder.findIndex(id => id.toString() === cardId);
        if (index !== -1) {
          col.cardOrder.splice(index, 1);
        }
      });
      await board.save();
    }

    await Card.findByIdAndDelete(cardId);

    res.json({
      success: true,
      message: 'Card deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

import Card from '../models/Card.js';
import Board from '../models/Board.js';

export const getTaskStats = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const boards = await Board.find({ teamId }).select('_id');
    const boardIds = boards.map(board => board._id);

    const tasksPerMember = await Card.aggregate([
      {
        $match: {
          boardId: { $in: boardIds },
          assignedTo: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$assignedTo',
          totalTasks: { $sum: 1 },
          todoTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] },
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] },
          },
          doneTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          totalTasks: 1,
          todoTasks: 1,
          inProgressTasks: 1,
          doneTasks: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: tasksPerMember,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeadlines = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const boards = await Board.find({ teamId }).select('_id');
    const boardIds = boards.map(board => board._id);

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const now = new Date();

    const nearDeadlineCards = await Card.find({
      boardId: { $in: boardIds },
      dueDate: {
        $gte: now,
        $lte: threeDaysFromNow,
      },
      status: { $ne: 'done' },
    })
      .populate('assignedTo', 'name email')
      .populate('boardId', 'name')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: nearDeadlineCards,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompletion = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const boards = await Board.find({ teamId }).select('_id');
    const boardIds = boards.map(board => board._id);

    const completionStats = await Card.aggregate([
      {
        $match: {
          boardId: { $in: boardIds },
        },
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          doneTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
          },
          todoTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] },
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalTasks: 1,
          doneTasks: 1,
          todoTasks: 1,
          inProgressTasks: 1,
          completionPercentage: {
            $cond: [
              { $eq: ['$totalTasks', 0] },
              0,
              {
                $multiply: [
                  {
                    $divide: ['$doneTasks', '$totalTasks'],
                  },
                  100,
                ],
              },
            ],
          },
        },
      },
    ]);

    const result = completionStats[0] || {
      totalTasks: 0,
      doneTasks: 0,
      todoTasks: 0,
      inProgressTasks: 0,
      completionPercentage: 0,
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

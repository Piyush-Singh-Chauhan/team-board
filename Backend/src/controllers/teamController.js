import Team from '../models/Team.js';
import User from '../models/User.js';
import Board from '../models/Board.js';
import Card from '../models/Card.js';
import TeamInvite from '../models/TeamInvite.js';

export const addTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId;

    const team = await Team.create({
      name: name.trim(),
      description: description?.trim(),
      members: [
        {
          userId,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      createdBy: userId,
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('members.userId', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: populatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeams = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const teams = await Team.find({
      'members.userId': userId,
    })
      .populate('members.userId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: teams,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate('members.userId', 'name email')
      .populate('createdBy', 'name email');

    if (!team) {
      res.status(404).json({
        success: false,
        message: 'Team not found',
      });
      return;
    }

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

export const editTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { name, description } = req.body;
    const team = req.team;

    if (name) team.name = name.trim();
    if (description !== undefined) team.description = description?.trim();

    await team.save();

    const updatedTeam = await Team.findById(teamId)
      .populate('members.userId', 'name email')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: updatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { email, role = 'member' } = req.body;
    const team = req.team;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const isMember = team.members.some(
      (member) => member.userId.toString() === user._id.toString()
    );

    if (isMember) {
      res.status(400).json({
        success: false,
        message: 'User is already a member of this team',
      });
      return;
    }

    team.members.push({
      userId: user._id,
      role,
      joinedAt: new Date(),
    });

    await team.save();

    const updatedTeam = await Team.findById(teamId)
      .populate('members.userId', 'name email')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Member added successfully',
      data: updatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTeam = async (req, res, next) => {
  try {
    const team = req.team;
    const teamId = team._id;

    const boards = await Board.find({ teamId });
    const boardIds = boards.map((board) => board._id);

    if (boardIds.length > 0) {
      await Card.deleteMany({ boardId: { $in: boardIds } });
      await Board.deleteMany({ _id: { $in: boardIds } });
    }

    await TeamInvite.deleteMany({ teamId });

    await Team.findByIdAndDelete(teamId);

    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

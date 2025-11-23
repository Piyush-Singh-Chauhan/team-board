import Team from '../models/Team.js';
import TeamInvite from '../models/TeamInvite.js';
import User from '../models/User.js';

const ensureInviteNotExpired = async (invite) => {
  if (!invite) {
    return null;
  }

  if (invite.status !== 'pending') {
    return invite;
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    invite.status = 'expired';
    invite.respondedAt = new Date();
    await invite.save();
  }

  return invite;
};

export const sendTeamInvite = async (req, res, next) => {
  try {
    const { inviteeId, role = 'member' } = req.body;
    const team = req.team;
    const inviterId = req.user.userId;

    const invitee = await User.findById(inviteeId);
    if (!invitee) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const isAlreadyMember = team.members.some(
      (member) => member.userId.toString() === invitee._id.toString()
    );

    if (isAlreadyMember) {
      res.status(400).json({
        success: false,
        message: 'User is already a member of this team',
      });
      return;
    }

    const existingInvite = await TeamInvite.findOne({
      teamId: team._id,
      inviteeId: invitee._id,
      status: 'pending',
    });

    if (existingInvite) {
      res.status(400).json({
        success: false,
        message: 'An invite is already pending for this user',
      });
      return;
    }

    const invite = await TeamInvite.create({
      teamId: team._id,
      inviterId,
      inviteeId: invitee._id,
      email: invitee.email,
      role,
    });

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        inviteId: invite._id,
        teamId: invite.teamId,
        invitee: {
          id: invitee._id,
          name: invitee.name,
          email: invitee.email,
        },
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyInvites = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const invites = await TeamInvite.find({
      inviteeId: userId,
      status: { $in: ['pending', 'accepted'] },
    })
      .populate('teamId', 'name description')
      .populate('inviterId', 'name email');

    const processedInvites = [];

    for (const invite of invites) {
      const refreshedInvite = await ensureInviteNotExpired(invite);
      if (refreshedInvite.status === 'pending') {
        processedInvites.push(refreshedInvite);
      }
    }

    res.json({
      success: true,
      data: processedInvites.map((invite) => ({
        id: invite._id,
        team: invite.teamId
          ? {
              id: invite.teamId._id,
              name: invite.teamId.name,
              description: invite.teamId.description,
            }
          : null,
        inviter: invite.inviterId
          ? {
              id: invite.inviterId._id,
              name: invite.inviterId.name,
              email: invite.inviterId.email,
            }
          : null,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const respondToInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.params;
    const { action } = req.body;
    const userId = req.user.userId;

    const invite = await TeamInvite.findById(inviteId);

    if (!invite) {
      res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
      return;
    }

    if (invite.inviteeId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to respond to this invite',
      });
      return;
    }

    await ensureInviteNotExpired(invite);

    if (invite.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Invite already ${invite.status}`,
      });
      return;
    }

    if (!['accept', 'decline'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Invalid action. Allowed values are accept or decline',
      });
      return;
    }

    invite.status = action === 'accept' ? 'accepted' : 'declined';
    invite.respondedAt = new Date();
    await invite.save();

    if (action === 'accept') {
      const team = await Team.findById(invite.teamId);
      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      const isAlreadyMember = team.members.some(
        (member) => member.userId.toString() === userId.toString()
      );

      if (!isAlreadyMember) {
        team.members.push({
          userId,
          role: invite.role,
          joinedAt: new Date(),
        });
        await team.save();
      }
    }

    res.json({
      success: true,
      message: `Invite ${action}ed successfully`,
      data: {
        inviteId: invite._id,
        status: invite.status,
      },
    });
  } catch (error) {
    next(error);
  }
};



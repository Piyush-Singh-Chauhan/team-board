import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeam } from '../api/teams.js';
import { getBoards, addBoard as addBoardAPI, editBoard as editBoardAPI, deleteBoard as deleteBoardAPI } from '../api/boards.js';
import { getCompletion, getDeadlines } from '../api/reports.js';
import { FiPlus, FiTrello, FiUsers, FiAlertCircle, FiArrowLeft, FiBarChart2, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import Modal from '../components/ui/Modal.jsx';
import Header from '../components/header/Header.jsx';
import { sendTeamInvite } from '../api/invitations.js';
import { getAllUsers } from '../api/users.js';
import { getAuthToken } from '../api/client.js';
import Swal from 'sweetalert2';

const normalizeWhitespace = (value = '') => value.replace(/\s+/g, ' ').trim();

const ensureFirstLetterCapital = (value = '') => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return '';
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const validateBoardName = (value) => {
  const formatted = ensureFirstLetterCapital(value);

  if (!formatted) {
    return 'Board name is required';
  }

  if (formatted.length < 2) {
    return 'Board name must be at least 2 characters';
  }

  if (formatted.length > 50) {
    return 'Board name cannot exceed 50 characters';
  }

  if (!/^[A-Z][A-Za-z0-9\s'-.]*$/.test(formatted)) {
    return 'Board name must start with a capital letter and can include letters, numbers, spaces, apostrophes.';
  }

  return '';
};

const validateBoardDescription = (value) => {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return '';
  }

  if (normalized.length > 150) {
    return 'Description cannot exceed 150 characters';
  }

  return '';
};

const Team = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [boardError, setBoardError] = useState('');
  const [inviteeIds, setInviteeIds] = useState([]);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [completionStats, setCompletionStats] = useState(null);
  const [nearDeadlines, setNearDeadlines] = useState([]);
  const [boardFieldErrors, setBoardFieldErrors] = useState({ name: '', description: '' });
  const [boardTouched, setBoardTouched] = useState({ name: false, description: false });
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [inviteSearchTerm, setInviteSearchTerm] = useState('');

  useEffect(() => {
    fetchTeamData();
    fetchReports();
    fetchAllUsers();
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const [teamData, boardsData] = await Promise.all([
        getTeam(teamId),
        getBoards(teamId),
      ]);

      if (teamData.success) setTeam(teamData.data);
      if (boardsData.success) setBoards(boardsData.data);
    } catch (err) {
      console.error('Error fetching team data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const [completion, deadlines] = await Promise.all([
        getCompletion(teamId),
        getDeadlines(teamId),
      ]);

      if (completion.success) setCompletionStats(completion.data);
      if (deadlines.success) setNearDeadlines(deadlines.data);
    } catch (err) {
      console.error('Errors:', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success) {
        setAllUsers(result.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const inviteOptions = useMemo(() => {
    const memberIds = new Set(
      (team?.members || []).map((member) => {
        const value = member.userId?._id || member.userId;
        return value ? value.toString() : '';
      })
    );

    return allUsers.map((user) => {
      const id = user.id?.toString() || '';
      return {
        id,
        name: user.name,
        email: user.email,
        isMember: memberIds.has(id),
      };
    });
  }, [allUsers, team]);

  const hasSelectableInvitees = useMemo(
    () => inviteOptions.some((option) => !option.isMember),
    [inviteOptions]
  );

  const filteredInviteOptions = useMemo(() => {
    if (!inviteSearchTerm.trim()) {
      return inviteOptions;
    }
    
    const searchLower = inviteSearchTerm.toLowerCase().trim();
    return inviteOptions.filter((user) => {
      const emailMatch = user.email?.toLowerCase().includes(searchLower);
      const nameMatch = user.name?.toLowerCase().includes(searchLower);
      const idMatch = user.id?.toLowerCase().includes(searchLower);
      return emailMatch || nameMatch || idMatch;
    });
  }, [inviteOptions, inviteSearchTerm]);

  const handleBoardFieldChange = (field) => (event) => {
    const { value } = event.target;

    if (field === 'name') {
      setBoardName(value);
    } else {
      setBoardDescription(value);
    }

    // Validate immediately on change
    setBoardFieldErrors((prev) => ({
      ...prev,
      [field]: field === 'name' ? validateBoardName(value) : validateBoardDescription(value),
    }));
  };

  const handleBoardBlur = (field) => () => {
    setBoardTouched((prev) => ({ ...prev, [field]: true }));

    let value = field === 'name' ? boardName : boardDescription;

    if (field === 'name') {
      const formatted = ensureFirstLetterCapital(value);
      if (formatted !== boardName) {
        setBoardName(formatted);
      }
      value = formatted;
    } else {
      const normalized = normalizeWhitespace(value);
      if (normalized !== boardDescription) {
        setBoardDescription(normalized);
      }
      value = normalized;
    }

    setBoardFieldErrors((prev) => ({
      ...prev,
      [field]: field === 'name' ? validateBoardName(value) : validateBoardDescription(value),
    }));
  };

  const validateCreateBoardForm = () => {
    const formattedName = ensureFirstLetterCapital(boardName);
    const normalizedDescription = normalizeWhitespace(boardDescription);

    setBoardName(formattedName);
    setBoardDescription(normalizedDescription);

    const newErrors = {
      name: validateBoardName(formattedName),
      description: validateBoardDescription(normalizedDescription),
    };

    setBoardFieldErrors(newErrors);
    setBoardTouched({ name: true, description: true });

    return Object.values(newErrors).every((message) => !message);
  };

  const getUserIdFromToken = () => {
    try {
      const token = getAuthToken();
      if (!token) return null;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      return decoded.userId || decoded.id || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const isTeamOwner = () => {
    if (!team) return false;
    const userId = getUserIdFromToken();
    if (!userId) return false;
    const userIdStr = userId.toString();
    
    if (team.members && Array.isArray(team.members)) {
      const isOwnerInMembers = team.members.some(
        (member) => {
          const memberUserId = member.userId?._id?.toString() || member.userId?.toString() || member.userId;
          return memberUserId === userIdStr && member.role === 'owner';
        }
      );
      if (isOwnerInMembers) return true;
    }
    
    const createdBy = team.createdBy?._id?.toString() || team.createdBy?.toString() || team.createdBy;
    if (createdBy === userIdStr) return true;
    
    return false;
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setBoardError('');
    if (!validateCreateBoardForm()) {
      return;
    }
    try {
      const payload = {
        name: ensureFirstLetterCapital(boardName),
        description: normalizeWhitespace(boardDescription) || undefined,
      };

      const result = await addBoardAPI(teamId, {
        name: payload.name,
        description: payload.description,
      });

      if (result.success) {
        setShowCreateModal(false);
        setBoardName('');
        setBoardDescription('');
        setBoardFieldErrors({ name: '', description: '' });
        setBoardTouched({ name: false, description: false });
        setBoardError('');
        await fetchTeamData();
      } else {
        setBoardError(result.message || 'Failed to create board');
      }
    } catch (err) {
      setBoardError(err.response?.data?.message || 'Failed to create board');
    }
  };

  const handleEditClick = (e, board) => {
    e.stopPropagation();
    setEditingBoard(board);
    setBoardName(board.name || '');
    setBoardDescription(board.description || '');
    setBoardFieldErrors({ name: '', description: '' });
    setBoardTouched({ name: false, description: false });
    setBoardError('');
    setShowEditModal(true);
  };

  const handleEditBoard = async (e) => {
    e.preventDefault();
    setBoardError('');

    if (!validateCreateBoardForm()) {
      return;
    }

    if (!editingBoard) return;

    try {
      const payload = {
        name: ensureFirstLetterCapital(boardName),
        description: normalizeWhitespace(boardDescription) || undefined,
      };

      const result = await editBoardAPI(editingBoard._id, {
        name: payload.name,
        description: payload.description,
      });

      if (result.success) {
        setShowEditModal(false);
        setEditingBoard(null);
        setBoardName('');
        setBoardDescription('');
        setBoardFieldErrors({ name: '', description: '' });
        setBoardTouched({ name: false, description: false });
        await fetchTeamData();
      } else {
        setBoardError(result.message || 'Failed to update board');
      }
    } catch (err) {
      setBoardError(err.response?.data?.message || 'Failed to update board');
    }
  };

  const handleDeleteClick = async (e, board) => {
    e.stopPropagation();
    
    const result = await Swal.fire({
      title: 'Delete Board?',
      text: `Are you sure you want to delete "${board.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel',
      reverseButtons: true,
      focusConfirm: false,
    });

    if (result.isConfirmed) {
      await handleDeleteBoard(board._id);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    try {
      const result = await deleteBoardAPI(boardId);
      if (result.success) {
        await fetchTeamData();
        await Swal.fire({
          title: 'Deleted!',
          text: 'Board has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          confirmButtonText: 'OK',
        });
      } else {
        await Swal.fire({
          title: 'Error!',
          text: result.message || 'Failed to delete board',
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'OK',
        });
      }
    } catch (err) {
      await Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to delete board',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!inviteeIds || inviteeIds.length === 0) {
      setInviteError('Please select at least one user to invite');
      return;
    }

    setInviteLoading(true);

    try {
      const invitePromises = inviteeIds.map(inviteeId => sendTeamInvite(teamId, inviteeId));
      const results = await Promise.allSettled(invitePromises);

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

      if (successful > 0) {
        if (failed === 0) {
          setInviteSuccess(`Successfully sent ${successful} invitation${successful > 1 ? 's' : ''}`);
        } else {
          setInviteSuccess(`Successfully sent ${successful} invitation${successful > 1 ? 's' : ''}. ${failed} failed.`);
        }
        setInviteeIds([]);
        await fetchTeamData();
      } else {
        setInviteError('Failed to send invitations. Please try again.');
      }
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to invite members');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Team not found</h2>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-4">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6"
        >
          <FiArrowLeft className="h-5 w-5" />
          Back to Teams
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{team.name}</h1>
          {team.description && <p className="text-gray-600">{team.description}</p>}
          <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
            <button
              onClick={() => setShowMembersModal(true)}
              className="flex items-center gap-2 hover:text-primary-600 transition-colors cursor-pointer"
            >
              <FiUsers className="h-5 w-5" />
              <span>{team.members?.length || 0} members</span>
            </button>
          </div>
        </div>

        {completionStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion</p>
                  <p className="text-3xl font-bold text-primary-600 mt-1">
                    {completionStats.completionPercentage.toFixed(1)}%
                  </p>
                </div>
                <FiBarChart2 className="h-12 w-12 text-primary-200" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div >
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {completionStats.totalTasks || 0}
                  </p>
                </div>
                <FiTrello className="h-12 w-12 text-gray-200" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Near Deadlines</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">
                    {nearDeadlines.length || 0}
                  </p>
                </div>
                <FiAlertCircle className="h-12 w-12 text-orange-200" />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-semibold text-gray-900">Boards</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <FiUsers className="h-5 w-5" />
              Invite Member
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <FiPlus className="h-5 w-5" />
              Create Board
            </button>
          </div>
        </div>

        {boards.length === 0 ? (
          <div className="card text-center py-12">
            <FiTrello className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No boards yet</h3>
            <p className="text-gray-600 mb-6">Create your first board to organize tasks</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              Create Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => {
              const owner = isTeamOwner();
              return (
              <div
                key={board._id}
                  className="card hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                onClick={() => navigate(`/boards/${board._id}`)}
              >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate" title={board.name}>{board.name}</h3>
                      <div className="min-h-[2.5rem]">
                        {board.description ? (
                          <p className="text-sm text-gray-600 line-clamp-2" title={board.description}>{board.description}</p>
                        ) : null}
                      </div>
                    </div>
                    {owner && (
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <button
                          onClick={(e) => handleEditClick(e, board)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit Board"
                          type="button"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, board)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Board"
                          type="button"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200 mt-auto">
                  <span>Click to open</span>
                  <FiTrello className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setBoardName('');
          setBoardDescription('');
          setBoardFieldErrors({ name: '', description: '' });
          setBoardTouched({ name: false, description: false });
          setBoardError('');
        }}
        title="Create New Board"
      >
        <form onSubmit={handleCreateBoard} className="space-y-4" noValidate>
          {boardError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {boardError}
            </div>
          )}

          <div>
            <label htmlFor="boardName" className="block text-sm font-medium text-gray-700 mb-2">
              Board Name
            </label>
            <input
              id="boardName"
              type="text"
              value={boardName}
              onChange={handleBoardFieldChange('name')}
              onBlur={handleBoardBlur('name')}
              className={`input ${boardFieldErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={boardFieldErrors.name ? 'true' : 'false'}
              aria-describedby={boardFieldErrors.name ? 'board-name-error' : undefined}
              placeholder="Enter board name"
              required
              maxLength={50}
              minLength={2}
            />
            {boardFieldErrors.name && (
              <p id="board-name-error" className="mt-2 text-sm text-red-600">
                {boardFieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="boardDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="boardDescription"
              value={boardDescription}
              onChange={handleBoardFieldChange('description')}
              onBlur={handleBoardBlur('description')}
              className={`input ${boardFieldErrors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={boardFieldErrors.description ? 'true' : 'false'}
              aria-describedby={boardFieldErrors.description ? 'board-description-error' : undefined}
              rows={3}
              placeholder="Enter board description"
              maxLength={150}
            />
            <p className="mt-1 text-xs text-gray-500">Optional, up to 150 characters</p>
            {boardFieldErrors.description && (
              <p id="board-description-error" className="mt-2 text-sm text-red-600">
                {boardFieldErrors.description}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setBoardName('');
                setBoardDescription('');
                setBoardFieldErrors({ name: '', description: '' });
                setBoardTouched({ name: false, description: false });
                setBoardError('');
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Board
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingBoard(null);
          setBoardName('');
          setBoardDescription('');
          setBoardError('');
          setBoardFieldErrors({ name: '', description: '' });
          setBoardTouched({ name: false, description: false });
        }}
        title="Edit Board"
      >
        <form onSubmit={handleEditBoard} className="space-y-4" noValidate>
          {boardError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {boardError}
            </div>
          )}

          <div>
            <label htmlFor="editBoardName" className="block text-sm font-medium text-gray-700 mb-2">
              Board Name
            </label>
            <input
              id="editBoardName"
              type="text"
              value={boardName}
              onChange={handleBoardFieldChange('name')}
              onBlur={handleBoardBlur('name')}
              className={`input ${boardFieldErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={boardFieldErrors.name ? 'true' : 'false'}
              aria-describedby={boardFieldErrors.name ? 'edit-board-name-error' : undefined}
              placeholder="Enter board name"
              required
              maxLength={50}
              minLength={2}
            />
            {boardFieldErrors.name && (
              <p id="edit-board-name-error" className="mt-2 text-sm text-red-600">
                {boardFieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="editBoardDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="editBoardDescription"
              value={boardDescription}
              onChange={handleBoardFieldChange('description')}
              onBlur={handleBoardBlur('description')}
              className={`input ${boardFieldErrors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={boardFieldErrors.description ? 'true' : 'false'}
              aria-describedby={boardFieldErrors.description ? 'edit-board-description-error' : undefined}
              rows={3}
              placeholder="Enter board description"
              maxLength={150}
            />
            <p className="mt-1 text-xs text-gray-500">Optional, up to 150 characters</p>
            {boardFieldErrors.description && (
              <p id="edit-board-description-error" className="mt-2 text-sm text-red-600">
                {boardFieldErrors.description}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingBoard(null);
                setBoardName('');
                setBoardDescription('');
                setBoardError('');
                setBoardFieldErrors({ name: '', description: '' });
                setBoardTouched({ name: false, description: false });
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update Board
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteeIds([]);
          setInviteError('');
          setInviteSuccess('');
          setInviteLoading(false);
          setInviteSearchTerm('');
        }}
        title="Invite Member"
      >
        <form onSubmit={handleInviteMember} className="space-y-4" noValidate>
          {inviteError && (
            <div id="invite-error-message" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {inviteError}
            </div>
          )}

          {inviteSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {inviteSuccess}
            </div>
          )}

          <div className="relative" style={{ zIndex: 1 }}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select to Invite
            </label>
            
            {/* Search Input */}
            <div className="mb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={inviteSearchTerm}
                  onChange={(e) => setInviteSearchTerm(e.target.value)}
                  placeholder="Search by email, name, or ID..."
                  className="input pl-10 w-full"
                />
                {inviteSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setInviteSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <span className="text-gray-400 hover:text-gray-600 text-sm">Clear</span>
                  </button>
                )}
              </div>
            </div>

            <div className={`border rounded-lg p-4 max-h-64 overflow-y-auto ${inviteError ? 'border-red-500' : 'border-gray-300'}`}>
              {inviteOptions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No one found in the workspace.
                </p>
              ) : !hasSelectableInvitees ? (
                <p className="text-sm text-gray-500">
                  All are already members.
                </p>
              ) : filteredInviteOptions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No users found matching &quot;{inviteSearchTerm}&quot;
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredInviteOptions.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        user.isMember
                          ? 'opacity-50 cursor-not-allowed bg-gray-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={inviteeIds.includes(user.id)}
                        onChange={(e) => {
                          if (user.isMember) return;
                          if (e.target.checked) {
                            setInviteeIds([...inviteeIds, user.id]);
                          } else {
                            setInviteeIds(inviteeIds.filter(id => id !== user.id));
                          }
                        }}
                        disabled={user.isMember}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {user.email}
                        </div>
                        {user.name && (
                          <div className="text-xs text-gray-500">
                            {user.name}
                          </div>
                        )}
                      </div>
                      {user.isMember && (
                        <span className="text-xs text-gray-500">(Already in team)</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
            {inviteeIds.length > 0 && (
              <p className="mt-2 text-sm text-primary-600">
                {inviteeIds.length} user{inviteeIds.length > 1 ? 's' : ''} selected
              </p>
            )}
            {inviteError && (
              <p id="invite-error-message" className="mt-2 text-sm text-red-600">
                {inviteError}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowInviteModal(false);
                setInviteeIds([]);
                setInviteError('');
                setInviteSuccess('');
                setInviteLoading(false);
                setInviteSearchTerm('');
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={inviteLoading || !hasSelectableInvitees || inviteeIds.length === 0}>
              {inviteLoading ? 'Sending...' : `Send Invite${inviteeIds.length > 0 ? ` (${inviteeIds.length})` : ''}`}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title="Team Members"
      >
        <div className="space-y-4">
          {team?.members && team.members.length > 0 ? (
            <div className="space-y-3">
              {team.members.map((member, index) => {
                const memberUser = member.userId;
                const memberName = memberUser?.name || memberUser?.email || 'Unknown User';
                const memberEmail = memberUser?.email || 'No email';
                const memberRole = member.role || 'member';
                
                return (
                  <div
                    key={member._id || member.userId?._id || index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{memberName}</p>
                          <p className="text-sm text-gray-500 truncate">{memberEmail}</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          memberRole === 'owner'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {memberRole.charAt(0).toUpperCase() + memberRole.slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiUsers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No members found in this team.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Team;

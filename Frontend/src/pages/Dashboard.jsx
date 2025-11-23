import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { addTeam as addTeamAPI, editTeam as editTeamAPI, deleteTeam as deleteTeamAPI } from '../api/teams.js';
import { FiPlus, FiUsers, FiArrowRight, FiClock, FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Modal from '../components/ui/Modal.jsx';
import Header from '../components/header/Header.jsx';
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

const validateTeamName = (value) => {
  const formatted = ensureFirstLetterCapital(value);

  if (!formatted) {
    return 'Team name is required';
  }

  if (formatted.length < 2) {
    return 'Team name must be at least 2 characters';
  }

  if (formatted.length > 50) {
    return 'Team name cannot exceed 50 characters';
  }

  if (!/^[A-Z][A-Za-z0-9\s'-.]*$/.test(formatted)) {
    return 'Team name must start with a capital letter and can include letters, numbers, spaces, apostrophes, hyphens, or periods';
  }

  return '';
};

const validateTeamDescription = (value) => {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return '';
  }

  if (normalized.length > 150) {
    return 'Description cannot exceed 150 characters';
  }

  return '';
};

const Dashboard = () => {
  const { teams, refreshTeams, isAuthenticated, user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ name: '', description: '' });
  const [touched, setTouched] = useState({ name: false, description: false });
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      refreshTeams();
    }
  }, [isAuthenticated]);

  const filteredTeams = useMemo(() => {
    if (!searchTerm.trim()) return teams;
    const query = searchTerm.trim().toLowerCase();
    return teams.filter((team) => {
      const nameMatch = team.name?.toLowerCase().includes(query);
      const descriptionMatch = team.description?.toLowerCase().includes(query);
      return nameMatch || descriptionMatch;
    });
  }, [teams, searchTerm]);

  const getUserIdFromToken = () => {
    try {
      const token = getAuthToken();
      if (!token) return null;
      // Decode JWT token (base64 decode the payload)
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

  const isTeamOwner = (team) => {
    if (!team) return false;
    
    // Try to get userId from user object first, then from token
    let userId = user?.id || user?._id;
    if (!userId) {
      userId = getUserIdFromToken();
    }
    
    if (!userId) return false;
    
    const userIdStr = userId.toString();
    
    // Check if user is owner in members array
    if (team.members && Array.isArray(team.members)) {
      const isOwnerInMembers = team.members.some(
        (member) => {
          const memberUserId = member.userId?._id?.toString() || member.userId?.toString() || member.userId;
          return memberUserId === userIdStr && member.role === 'owner';
        }
      );
      if (isOwnerInMembers) return true;
    }
    
    // Fallback: check if user created the team
    const createdBy = team.createdBy?._id?.toString() || team.createdBy?.toString() || team.createdBy;
    if (createdBy === userIdStr) return true;
    
    return false;
  };

  const validateTitle = (value) => {
  const name = ensureFirstLetterCapital(value);

  if (!name) {
    return 'Full name is required';
  }

  if (name.length < 2) {
    return 'Full name must be at least 2 characters';
  }

  if (name.length > 50) {
    return 'Full name cannot exceed 50 characters';
  }

if (!/^[A-Za-z\s]+$/.test(name)) {
  return 'Full name can only include letters and spaces.';
}

  if (!/^[A-Z]/.test(name.charAt(0))) {
    return 'First letter must be a capital letter';
  }

  return '';
};


  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;

    if (field === 'name') {
      setTeamName(value);
    } else {
      setTeamDescription(value);
    }

    // Validate immediately on change
    setFieldErrors((prev) => ({
      ...prev,
      [field]: field === 'name' ? validateTeamName(value) : validateTeamDescription(value),
    }));
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    let value = field === 'name' ? teamName : teamDescription;

    if (field === 'name') {
      const formatted = ensureFirstLetterCapital(value);
      if (formatted !== teamName) {
        setTeamName(formatted);
      }
      value = formatted;
    } else {
      const normalized = normalizeWhitespace(value);
      if (normalized !== teamDescription) {
        setTeamDescription(normalized);
      }
      value = normalized;
    }

    setFieldErrors((prev) => ({
      ...prev,
      [field]: field === 'name' ? validateTeamName(value) : validateTeamDescription(value),
    }));
  };

  const validateCreateTeamForm = () => {
    const formattedName = ensureFirstLetterCapital(teamName);
    const normalizedDescription = normalizeWhitespace(teamDescription);

    setTeamName(formattedName);
    setTeamDescription(normalizedDescription);

    const newErrors = {
      name: validateTeamName(formattedName),
      description: validateTeamDescription(normalizedDescription),
    };

    setFieldErrors(newErrors);
    setTouched({ name: true, description: true });

    return Object.values(newErrors).every((message) => !message);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateCreateTeamForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: ensureFirstLetterCapital(teamName),
        description: normalizeWhitespace(teamDescription) || undefined,
      };

      const result = await addTeamAPI({
        name: payload.name,
        description: payload.description,
      });

      if (result.success) {
        setShowCreateModal(false);
        setTeamName('');
        setTeamDescription('');
        setFieldErrors({ name: '', description: '' });
        setTouched({ name: false, description: false });
        setSearchTerm('');
        setSearchInput('');
        await refreshTeams();
      } else {
        setError(result.message || 'Failed to create team');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (e, team) => {
    e.stopPropagation();
    setEditingTeam(team);
    setTeamName(team.name || '');
    setTeamDescription(team.description || '');
    setFieldErrors({ name: '', description: '' });
    setTouched({ name: false, description: false });
    setError('');
    setShowEditModal(true);
  };

  const handleEditTeam = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateCreateTeamForm()) {
      return;
    }

    if (!editingTeam) return;

    setLoading(true);

    try {
      const payload = {
        name: ensureFirstLetterCapital(teamName),
        description: normalizeWhitespace(teamDescription) || undefined,
      };

      const result = await editTeamAPI(editingTeam._id, {
        name: payload.name,
        description: payload.description,
      });

      if (result.success) {
        setShowEditModal(false);
        setEditingTeam(null);
        setTeamName('');
        setTeamDescription('');
        setFieldErrors({ name: '', description: '' });
        setTouched({ name: false, description: false });
        await refreshTeams();
      } else {
        setError(result.message || 'Failed to update team');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update team');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (e, team) => {
    e.stopPropagation();
    
    const result = await Swal.fire({
      title: 'Delete Team?',
      text: `Are you sure you want to delete "${team.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel',
      reverseButtons: true,
      focusConfirm: false,
      customClass: {
        popup: 'swal2-popup-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom',
      },
    });

    if (result.isConfirmed) {
      await handleDeleteTeam(team._id);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      const result = await deleteTeamAPI(teamId);
      if (result.success) {
        await refreshTeams();
        await Swal.fire({
          title: 'Deleted!',
          text: 'Team has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          confirmButtonText: 'OK',
        });
      } else {
        await Swal.fire({
          title: 'Error!',
          text: result.message || 'Failed to delete team',
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'OK',
        });
      }
    } catch (err) {
      await Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to delete team',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && !showCreateModal && !showEditModal && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 text-red-700 hover:text-red-900 font-semibold"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Teams</h1>
              <p className="text-gray-600 mt-1">Manage your teams and collaborate</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <FiPlus className="h-5 w-5" />
              Create Team
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiSearch className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchTerm(searchInput);
                    }
                  }}
                  className="input pl-10"
                  placeholder="Search teams..."
                />
              </div>
              <button
                onClick={() => setSearchTerm(searchInput)}
                className="btn btn-primary  whitespace-nowrap"
              >
                Search
              </button>
            </div>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                }}
                className="text-sm text-gray-600 hover:text-primary-600"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="card text-center py-12">
            <FiUsers className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {teams.length === 0 && !searchTerm ? 'No teams yet' : 'No teams match your search'}
            </h3>
            <p className="text-gray-600 mb-6">
              {teams.length === 0 && !searchTerm
                ? 'Create your first team to get started'
                : 'Try adjusting your search keywords'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <FiPlus className="h-5 w-5" />
              Create Team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => {
              const isOwner = isTeamOwner(team);
              // Debug log (remove in production)
              if (process.env.NODE_ENV === 'development') {
                console.log('Team:', team.name, 'isOwner:', isOwner, 'members:', team.members);
              }
              return (
                <div
                  key={team._id}
                  className="card hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                  onClick={() => navigate(`/teams/${team._id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1 truncate" title={team.name}>{team.name}</h3>
                      <div className="min-h-[2.5rem]">
                        {team.description ? (
                          <p className="text-sm text-gray-600 line-clamp-2 truncate" title={team.description}>{team.description}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {isOwner ? (
                        <>
                          <button
                            onClick={(e) => handleEditClick(e, team)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit Team"
                            type="button"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, team)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Team"
                            type="button"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : null}
                      <FiArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200 mt-auto">
                    <button
                      onClick={() => {
                        setSelectedTeamMembers(team);
                        setShowMembersModal(true);
                      }}
                      className="flex items-center gap-1 hover:text-primary-600 transition-colors cursor-pointer"
                    >
                      <FiUsers className="h-4 w-4" />
                      <span>{team.members?.length || 0} members</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <FiClock className="h-4 w-4" />
                      <span>{new Date(team.createdAt).toLocaleDateString()}</span>
                    </div>
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
          setTeamName('');
          setTeamDescription('');
          setError('');
          setFieldErrors({ name: '', description: '' });
          setTouched({ name: false, description: false });
        }}
        title="Create New Team"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4" noValidate>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
              Team Name
            </label>
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={handleFieldChange('name')}
              onBlur={handleBlur('name')}
              className={`input ${fieldErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={fieldErrors.name ? 'true' : 'false'}
              aria-describedby={fieldErrors.name ? 'team-name-error' : undefined}
              placeholder="Enter team name"
              required
              maxLength={50}
              minLength={2}
            />
            {fieldErrors.name && (
              <p id="team-name-error" className="mt-2 text-sm text-red-600">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="teamDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="teamDescription"
              value={teamDescription}
              onChange={handleFieldChange('description')}
              onBlur={handleBlur('description')}
              className={`input ${fieldErrors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={fieldErrors.description ? 'true' : 'false'}
              aria-describedby={fieldErrors.description ? 'team-description-error' : undefined}
              rows={3}
              placeholder="Enter team description"
              maxLength={150}
            />
            <p className="mt-1 text-xs text-gray-500">Optional, up to 150 characters</p>
            {fieldErrors.description && (
              <p id="team-description-error" className="mt-2 text-sm text-red-600">
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setTeamName('');
                setTeamDescription('');
                setError('');
                setFieldErrors({ name: '', description: '' });
                setTouched({ name: false, description: false });
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTeam(null);
          setTeamName('');
          setTeamDescription('');
          setError('');
          setFieldErrors({ name: '', description: '' });
          setTouched({ name: false, description: false });
        }}
        title="Edit Team"
      >
        <form onSubmit={handleEditTeam} className="space-y-4" noValidate>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="editTeamName" className="block text-sm font-medium text-gray-700 mb-2">
              Team Name
            </label>
            <input
              id="editTeamName"
              type="text"
              value={teamName}
              onChange={handleFieldChange('name')}
              onBlur={handleBlur('name')}
              className={`input ${fieldErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={fieldErrors.name ? 'true' : 'false'}
              aria-describedby={fieldErrors.name ? 'edit-team-name-error' : undefined}
              placeholder="Enter team name"
              required
              maxLength={50}
              minLength={2}
            />
            {fieldErrors.name && (
              <p id="edit-team-name-error" className="mt-2 text-sm text-red-600">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="editTeamDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="editTeamDescription"
              value={teamDescription}
              onChange={handleFieldChange('description')}
              onBlur={handleBlur('description')}
              className={`input ${fieldErrors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={fieldErrors.description ? 'true' : 'false'}
              aria-describedby={fieldErrors.description ? 'edit-team-description-error' : undefined}
              rows={3}
              placeholder="Enter team description"
              maxLength={150}
            />
            <p className="mt-1 text-xs text-gray-500">Optional, up to 150 characters</p>
            {fieldErrors.description && (
              <p id="edit-team-description-error" className="mt-2 text-sm text-red-600">
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingTeam(null);
                setTeamName('');
                setTeamDescription('');
                setError('');
                setFieldErrors({ name: '', description: '' });
                setTouched({ name: false, description: false });
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Updating...' : 'Update Team'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showMembersModal}
        onClose={() => {
          setShowMembersModal(false);
          setSelectedTeamMembers(null);
        }}
        title={selectedTeamMembers ? `${selectedTeamMembers.name} - Team Members` : 'Team Members'}
      >
        <div className="space-y-4">
          {selectedTeamMembers?.members && selectedTeamMembers.members.length > 0 ? (
            <div className="space-y-3">
              {selectedTeamMembers.members.map((member, index) => {
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
                        <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {memberName.charAt(0).toUpperCase()}
                          </span>
                        </div>
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

export default Dashboard;

import React, { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Header from '../components/header/Header.jsx';
import { getMyInvitations, respondToInvitation } from '../api/invitations.js';
import { useAuth } from '../context/AuthContext.jsx';

const Invitations = () => {
  const { refreshInvitations, setInviteCount } = useAuth();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const result = await getMyInvitations();
      if (result.success) {
        const data = result.data || [];
        setInvites(data);
        setInviteCount(data.length);
      } else {
        setError(result.message || 'Failed to load invitations');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleRespond = async (inviteId, action) => {
    setError('');
    setSuccess('');
    setActioningId(inviteId);
    try {
      const result = await respondToInvitation(inviteId, action);
      if (result.success) {
        setSuccess(`Invitation ${action === 'accept' ? 'accepted' : 'declined'} successfully`);
        setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
        setInviteCount((prev) => Math.max(0, prev - 1));
      } else {
        setError(result.message || `Failed to ${action} invitation`);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} invitation`);
    } finally {
      setActioningId('');
    }
  };

  const hasInvites = invites.length > 0;

  const sortedInvites = useMemo(
    () =>
      [...invites].sort(
        (a, b) => new Date(a.expiresAt || a.createdAt || 0) - new Date(b.expiresAt || b.createdAt || 0)
      ),
    [invites]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invitations</h1>
            <p className="text-gray-600 mt-1">
              Review your pending team invitations and accept or decline as needed.
            </p>
          </div>
          <button
            onClick={fetchInvitations}
            className="btn btn-secondary"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading invitations...</p>
          </div>
        ) : !hasInvites ? (
          <div className="card text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending invitations</h3>
            <p className="text-gray-600">You&apos;ll see new team invites here as soon as they arrive.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedInvites.map((invite) => (
              <div key={invite.id} className="card">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <h2 
                        className="text-2xl font-semibold text-gray-900 truncate line-clamp-2 flex-1 min-w-0"
                        title={invite.team?.name || 'Team Invitation'}
                      >
                        {invite.team?.name || 'Team Invitation'}
                      </h2>
                      {/* {invite.expiresAt && (
                        <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
                          Expires {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                        </span>
                      )} */}
                    </div>
                    {/* {invite.team?.description && (
                      <p 
                        className="text-gray-600 truncate line-clamp-2 mb-3"
                        title={invite.team.description}
                      >
                        {invite.team.description}
                      </p>
                    )} */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {invite.inviter && (
                        <span>
                          Invited by <strong className="text-gray-700">{invite.inviter.name || invite.inviter.email}</strong>
                        </span>
                      )}
                      {invite.createdAt && (
                        <span>
                          Sent {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                        </span>
                      )}
                      <span>
                        Role: <strong className="text-gray-700">{invite.role}</strong>
                      </span>
                    </div>
                     {invite.expiresAt && (
                        <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
                          Expires {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                        </span>
                      )}
                  </div>
                  <div className="flex gap-3 flex-shrink-0">
                    <button
                      onClick={() => handleRespond(invite.id, 'decline')}
                      className="btn btn-secondary"
                      disabled={actioningId === invite.id}
                    >
                      {actioningId === invite.id ? 'Processing...' : 'Decline'}
                    </button>
                    <button
                      onClick={() => handleRespond(invite.id, 'accept')}
                      className="btn btn-primary"
                      disabled={actioningId === invite.id}
                    >
                      {actioningId === invite.id ? 'Processing...' : 'Accept'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Invitations;



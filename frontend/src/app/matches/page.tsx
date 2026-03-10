'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { Match } from '@/types';

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadMatches();
  }, [filter]);

  async function loadMatches() {
    setLoading(true);
    try {
      const data = await api.getMatches(filter || undefined);
      setMatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (matchId: string, status: string) => {
    try {
      await api.updateMatchStatus(matchId, status);
      loadMatches();
    } catch (err: any) {
      alert(err.message || 'Failed to update.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Matches</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-surface-200 rounded-lg text-sm"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-surface-200">
          <p className="text-surface-800">No matches yet. Explore projects and propose collaborations!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const isProposer = match.proposerId === user?.id;
            const otherUser = isProposer ? match.receiver : match.proposer;
            const otherUserId = isProposer ? match.receiverId : match.proposerId;

            return (
              <div
                key={match.id}
                className="bg-white rounded-2xl p-6 border border-surface-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-medium">
                      {otherUser?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium">{otherUser?.name}</p>
                      <p className="text-sm text-surface-800">
                        {isProposer ? 'You proposed' : 'Proposed to you'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    match.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    match.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    match.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {match.status}
                  </span>
                </div>

                {/* Project link */}
                {match.project && (
                  <Link
                    href={`/projects/${match.projectId}`}
                    className="block mt-3 text-sm text-brand-600 hover:underline"
                  >
                    📁 {match.project.title}
                  </Link>
                )}

                {/* Match message */}
                {match.message && (
                  <p className="mt-3 text-sm text-surface-800 bg-surface-50 rounded-lg p-3">
                    &quot;{match.message}&quot;
                  </p>
                )}

                {/* Match score */}
                {match.matchScore !== null && match.matchScore !== undefined && (
                  <p className="mt-2 text-xs text-surface-800">
                    AI Match Score: <span className="font-medium text-brand-600">{match.matchScore.toFixed(0)}%</span>
                  </p>
                )}

                {/* Actions for receiver */}
                {!isProposer && match.status === 'pending' && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleStatusUpdate(match.id, 'accepted')}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(match.id, 'rejected')}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {/* Chat link for accepted matches */}
                {match.status === 'accepted' && (
                  <Link
                    href={`/messages?user=${otherUserId}&name=${encodeURIComponent(otherUser?.name || 'User')}`}
                    className="mt-4 inline-block text-sm text-brand-600 hover:underline font-medium"
                  >
                    💬 Open Chat
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

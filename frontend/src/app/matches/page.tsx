'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { Match, CreditOffer } from '@/types';

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
        <h1 className="reveal font-display text-3xl">Matches</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 text-sm"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-brand-500/20 mx-auto" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 bg-stone-900 rounded-2xl border border-stone-800">
          <p className="text-stone-400">No matches yet. Explore projects and propose collaborations!</p>
        </div>
      ) : (
        <div className="reveal-stagger space-y-4">
          {matches.map((match) => {
            const isProposer = match.proposerId === user?.id;
            const otherUser = isProposer ? match.receiver : match.proposer;
            const otherUserId = isProposer ? match.receiverId : match.proposerId;

            return (
              <div
                key={match.id}
                className="reveal bg-stone-900 rounded-2xl p-6 border border-stone-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-medium">
                      {otherUser?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium">{otherUser?.name}</p>
                      <p className="text-sm text-stone-400">
                        {isProposer ? 'You proposed' : 'Proposed to you'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    match.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    match.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                    match.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-stone-700 text-stone-400'
                  }`}>
                    {match.status}
                  </span>
                </div>

                {/* Project link */}
                {match.project && (
                  <Link
                    href={`/projects/${match.projectId}`}
                    className="block mt-3 text-sm text-brand-400 hover:underline"
                  >
                    📁 {match.project.title}
                  </Link>
                )}

                {/* Match message */}
                {match.message && (
                  <p className="mt-3 text-sm text-stone-400 bg-stone-800/50 rounded-lg p-3">
                    &quot;{match.message}&quot;
                  </p>
                )}

                {/* Match score */}
                {match.matchScore !== null && match.matchScore !== undefined && (
                  <p className="mt-2 text-xs text-stone-400">
                    AI Match Score: <span className="font-medium text-brand-400">{match.matchScore.toFixed(0)}%</span>
                  </p>
                )}

                {/* Actions for receiver */}
                {!isProposer && match.status === 'pending' && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleStatusUpdate(match.id, 'accepted')}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 btn-press transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(match.id, 'rejected')}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 btn-press transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {/* Chat link for accepted matches */}
                {match.status === 'accepted' && (
                  <div className="mt-4 flex items-center gap-3">
                    <Link
                      href={`/messages?user=${otherUserId}&name=${encodeURIComponent(otherUser?.name || 'User')}`}
                      className="text-sm text-brand-400 hover:underline font-medium"
                    >
                      💬 Open Chat
                    </Link>
                  </div>
                )}

                {/* Credit Negotiation for accepted matches */}
                {match.status === 'accepted' && user && (
                  <CreditNegotiation
                    matchId={match.id}
                    userId={user.id}
                    otherUserId={otherUserId}
                    otherUserName={otherUser?.name || 'User'}
                    isProposer={isProposer}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Credit Negotiation Component
// ============================================================

function CreditNegotiation({
  matchId, userId, otherUserId, otherUserName, isProposer,
}: {
  matchId: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
  isProposer: boolean;
}) {
  const [activeOffer, setActiveOffer] = useState<CreditOffer | null>(null);
  const [allOffers, setAllOffers] = useState<CreditOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // New offer form
  const [amount, setAmount] = useState(0);
  const [iPayThem, setIPayThem] = useState(true);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Counter form
  const [counterAmount, setCounterAmount] = useState(0);
  const [counterNote, setCounterNote] = useState('');
  const [counterIPayThem, setCounterIPayThem] = useState(false);

  useEffect(() => {
    loadOffers();
  }, [matchId]);

  async function loadOffers() {
    try {
      const [active, all] = await Promise.all([
        api.getActiveOffer(matchId).catch(() => null),
        api.getMatchOffers(matchId).catch(() => []),
      ]);
      setActiveOffer(active);
      setAllOffers(all);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const handlePropose = async () => {
    if (amount <= 0) return;
    setSubmitting(true);
    try {
      await api.proposeOffer(
        matchId,
        amount,
        iPayThem ? userId : otherUserId,
        iPayThem ? otherUserId : userId,
        note || undefined
      );
      setAmount(0);
      setNote('');
      loadOffers();
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const handleCounter = async (offerId: string) => {
    if (counterAmount <= 0) return;
    setSubmitting(true);
    try {
      const newPayerId = counterIPayThem ? userId : otherUserId;
      const newPayeeId = counterIPayThem ? otherUserId : userId;
      await api.counterOffer(offerId, counterAmount, counterNote || undefined, newPayerId, newPayeeId);
      setCounterAmount(0);
      setCounterNote('');
      loadOffers();
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const handleAccept = async (offerId: string) => {
    try {
      await api.acceptOffer(offerId);
      alert('Offer accepted! Credits have been transferred.');
      loadOffers();
    } catch (err: any) { alert(err.message); }
  };

  const handleReject = async (offerId: string) => {
    try {
      await api.rejectOffer(offerId);
      loadOffers();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return null;

  const canRespond = activeOffer && activeOffer.proposedBy !== userId;
  const isMyOffer = activeOffer && activeOffer.proposedBy === userId;

  return (
    <div className="mt-4 border-t border-stone-800 pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1"
      >
        💰 Credits {activeOffer ? `(${activeOffer.status}: ${activeOffer.amount} credits)` : '(negotiate)'}
        <span className="text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Active Offer */}
          {activeOffer && (
            <div className={`p-4 rounded-xl border ${
              activeOffer.status === 'accepted' ? 'bg-green-500/10 border-green-200' :
              'bg-yellow-500/10 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {activeOffer.status === 'accepted' ? '✅ Agreed' :
                   activeOffer.status === 'countered' ? '🔄 Counter Offer' : '📨 Pending Offer'}
                </span>
                <span className="text-lg font-bold text-brand-400">{activeOffer.amount} credits</span>
              </div>
              <p className="text-xs text-stone-400">
                {activeOffer.payer?.name} pays → {activeOffer.payee?.name}
              </p>
              {activeOffer.note && (
                <p className="text-xs text-stone-400 mt-1 italic">&quot;{activeOffer.note}&quot;</p>
              )}

              {/* Respond buttons (only if I'm NOT the proposer) */}
              {canRespond && activeOffer.status !== 'accepted' && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(activeOffer.id)}
                      className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600"
                    >
                      ✓ Accept {activeOffer.amount} credits
                    </button>
                    <button
                      onClick={() => handleReject(activeOffer.id)}
                      className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600"
                    >
                      ✕ Reject
                    </button>
                  </div>

                  {/* Counter offer form */}
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-stone-400">Counter:</span>
                      <select
                        value={counterIPayThem ? 'i_pay' : 'they_pay'}
                        onChange={(e) => setCounterIPayThem(e.target.value === 'i_pay')}
                        className="px-2 py-1 border border-stone-800 rounded text-xs"
                      >
                        <option value="they_pay">{otherUserName} pays me</option>
                        <option value="i_pay">I pay {otherUserName}</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-stone-800 rounded text-xs"
                        placeholder="Amount"
                      />
                      <span className="text-xs text-stone-400">credits</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={counterNote}
                        onChange={(e) => setCounterNote(e.target.value)}
                        className="flex-1 px-2 py-1 border border-stone-800 rounded text-xs"
                        placeholder="Reason (optional)"
                      />
                      <button
                        onClick={() => handleCounter(activeOffer.id)}
                        disabled={counterAmount <= 0 || submitting}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 disabled:opacity-50"
                      >
                        Counter
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isMyOffer && activeOffer.status !== 'accepted' && (
                <p className="text-xs text-stone-400 mt-2 italic">
                  Waiting for {otherUserName} to respond...
                </p>
              )}
            </div>
          )}

          {/* New Offer Form (show only if no active offer) */}
          {!activeOffer && (
            <div className="p-4 bg-stone-800/50 rounded-xl">
              <p className="text-sm font-medium mb-2">Propose a credit exchange</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={iPayThem ? 'i_pay' : 'they_pay'}
                    onChange={(e) => setIPayThem(e.target.value === 'i_pay')}
                    className="px-2 py-1.5 border border-stone-800 rounded text-xs"
                  >
                    <option value="i_pay">I pay {otherUserName}</option>
                    <option value="they_pay">{otherUserName} pays me</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="w-24 px-2 py-1.5 border border-stone-800 rounded text-xs"
                    placeholder="Credits"
                  />
                  <span className="text-xs text-stone-400">credits</span>
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-800 rounded text-xs"
                  placeholder="Add a note: e.g. 'I think 50 credits is fair for 2 hours of editing'"
                />
                <button
                  onClick={handlePropose}
                  disabled={amount <= 0 || submitting}
                  className="bg-brand-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-brand-400 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Offer'}
                </button>
              </div>
            </div>
          )}

          {/* Negotiation History */}
          {allOffers.length > 1 && (
            <div>
              <p className="text-xs font-medium text-stone-400 mb-1">Negotiation History</p>
              <div className="space-y-1">
                {allOffers.slice(1).map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between text-xs text-stone-400 py-1">
                    <span>
                      {offer.proposer?.name} offered {offer.amount} credits
                      {offer.note && ` — "${offer.note}"`}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full ${
                      offer.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      offer.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      offer.status === 'expired' ? 'bg-stone-700 text-stone-500' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {offer.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

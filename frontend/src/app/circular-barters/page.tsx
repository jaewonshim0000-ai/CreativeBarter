'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { UserWant, DetectedChain, BarterChain, ChainLink } from '@/types';

export default function CircularBartersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'wants' | 'discover' | 'chains'>('wants');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="reveal font-display text-3xl">🔄 Circular Barter Exchange</h1>
        <p className="text-stone-400 mt-1">
          When direct 1-to-1 exchanges aren&apos;t possible, our AI finds circular chains
          where 3+ people can trade skills in a loop — everyone gets what they need.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-800 rounded-xl p-1">
        {[
          { id: 'wants' as const, label: '🎯 What I Need', desc: 'Skills I\'m looking for' },
          { id: 'discover' as const, label: '🔍 Discover Chains', desc: 'Find circular exchanges' },
          { id: 'chains' as const, label: '🔗 My Chains', desc: 'Active exchanges' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-stone-800 shadow-sm text-stone-100'
                : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'wants' && <WantsSection />}
      {activeTab === 'discover' && <DiscoverSection userId={user?.id} />}
      {activeTab === 'chains' && <ChainsSection userId={user?.id} />}
    </div>
  );
}

// ============================================================
// Section 1: Manage Wants
// ============================================================

function WantsSection() {
  const [wants, setWants] = useState<UserWant[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState(5);
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadWants(); }, []);

  async function loadWants() {
    try {
      const data = await api.getMyWants();
      setWants(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    setAdding(true);
    try {
      await api.addWant(newSkill.trim(), newDesc.trim() || undefined, newPriority);
      setNewSkill('');
      setNewDesc('');
      setNewPriority(5);
      loadWants();
    } catch (err: any) {
      alert(err.message || 'Failed to add.');
    } finally { setAdding(false); }
  };

  const handleRemove = async (skillName: string) => {
    try {
      await api.removeWant(skillName);
      loadWants();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="reveal bg-stone-900 rounded-2xl p-6 border border-stone-800">
        <h2 className="font-semibold text-lg mb-2">Skills I&apos;m Looking For</h2>
        <p className="text-sm text-stone-400 mb-4">
          Tell us what skills or resources you need. The AI uses this to find circular exchange
          opportunities where multiple creatives can trade in a loop.
        </p>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="e.g. Video Editing, Voice Acting, Logo Design..."
            className="flex-1 px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 text-sm"
            required
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Details (optional)"
            className="sm:w-48 px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 text-sm"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(parseInt(e.target.value))}
            className="sm:w-24 px-3 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 text-sm"
            title="Priority"
          >
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <option key={n} value={n}>P{n}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={adding}
            className="bg-brand-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-400 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {adding ? 'Adding...' : '+ Add'}
          </button>
        </form>

        {loading ? (
          <div className="text-center py-6">
            <div className="w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : wants.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-6">
            No wants added yet. Add skills you&apos;re looking for to enable circular barter discovery.
          </p>
        ) : (
          <div className="space-y-2">
            {wants.map((want) => (
              <div key={want.id} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full font-medium">
                    P{want.priority}
                  </span>
                  <span className="font-medium text-sm">{want.skillName}</span>
                  {want.description && (
                    <span className="text-xs text-stone-400">— {want.description}</span>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(want.skillName)}
                  className="text-red-400 hover:text-red-600 text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Section 2: Discover Circular Barters
// ============================================================

function DiscoverSection({ userId }: { userId?: string }) {
  const [chains, setChains] = useState<DetectedChain[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [creating, setCreating] = useState<number | null>(null);

  const handleDiscover = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const result = await api.discoverCircularBarters(5, 10);
      setChains(result.chains || []);
      setTotalUsers(result.total_users_analyzed || 0);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Discovery failed.');
    } finally { setLoading(false); }
  };

  const handlePropose = async (detected: DetectedChain, index: number) => {
    if (!userId) return;
    setCreating(index);

    try {
      const participants = detected.chain.map((link: ChainLink, i: number) => ({
        userId: link.user_id,
        position: i,
        givesSkill: link.gives_skill,
        givesToUserId: link.gives_to_user_id,
        receivesSkill: link.receives_skill,
        receivesFromUserId: link.receives_from_user_id,
      }));

      await api.createBarterChain({
        title: `Circular Exchange: ${detected.chain.map((l: ChainLink) => l.gives_skill).join(' → ')}`,
        description: detected.description,
        participants,
        confidenceScore: detected.confidence,
      });

      alert('Chain proposed! Participants will be notified.');
    } catch (err: any) {
      alert(err.message || 'Failed to propose chain.');
    } finally { setCreating(null); }
  };

  return (
    <div className="space-y-6">
      <div className="reveal bg-stone-900 rounded-2xl p-6 border border-stone-800">
        <h2 className="font-semibold text-lg mb-2">Discover Circular Exchanges</h2>
        <p className="text-sm text-stone-400 mb-4">
          Our graph algorithm analyzes all users&apos; skills and wants to find loops
          where everyone gets what they need. For example: you edit video for Alice,
          Alice writes music for Bob, and Bob does graphic design for you.
        </p>

        <button
          onClick={handleDiscover}
          disabled={loading}
          className="bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-400 transition-colors btn-press disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching for chains...
            </span>
          ) : '🔍 Find Circular Exchanges'}
        </button>

        {searched && !loading && (
          <p className="text-xs text-stone-400 mt-2">
            Analyzed {totalUsers} users with skills and wants.
          </p>
        )}
      </div>

      {/* Results */}
      {chains.length > 0 && (
        <div className="reveal-stagger space-y-4">
          <h3 className="font-semibold">Found {chains.length} Circular Exchange{chains.length !== 1 ? 's' : ''}</h3>
          {chains.map((detected, i) => (
            <div key={i} className="reveal bg-stone-900 rounded-2xl p-6 border border-stone-800">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-brand-500">{detected.confidence}%</span>
                    <span className="text-xs text-stone-400">confidence</span>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                      {detected.length} people
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handlePropose(detected, i)}
                  disabled={creating === i}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 btn-press transition-colors disabled:opacity-50"
                >
                  {creating === i ? 'Proposing...' : 'Propose This Chain'}
                </button>
              </div>

              {/* Chain visualization */}
              <ChainVisualization links={detected.chain} />
            </div>
          ))}
        </div>
      )}

      {searched && !loading && chains.length === 0 && (
        <div className="text-center py-8 bg-stone-900 rounded-2xl border border-stone-800">
          <p className="text-stone-400 mb-2">No circular exchanges found yet.</p>
          <p className="text-sm text-stone-400">
            Make sure you&apos;ve added skills to your profile AND wants in the &quot;What I Need&quot; tab.
            More users = more possible chains!
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Section 3: My Chains
// ============================================================

function ChainsSection({ userId }: { userId?: string }) {
  const [chains, setChains] = useState<BarterChain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadChains(); }, []);

  async function loadChains() {
    try {
      const data = await api.getMyBarterChains();
      setChains(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const handleRespond = async (chainId: string, accept: boolean) => {
    try {
      const result = await api.respondToBarterChain(chainId, accept);
      alert(result.reason);
      loadChains();
    } catch (err: any) { alert(err.message); }
  };

  const handleComplete = async (chainId: string) => {
    try {
      await api.completeBarterChain(chainId);
      alert('Chain marked as completed!');
      loadChains();
    } catch (err: any) { alert(err.message); }
  };

  const statusColors: Record<string, string> = {
    proposed: 'bg-stone-700 text-stone-400',
    pending_acceptance: 'bg-yellow-500/20 text-yellow-400',
    active: 'bg-green-500/20 text-green-400',
    completed: 'bg-blue-500/20 text-blue-400',
    cancelled: 'bg-red-500/20 text-red-400',
    expired: 'bg-stone-700 text-stone-500',
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-brand-500/20 mx-auto" />
      </div>
    );
  }

  return (
    <div className="reveal-stagger space-y-4">
      {chains.length === 0 ? (
        <div className="text-center py-12 bg-stone-900 rounded-2xl border border-stone-800">
          <p className="text-stone-400">No barter chains yet. Discover some in the &quot;Discover Chains&quot; tab!</p>
        </div>
      ) : (
        chains.map((chain) => {
          const myParticipation = chain.participants?.find((p) => p.userId === userId);

          return (
            <div key={chain.id} className="reveal bg-stone-900 rounded-2xl p-6 border border-stone-800">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{chain.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[chain.status]}`}>
                      {chain.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-stone-400">
                      {chain.chainLength} participants
                    </span>
                    {chain.confidenceScore && (
                      <span className="text-xs text-stone-400">
                        • {chain.confidenceScore}% confidence
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-stone-400">
                  {new Date(chain.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Participants */}
              {chain.participants && (
                <div className="space-y-2 mb-4">
                  {chain.participants.map((p, i) => (
                    <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                      p.userId === userId ? 'bg-brand-500/10 border border-brand-200' : 'bg-stone-800/50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="font-medium">{p.user?.name}{p.userId === userId ? ' (you)' : ''}</span>
                        <span className="text-stone-400">gives <span className="font-medium text-red-600">{p.givesSkill}</span></span>
                        <span className="text-stone-400">→ {p.givesToUser?.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                        p.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        p.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {chain.status === 'pending_acceptance' && myParticipation?.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRespond(chain.id, true)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 btn-press"
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => handleRespond(chain.id, false)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 btn-press"
                  >
                    ✕ Decline
                  </button>
                </div>
              )}

              {chain.status === 'active' && chain.initiatedBy === userId && (
                <button
                  onClick={() => handleComplete(chain.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600"
                >
                  ✓ Mark as Completed
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ============================================================
// Chain Visualization Component
// ============================================================

function ChainVisualization({ links }: { links: ChainLink[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="bg-stone-800/50 rounded-xl p-3 text-center min-w-[120px]">
            <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-medium text-sm mx-auto mb-1">
              {link.name.charAt(0)}
            </div>
            <p className="text-xs font-medium truncate">{link.name}</p>
            <p className="text-[10px] text-red-500 mt-1">gives: {link.gives_skill}</p>
          </div>
          {i < links.length - 1 && (
            <div className="text-brand-400 text-lg">→</div>
          )}
          {i === links.length - 1 && (
            <div className="text-brand-400 text-lg">→ 🔄</div>
          )}
        </div>
      ))}
    </div>
  );
}

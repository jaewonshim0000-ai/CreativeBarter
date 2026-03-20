'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

// Leaflet must be dynamically imported (no SSR) because it uses `window`
const CommunityMap = dynamic(() => import('./CommunityMap'), { ssr: false });

interface MapUser {
  id: string;
  name: string;
  profileImageUrl?: string;
  bio?: string;
  specialty: string;
  city?: string;
  region?: string;
  latitude: number;
  longitude: number;
  avgRating: number;
  totalReviews: number;
  skills: { skill: { name: string } }[];
}

interface ImpactStats {
  totalUsers: number;
  totalProjects: number;
  completedProjects: number;
  totalMatches: number;
  acceptedMatches: number;
  totalReviews: number;
  totalSkills: number;
  totalChains: number;
  completedChains: number;
  estimatedValueExchanged: number;
  topSkills: { name: string; count: number }[];
  recentActivity: {
    id: string;
    project: string;
    proposer: string;
    proposerCity?: string;
    receiver: string;
    receiverCity?: string;
    date: string;
  }[];
}

export default function CommunityPage() {
  const [users, setUsers] = useState<MapUser[]>([]);
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCommunityMapUsers().catch(() => []),
      api.getCommunityStats().catch(() => null),
    ]).then(([mapUsers, impactStats]) => {
      setUsers(mapUsers || []);
      setStats(impactStats);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-brand-500/20" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="reveal font-display text-4xl md:text-5xl">
          Nuvra <span className="text-brand-500">Community</span>
        </h1>
        <p className="text-stone-400 mt-2 max-w-xl mx-auto">
          A global network of creatives trading skills without money.
          Click any pin to explore their profile and start collaborating.
        </p>
      </div>

      {/* Impact Stats */}
      {stats && (
        <div className="reveal-stagger grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value={stats.totalUsers} label="Creatives" icon="👥" />
          <StatCard value={stats.acceptedMatches} label="Trades Made" icon="🤝" />
          <StatCard value={stats.totalSkills} label="Skills Shared" icon="🎨" />
          <StatCard
            value={`$${stats.estimatedValueExchanged.toLocaleString()}`}
            label="Value Exchanged"
            icon="💰"
            subtitle="without money changing hands"
          />
        </div>
      )}

      {/* Map */}
      <div className="reveal-scale bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden">
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Community Map</h2>
            <p className="text-xs text-stone-400">{users.length} creatives visible</p>
          </div>
          <Link
            href="/register"
            className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded-lg hover:bg-brand-400 transition-colors"
          >
            Join the Map
          </Link>
        </div>
        <div className="h-[500px]">
          <CommunityMap users={users} />
        </div>
      </div>

      {/* Bottom Grid: Top Skills + Recent Activity */}
      <div className="reveal-stagger grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Skills */}
        {stats && stats.topSkills.length > 0 && (
          <div className="reveal bg-stone-900 rounded-2xl p-6 border border-stone-800">
            <h2 className="font-semibold mb-4">🔥 Most In-Demand Skills</h2>
            <div className="space-y-2">
              {stats.topSkills.map((skill, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{skill.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${Math.min(100, (skill.count / Math.max(stats.topSkills[0]?.count || 1, 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone-400 w-8 text-right">{skill.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {stats && stats.recentActivity.length > 0 && (
          <div className="reveal bg-stone-900 rounded-2xl p-6 border border-stone-800">
            <h2 className="font-semibold mb-4">⚡ Recent Trades</h2>
            <div className="reveal-stagger space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-stone-800/50 last:border-0">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-sm shrink-0">
                    🤝
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{activity.proposer}</span>
                      {activity.proposerCity && <span className="text-stone-400"> ({activity.proposerCity})</span>}
                      {' '}↔{' '}
                      <span className="font-medium">{activity.receiver}</span>
                      {activity.receiverCity && <span className="text-stone-400"> ({activity.receiverCity})</span>}
                    </p>
                    <p className="text-xs text-stone-400">{activity.project}</p>
                    <p className="text-[10px] text-stone-400">{new Date(activity.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Circular Barter Stats */}
      {stats && stats.totalChains > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-brand-500/10 rounded-2xl p-6 border border-purple-500/20">
          <h2 className="font-semibold mb-2">🔄 Circular Exchanges</h2>
          <p className="text-sm text-stone-400 mb-3">
            Multi-party barter chains where 3+ creatives trade skills in a loop.
          </p>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold text-purple-400">{stats.totalChains}</p>
              <p className="text-xs text-stone-400">chains created</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.completedChains}</p>
              <p className="text-xs text-stone-400">completed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label, icon, subtitle }: {
  value: number | string; label: string; icon: string; subtitle?: string;
}) {
  return (
    <div className="bg-stone-900 rounded-2xl p-5 border border-stone-800 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-3xl font-bold mt-1 text-stone-100">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-stone-400 font-medium">{label}</p>
      {subtitle && <p className="text-[10px] text-stone-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

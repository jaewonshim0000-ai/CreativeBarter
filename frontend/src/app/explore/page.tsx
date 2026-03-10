'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const SPECIALTIES = [
  { value: '', label: 'All Specialties' },
  { value: 'visual_arts', label: 'Visual Arts' },
  { value: 'music', label: 'Music' },
  { value: 'writing', label: 'Writing' },
  { value: 'film', label: 'Film' },
  { value: 'photography', label: 'Photography' },
  { value: 'design', label: 'Design' },
  { value: 'web_dev', label: 'Web Development' },
  { value: 'game_dev', label: 'Game Development' },
  { value: 'animation', label: 'Animation' },
  { value: 'crafts', label: 'Crafts' },
];

export default function ExplorePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [specialty, setSpecialty] = useState('');

  useEffect(() => {
    loadUsers();
  }, [specialty]);

  async function loadUsers() {
    setLoading(true);
    try {
      const result = await api.searchUsers({
        ...(keyword && { keyword }),
        ...(specialty && { specialty }),
      });
      setUsers(result.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Explore Creatives</h1>
        <p className="text-surface-800 mt-1">Discover talented people in your area</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by name or skill..."
            className="flex-1 px-4 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-surface-800 text-white rounded-lg text-sm hover:bg-surface-900 transition-colors"
          >
            Search
          </button>
        </form>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="px-4 py-2 border border-surface-200 rounded-lg text-sm"
        >
          {SPECIALTIES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-surface-200">
          <p className="text-surface-800">No creatives found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u: any) => (
            <Link
              key={u.id}
              href={`/profile/${u.id}`}
              className="bg-white rounded-2xl p-6 border border-surface-200 hover:border-brand-300 hover:shadow-md transition-all block"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-lg font-bold">
                  {u.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs text-surface-800 capitalize">
                    {u.specialty?.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {u.bio && (
                <p className="text-sm text-surface-800 line-clamp-2 mb-3">{u.bio}</p>
              )}

              {/* Skills */}
              {u.skills && u.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {u.skills.slice(0, 4).map((us: any) => (
                    <span key={us.id} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                      {us.skill.name}
                    </span>
                  ))}
                  {u.skills.length > 4 && (
                    <span className="text-xs text-surface-800">+{u.skills.length - 4} more</span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-surface-800 pt-3 border-t border-surface-100">
                <span>
                  {u.avgRating > 0 ? `⭐ ${u.avgRating.toFixed(1)} (${u.totalReviews})` : 'New member'}
                </span>
                {u.city && <span>📍 {u.city}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

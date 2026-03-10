'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const SPECIALTIES = [
  'visual_arts', 'music', 'writing', 'film', 'photography',
  'design', 'web_dev', 'game_dev', 'animation', 'crafts', 'other',
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: '', bio: '', specialty: 'other', city: '', region: '',
  });

  useEffect(() => {
    api.getMyProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name || '',
          bio: data.bio || '',
          specialty: data.specialty || 'other',
          city: data.city || '',
          region: data.region || '',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.updateProfile(form);
      setProfile(updated);
      setMessage('Profile updated!');
    } catch (err: any) {
      setMessage(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="font-display text-3xl">My Profile</h1>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${
          message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-8 border border-surface-200 space-y-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-2xl font-bold">
            {form.name.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-semibold text-lg">{form.name || 'Your Name'}</p>
            <p className="text-sm text-surface-800">{user?.email}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            className="w-full px-4 py-2.5 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder="Tell others about yourself, your creative background, and what kind of collaborations interest you..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Specialty</label>
          <select
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            className="w-full px-4 py-2.5 border border-surface-200 rounded-lg"
          >
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-2.5 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Region</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full px-4 py-2.5 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-500 text-white py-3 rounded-xl font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* Skills Section */}
      <div className="bg-white rounded-2xl p-8 border border-surface-200">
        <h2 className="font-semibold text-lg mb-4">My Skills</h2>
        {profile?.skills && profile.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((us: any) => (
              <span key={us.id} className="text-sm bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full">
                {us.skill.name} — {us.proficiency}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-surface-800">No skills added yet. Add skills via the API or database.</p>
        )}
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-2xl p-8 border border-surface-200">
        <h2 className="font-semibold text-lg mb-4">
          Reviews
          {profile?.avgRating > 0 && (
            <span className="ml-2 text-brand-500">⭐ {profile.avgRating.toFixed(1)} ({profile.totalReviews})</span>
          )}
        </h2>
        {profile?.receivedReviews && profile.receivedReviews.length > 0 ? (
          <div className="space-y-4">
            {profile.receivedReviews.map((review: any) => (
              <div key={review.id} className="border-b border-surface-100 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{review.reviewer?.name}</span>
                  <span className="text-sm text-surface-800">{'⭐'.repeat(review.rating)}</span>
                </div>
                {review.content && <p className="text-sm text-surface-800">{review.content}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-surface-800">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}

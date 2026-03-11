'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { PortfolioAnalysisResponse, PortfolioSkill } from '@/types';

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
          <p className="text-sm text-surface-800">No skills added yet. Use the AI Portfolio Analyzer below to auto-detect your skills!</p>
        )}
      </div>

      {/* AI Portfolio Analyzer */}
      <PortfolioAnalyzer
        bio={form.bio}
        existingSkills={profile?.skills?.map((us: any) => us.skill.name) || []}
      />

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

// ============================================================
// Portfolio Analyzer Component
// ============================================================

function PortfolioAnalyzer({ bio, existingSkills }: { bio: string; existingSkills: string[] }) {
  const [urls, setUrls] = useState<string[]>(['']);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PortfolioAnalysisResponse | null>(null);
  const [error, setError] = useState('');

  const addUrlField = () => {
    if (urls.length < 5) setUrls([...urls, '']);
  };

  const updateUrl = (index: number, value: string) => {
    const updated = [...urls];
    updated[index] = value;
    setUrls(updated);
  };

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    } else {
      setUrls(['']);
    }
  };

  const handleAnalyze = async () => {
    const validUrls = urls.filter((u) => u.trim().length > 0);
    if (validUrls.length === 0 && !bio) {
      setError('Add at least one portfolio URL or fill in your bio first.');
      return;
    }

    setError('');
    setAnalyzing(true);
    setResult(null);

    try {
      const data = await api.analyzePortfolio(validUrls, bio, existingSkills);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Portfolio analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const proficiencyLabel = (level: number) => {
    if (level <= 3) return 'Beginner';
    if (level <= 6) return 'Intermediate';
    if (level <= 8) return 'Advanced';
    return 'Expert';
  };

  const proficiencyColor = (level: number) => {
    if (level <= 3) return 'bg-gray-100 text-gray-700';
    if (level <= 6) return 'bg-blue-100 text-blue-700';
    if (level <= 8) return 'bg-purple-100 text-purple-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="bg-white rounded-2xl p-8 border border-surface-200">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="font-semibold text-lg">🤖 AI Portfolio Analyzer</h2>
      </div>
      <p className="text-sm text-surface-800 mb-6">
        Add your portfolio links (GitHub, Behance, SoundCloud, etc.) and we&apos;ll use AI to auto-detect your skills, tools, and creative style.
      </p>

      {/* URL Inputs */}
      <div className="space-y-3 mb-4">
        {urls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => updateUrl(i, e.target.value)}
              placeholder={
                i === 0 ? 'https://github.com/username' :
                i === 1 ? 'https://behance.net/username' :
                i === 2 ? 'https://soundcloud.com/username' :
                'https://your-portfolio.com'
              }
              className="flex-1 px-4 py-2.5 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
            <button
              onClick={() => removeUrl(i)}
              className="text-surface-800 hover:text-red-500 px-2 transition-colors"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
        {urls.length < 5 && (
          <button
            onClick={addUrlField}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            + Add another link
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={analyzing}
        className="bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
      >
        {analyzing ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Analyzing portfolio...
          </span>
        ) : result ? 'Re-analyze' : 'Analyze My Portfolio'}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-5 pt-6 border-t border-surface-200">
          {/* Summary */}
          {result.summary && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Profile Summary</h3>
              <p className="text-sm text-surface-800 bg-surface-50 rounded-lg p-3">{result.summary}</p>
            </div>
          )}

          {/* Detected Skills */}
          {result.top_skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Detected Skills ({result.top_skills.length})
              </h3>
              <div className="space-y-2">
                {result.top_skills.map((skill: PortfolioSkill, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-surface-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{skill.name}</span>
                      <span className="text-[10px] bg-surface-200 text-surface-800 px-1.5 py-0.5 rounded">
                        {skill.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Proficiency bar */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, j) => (
                          <div
                            key={j}
                            className={`w-2 h-4 rounded-sm ${
                              j < skill.proficiency_estimate ? 'bg-brand-500' : 'bg-surface-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${proficiencyColor(skill.proficiency_estimate)}`}>
                        {proficiencyLabel(skill.proficiency_estimate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools Detected */}
          {result.tools_detected.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Tools & Software</h3>
              <div className="flex flex-wrap gap-2">
                {result.tools_detected.map((tool: string, i: number) => (
                  <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Artistic Styles */}
          {result.artistic_styles.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Artistic Styles</h3>
              <div className="flex flex-wrap gap-2">
                {result.artistic_styles.map((style: string, i: number) => (
                  <span key={i} className="text-xs bg-pink-50 text-pink-600 px-3 py-1 rounded-full font-medium">
                    {style}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Categories */}
          {result.suggested_categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Suggested Categories</h3>
              <div className="flex flex-wrap gap-2">
                {result.suggested_categories.map((cat: string, i: number) => (
                  <span key={i} className="text-xs bg-teal-50 text-teal-600 px-3 py-1 rounded-full font-medium capitalize">
                    {cat.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* URL Status */}
          {(result.urls_analyzed.length > 0 || result.urls_failed.length > 0) && (
            <div className="text-xs text-surface-800">
              {result.urls_analyzed.length > 0 && (
                <p>✅ Analyzed: {result.urls_analyzed.join(', ')}</p>
              )}
              {result.urls_failed.length > 0 && (
                <p className="text-red-500">❌ Failed to fetch: {result.urls_failed.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

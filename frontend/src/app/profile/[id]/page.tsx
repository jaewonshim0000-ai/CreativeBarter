'use client';


import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function PublicProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getUserById(id as string)
        .then(setProfile)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-brand-500/20" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-12 text-stone-400">User not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="reveal bg-stone-900 rounded-2xl p-8 border border-stone-800">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 text-3xl font-bold">
            {profile.name?.charAt(0) || '?'}
          </div>
          <div>
            <h1 className="reveal font-display text-3xl">{profile.name}</h1>
            <p className="text-stone-400 capitalize">{profile.specialty?.replace('_', ' ')}</p>
            <div className="flex items-center gap-3 mt-1 text-sm text-stone-400">
              {profile.city && <span>📍 {profile.city}{profile.region ? `, ${profile.region}` : ''}</span>}
              {profile.avgRating > 0 && (
                <span>⭐ {profile.avgRating.toFixed(1)} ({profile.totalReviews} reviews)</span>
              )}
            </div>
          </div>
        </div>
        {profile.bio && (
          <p className="mt-4 text-stone-400 leading-relaxed">{profile.bio}</p>
        )}
        {/* Message button — don't show on your own profile */}
        {user && user.id !== id && (
          <Link
            href={`/messages?user=${profile.id}&name=${encodeURIComponent(profile.name)}`}
            className="mt-4 inline-block bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-400 transition-colors btn-press"
          >
            💬 Send Message
          </Link>
        )}
      </div>

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="reveal bg-stone-900 rounded-2xl p-8 border border-stone-800">
          <h2 className="font-semibold text-lg mb-4">Skills</h2>
          <div className="space-y-2">
            {profile.skills.map((us: any) => (
              <div key={us.id} className="flex items-center justify-between">
                <span className="font-medium">{us.skill.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-brand-500/10 text-brand-300 px-2 py-0.5 rounded-full capitalize">
                    {us.proficiency}
                  </span>
                  {us.yearsExperience > 0 && (
                    <span className="text-xs text-stone-400">{us.yearsExperience}yr</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources */}
      {profile.resources && profile.resources.length > 0 && (
        <div className="reveal bg-stone-900 rounded-2xl p-8 border border-stone-800">
          <h2 className="font-semibold text-lg mb-4">Resources</h2>
          <div className="space-y-2">
            {profile.resources.map((ur: any) => (
              <div key={ur.id} className="flex items-center justify-between">
                <span className="font-medium">{ur.resource.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  ur.availability === 'available' ? 'bg-green-500/20 text-green-400' :
                  ur.availability === 'limited' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {ur.availability}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {profile.receivedReviews && profile.receivedReviews.length > 0 && (
        <div className="reveal bg-stone-900 rounded-2xl p-8 border border-stone-800">
          <h2 className="font-semibold text-lg mb-4">Reviews</h2>
          <div className="reveal-stagger space-y-4">
            {profile.receivedReviews.map((review: any) => (
              <div key={review.id} className="border-b border-stone-800/50 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{review.reviewer?.name}</span>
                  <span className="text-sm">{'⭐'.repeat(review.rating)}</span>
                </div>
                {review.project && (
                  <p className="text-xs text-stone-400 mb-1">Project: {review.project.title}</p>
                )}
                {review.content && <p className="text-sm text-stone-400">{review.content}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

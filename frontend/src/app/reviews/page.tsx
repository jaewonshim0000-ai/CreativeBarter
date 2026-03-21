'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface ReviewableMatch {
  matchId: string;
  projectId: string;
  projectTitle: string;
  otherUserId: string;
  otherUserName: string;
  otherUserImage?: string;
  alreadyReviewed: boolean;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'write' | 'given' | 'received'>('write');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="reveal font-display text-3xl text-stone-100">⭐ Reputation &amp; Reviews</h1>
        <p className="text-stone-400 mt-1">
          Build trust in the community by leaving honest reviews for your barter partners.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-800 rounded-xl p-1">
        {[
          { id: 'write' as const, label: '✍️ Write Review' },
          { id: 'received' as const, label: '📥 Received' },
          { id: 'given' as const, label: '📤 Given' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-stone-700 shadow-sm text-stone-100'
                : 'text-stone-400 hover:text-stone-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'write' && <WriteReviewSection />}
      {activeTab === 'received' && user && <ReceivedReviewsSection userId={user.id} />}
      {activeTab === 'given' && <GivenReviewsSection />}
    </div>
  );
}

// ============================================================
// Write Review Section
// ============================================================

function WriteReviewSection() {
  const [reviewable, setReviewable] = useState<ReviewableMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState<ReviewableMatch | null>(null);

  useEffect(() => {
    api.getReviewableMatches()
      .then(setReviewable)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleReviewSubmitted = () => {
    // Refresh the list
    api.getReviewableMatches().then(setReviewable).catch(console.error);
    setActiveReview(null);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-brand-500/20 mx-auto" />
      </div>
    );
  }

  const pending = reviewable.filter((r) => !r.alreadyReviewed);
  const done = reviewable.filter((r) => r.alreadyReviewed);

  return (
    <div className="space-y-6">
      {/* Active Review Form */}
      {activeReview && (
        <ReviewForm
          reviewableMatch={activeReview}
          onSubmitted={handleReviewSubmitted}
          onCancel={() => setActiveReview(null)}
        />
      )}

      {/* Pending reviews */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 p-6">
        <h2 className="font-semibold text-lg text-stone-100 mb-4">
          Pending Reviews ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">
            No pending reviews. Accept a match and collaborate to leave reviews!
          </p>
        ) : (
          <div className="reveal-stagger space-y-3">
            {pending.map((match) => (
              <div
                key={`${match.matchId}-${match.otherUserId}`}
                className="flex items-center justify-between p-4 bg-stone-800/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-medium">
                    {match.otherUserName.charAt(0)}
                  </div>
                  <div>
                    <Link href={`/profile/${match.otherUserId}`} className="font-medium text-sm text-stone-200 hover:text-brand-400 transition-colors">
                      {match.otherUserName}
                    </Link>
                    <p className="text-xs text-stone-500">Project: {match.projectTitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveReview(match)}
                  className="bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-400 transition-colors"
                >
                  Write Review
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Already reviewed */}
      {done.length > 0 && (
        <div className="bg-stone-900 rounded-2xl border border-stone-800 p-6">
          <h2 className="font-semibold text-stone-100 mb-3">Already Reviewed</h2>
          <div className="space-y-2">
            {done.map((match) => (
              <div
                key={`${match.matchId}-${match.otherUserId}`}
                className="flex items-center justify-between p-3 bg-stone-800/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-sm">✓</div>
                  <div>
                    <span className="text-sm text-stone-300">{match.otherUserName}</span>
                    <span className="text-xs text-stone-500 ml-2">— {match.projectTitle}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Review Form
// ============================================================

function ReviewForm({
  reviewableMatch,
  onSubmitted,
  onCancel,
}: {
  reviewableMatch: ReviewableMatch;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.createReview(
        reviewableMatch.otherUserId,
        reviewableMatch.projectId,
        rating,
        content || undefined
      );
      onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="bg-stone-900 rounded-2xl border border-brand-500/30 p-6 shadow-lg shadow-brand-500/5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg text-stone-100">
          Review {reviewableMatch.otherUserName}
        </h2>
        <button onClick={onCancel} className="text-stone-500 hover:text-stone-300 text-sm">
          Cancel
        </button>
      </div>

      <p className="text-xs text-stone-500 mb-4">
        Project: {reviewableMatch.projectTitle}
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {/* Star Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-stone-400 mb-3">Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <svg
                className={`w-10 h-10 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'text-amber-400'
                    : 'text-stone-700'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          {(hoverRating || rating) > 0 && (
            <span className="ml-3 text-sm text-stone-400 font-medium">
              {ratingLabels[hoverRating || rating]}
            </span>
          )}
        </div>
      </div>

      {/* Review Text */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-stone-400 mb-2">
          Your Experience <span className="text-stone-600">(optional)</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 resize-none"
          placeholder="How was your barter experience? Was the work quality good? Were they responsive and professional?"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="w-full bg-brand-500 text-white py-3 rounded-xl font-medium hover:bg-brand-400 transition-all btn-press disabled:opacity-50 shadow-lg shadow-brand-500/20"
      >
        {submitting ? 'Submitting...' : `Submit ${rating}-Star Review`}
      </button>
    </div>
  );
}

// ============================================================
// Received Reviews Section
// ============================================================

function ReceivedReviewsSection({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUserReviews(userId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-brand-500/20 mx-auto" />
      </div>
    );
  }

  if (!data || data.reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-stone-900 rounded-2xl border border-stone-800">
        <p className="text-stone-400">No reviews received yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Big score */}
          <div className="text-center md:text-left">
            <p className="text-5xl font-bold text-stone-100">{data.avgRating.toFixed(1)}</p>
            <div className="flex items-center justify-center md:justify-start gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className={`w-5 h-5 ${s <= Math.round(data.avgRating) ? 'text-amber-400' : 'text-stone-700'}`}
                  fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-xs text-stone-500 mt-1">{data.pagination.total} reviews</p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data.ratingDistribution?.[star] || 0;
              const pct = data.pagination.total > 0 ? (count / data.pagination.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 w-3">{star}</span>
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-stone-500 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="reveal-stagger space-y-3">
        {data.reviews.map((review: any) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Given Reviews Section
// ============================================================

function GivenReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyReviews()
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-brand-500/20 mx-auto" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-stone-900 rounded-2xl border border-stone-800">
        <p className="text-stone-400">You haven&apos;t written any reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="reveal-stagger space-y-3">
      {reviews.map((review: any) => (
        <div key={review.id} className="bg-stone-900 rounded-2xl border border-stone-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <Link href={`/profile/${review.reviewedUser?.id}`} className="flex items-center gap-2 hover:text-brand-400 transition-colors">
              <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 text-sm font-medium">
                {review.reviewedUser?.name?.charAt(0) || '?'}
              </div>
              <span className="font-medium text-sm text-stone-200">{review.reviewedUser?.name}</span>
            </Link>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-amber-400' : 'text-stone-700'}`}
                  fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
          {review.project && (
            <p className="text-xs text-stone-500 mb-2">Project: {review.project.title}</p>
          )}
          {review.content && (
            <p className="text-sm text-stone-300 leading-relaxed">{review.content}</p>
          )}
          <p className="text-[10px] text-stone-600 mt-2">
            {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Shared Review Card
// ============================================================

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="bg-stone-900 rounded-2xl border border-stone-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <Link href={`/profile/${review.reviewer?.id}`} className="flex items-center gap-2 hover:text-brand-400 transition-colors">
          <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 text-sm font-medium">
            {review.reviewer?.name?.charAt(0) || '?'}
          </div>
          <div>
            <span className="font-medium text-sm text-stone-200">{review.reviewer?.name}</span>
            {review.project && (
              <p className="text-[10px] text-stone-500">{review.project.title}</p>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-amber-400' : 'text-stone-700'}`}
                fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-stone-500 ml-1">{new Date(review.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      {review.content && (
        <p className="text-sm text-stone-300 leading-relaxed">{review.content}</p>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Project } from '@/types';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposalMessage, setProposalMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (id) {
      api.getProject(id as string)
        .then(setProject)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePropose = async () => {
    if (!project || !user) return;
    setSending(true);
    try {
      await api.createMatch(project.id, project.creatorId, proposalMessage);
      alert('Collaboration proposal sent!');
      setProposalMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to send proposal.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12 text-surface-800">Project not found.</div>;
  }

  const isOwner = user?.id === project.creatorId;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            project.status === 'open' ? 'bg-green-100 text-green-700' :
            project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {project.status.replace('_', ' ')}
          </span>
          {project.city && <span className="text-sm text-surface-800">📍 {project.city}{project.region ? `, ${project.region}` : ''}</span>}
        </div>
        <h1 className="font-display text-4xl">{project.title}</h1>
        <p className="text-surface-800 mt-3 leading-relaxed">{project.description}</p>
      </div>

      {/* Creator info */}
      <div className="bg-white rounded-2xl p-6 border border-surface-200">
        <h2 className="font-semibold mb-3">Created by</h2>
        <Link href={`/profile/${project.creatorId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-medium">
            {project.creator?.name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-medium">{project.creator?.name}</p>
            <p className="text-sm text-surface-800">
              {project.creator?.avgRating ? `⭐ ${project.creator.avgRating.toFixed(1)}` : 'New creator'}
            </p>
          </div>
        </Link>
      </div>

      {/* Skills & Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkillBlock title="Skills Needed" items={project.requiredSkills as any[]} color="red" />
        <SkillBlock title="Skills Offered" items={project.offeredSkills as any[]} color="green" />
        <SkillBlock title="Resources Needed" items={project.requiredResources as any[]} color="orange" />
        <SkillBlock title="Resources Offered" items={project.offeredResources as any[]} color="teal" />
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl p-6 border border-surface-200">
        <h2 className="font-semibold mb-3">Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-surface-800">Max Collaborators</span>
            <p className="font-medium">{project.maxCollaborators}</p>
          </div>
          {project.deadline && (
            <div>
              <span className="text-surface-800">Deadline</span>
              <p className="font-medium">{new Date(project.deadline).toLocaleDateString()}</p>
            </div>
          )}
          <div>
            <span className="text-surface-800">Posted</span>
            <p className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        {project.tags && (project.tags as string[]).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(project.tags as string[]).map((tag, i) => (
              <span key={i} className="text-xs bg-surface-100 text-surface-800 px-2 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Propose Collaboration (non-owner only) */}
      {!isOwner && user && project.status === 'open' && (
        <div className="bg-white rounded-2xl p-6 border border-surface-200">
          <h2 className="font-semibold mb-3">Propose Collaboration</h2>
          <textarea
            value={proposalMessage}
            onChange={(e) => setProposalMessage(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none mb-3"
            placeholder="Introduce yourself and explain how you can contribute..."
          />
          <button
            onClick={handlePropose}
            disabled={sending}
            className="bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Proposal'}
          </button>
        </div>
      )}

      {/* AI Analysis (owner only) */}
      {isOwner && (
        <div className="bg-white rounded-2xl p-6 border border-surface-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">🤖 AI Analysis</h2>
            <button
              onClick={async () => {
                if (!project) return;
                setAnalyzing(true);
                try {
                  const result = await api.analyzeText(project.description);
                  setAiAnalysis(result);
                } catch (err) {
                  console.error('AI analysis failed:', err);
                } finally {
                  setAnalyzing(false);
                }
              }}
              disabled={analyzing}
              className="text-sm bg-brand-50 text-brand-600 px-4 py-1.5 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : aiAnalysis ? 'Re-analyze' : 'Analyze Project'}
            </button>
          </div>
          {aiAnalysis ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-surface-800 mb-1">Extracted Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {(aiAnalysis.keywords || []).map((kw: string, i: number) => (
                    <span key={i} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-surface-800 mb-1">Categories</p>
                <div className="flex flex-wrap gap-1">
                  {(aiAnalysis.categories || []).map((cat: string, i: number) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              {aiAnalysis.summary && (
                <div>
                  <p className="text-xs font-medium text-surface-800 mb-1">AI Summary</p>
                  <p className="text-sm text-surface-800">{aiAnalysis.summary}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-surface-800">
              Click "Analyze Project" to let AI extract keywords and suggest relevant skill categories from your project description.
            </p>
          )}
        </div>
      )}

      {/* AI Recommended Collaborators (owner only) */}
      {isOwner && (
        <div className="bg-white rounded-2xl p-6 border border-surface-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">🤖 Recommended Collaborators</h2>
            <button
              onClick={async () => {
                if (!project) return;
                setRecsLoading(true);
                try {
                  const result = await api.getRecommendations(project.id);
                  setRecommendations(result.recommendations || []);
                } catch (err) {
                  console.error('Failed to load recommendations:', err);
                } finally {
                  setRecsLoading(false);
                }
              }}
              disabled={recsLoading}
              className="text-sm bg-brand-50 text-brand-600 px-4 py-1.5 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-50"
            >
              {recsLoading ? 'Finding...' : recommendations.length > 0 ? 'Refresh' : 'Find Collaborators'}
            </button>
          </div>
          {recsLoading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-surface-800 mt-2">AI is analyzing potential matches...</p>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-medium">
                      {rec.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <Link href={`/profile/${rec.user_id}`} className="font-medium text-sm hover:text-brand-600 transition-colors">
                        {rec.name}
                      </Link>
                      {rec.matched_skills && rec.matched_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.matched_skills.map((skill: string, j: number) => (
                            <span key={j} className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-brand-500">{Math.round(rec.score)}%</span>
                    <p className="text-[10px] text-surface-800">match</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-800">
              Click "Find Collaborators" to let AI match your project with the best available creatives.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SkillBlock({ title, items, color }: { title: string; items: any[]; color: string }) {
  if (!items || items.length === 0) return null;

  const colorMap: Record<string, string> = {
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    teal: 'bg-teal-50 text-teal-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-surface-200">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className={`text-xs px-3 py-1 rounded-full font-medium ${colorMap[color]}`}>
            {item.name || item}
          </span>
        ))}
      </div>
    </div>
  );
}

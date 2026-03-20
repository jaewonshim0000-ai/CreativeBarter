'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Project } from '@/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  async function loadProjects() {
    setLoading(true);
    try {
      const result = await api.getProjects({
        status: statusFilter,
        ...(keyword && { keyword }),
      });
      setProjects(result.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProjects();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="reveal font-display text-3xl">Projects</h1>
        <Link
          href="/projects/new"
          className="bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-400 transition-colors btn-press"
        >
          + New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search projects..."
            className="flex-1 px-4 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-700 text-white rounded-lg text-sm hover:bg-stone-600 btn-press transition-colors"
          >
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 text-sm"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="">All</option>
        </select>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-brand-500/20 mx-auto" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-stone-900 rounded-2xl border border-stone-800">
          <p className="text-stone-400">No projects found. Be the first to create one!</p>
        </div>
      ) : (
        <div className="reveal-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const statusColors: Record<string, string> = {
    open: 'bg-green-500/20 text-green-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-stone-700 text-stone-400',
    cancelled: 'bg-red-500/20 text-red-400',
    draft: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <Link
      href={`/projects/${project.id}`}
      className="bg-stone-900 rounded-2xl p-6 border border-stone-800 hover:border-brand-500/50 transition-all block card-hover glow-hover card-hover glow-hover"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[project.status] || ''}`}>
          {project.status.replace('_', ' ')}
        </span>
        {project.deadline && (
          <span className="text-xs text-stone-400">
            Due {new Date(project.deadline).toLocaleDateString()}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-lg mb-2 line-clamp-1">{project.title}</h3>
      <p className="text-sm text-stone-400 line-clamp-2 mb-4">{project.description}</p>

      {/* Skills needed */}
      {project.requiredSkills && (project.requiredSkills as any[]).length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-stone-400 mb-1 font-medium">Needs:</p>
          <div className="flex flex-wrap gap-1">
            {(project.requiredSkills as any[]).slice(0, 3).map((skill: any, i: number) => (
              <span key={i} className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">
                {skill.name || skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills offered */}
      {project.offeredSkills && (project.offeredSkills as any[]).length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-stone-400 mb-1 font-medium">Offers:</p>
          <div className="flex flex-wrap gap-1">
            {(project.offeredSkills as any[]).slice(0, 3).map((skill: any, i: number) => (
              <span key={i} className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">
                {skill.name || skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-800/50 mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-500/20 rounded-full flex items-center justify-center text-xs text-brand-400 font-medium">
            {project.creator?.name?.charAt(0) || '?'}
          </div>
          <span className="text-xs text-stone-400">{project.creator?.name || 'Unknown'}</span>
        </div>
        {project.city && (
          <span className="text-xs text-stone-400">📍 {project.city}</span>
        )}
      </div>
    </Link>
  );
}

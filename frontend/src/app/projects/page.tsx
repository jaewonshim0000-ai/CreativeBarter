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
        <h1 className="font-display text-3xl">Projects</h1>
        <Link
          href="/projects/new"
          className="bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-surface-200 rounded-lg text-sm"
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
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-surface-200">
          <p className="text-surface-800">No projects found. Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    open: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    draft: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <Link
      href={`/projects/${project.id}`}
      className="bg-white rounded-2xl p-6 border border-surface-200 hover:border-brand-300 hover:shadow-md transition-all block"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[project.status] || ''}`}>
          {project.status.replace('_', ' ')}
        </span>
        {project.deadline && (
          <span className="text-xs text-surface-800">
            Due {new Date(project.deadline).toLocaleDateString()}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-lg mb-2 line-clamp-1">{project.title}</h3>
      <p className="text-sm text-surface-800 line-clamp-2 mb-4">{project.description}</p>

      {/* Skills needed */}
      {project.requiredSkills && (project.requiredSkills as any[]).length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-surface-800 mb-1 font-medium">Needs:</p>
          <div className="flex flex-wrap gap-1">
            {(project.requiredSkills as any[]).slice(0, 3).map((skill: any, i: number) => (
              <span key={i} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                {skill.name || skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills offered */}
      {project.offeredSkills && (project.offeredSkills as any[]).length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-surface-800 mb-1 font-medium">Offers:</p>
          <div className="flex flex-wrap gap-1">
            {(project.offeredSkills as any[]).slice(0, 3).map((skill: any, i: number) => (
              <span key={i} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                {skill.name || skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-100 mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center text-xs text-brand-600 font-medium">
            {project.creator?.name?.charAt(0) || '?'}
          </div>
          <span className="text-xs text-surface-800">{project.creator?.name || 'Unknown'}</span>
        </div>
        {project.city && (
          <span className="text-xs text-surface-800">📍 {project.city}</span>
        )}
      </div>
    </Link>
  );
}

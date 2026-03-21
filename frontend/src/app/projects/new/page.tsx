'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    city: '',
    region: '',
    deadline: '',
    maxCollaborators: 5,
    requiredSkillsText: '',
    offeredSkillsText: '',
    requiredResourcesText: '',
    offeredResourcesText: '',
    tagsText: '',
  });

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const parseList = (text: string) =>
        text.split(',').map((s) => s.trim()).filter(Boolean).map((name) => ({ name }));

      const project = await api.createProject({
        title: form.title,
        description: form.description,
        city: form.city || undefined,
        region: form.region || undefined,
        deadline: form.deadline || undefined,
        maxCollaborators: form.maxCollaborators,
        requiredSkills: parseList(form.requiredSkillsText),
        offeredSkills: parseList(form.offeredSkillsText),
        requiredResources: parseList(form.requiredResourcesText),
        offeredResources: parseList(form.offeredResourcesText),
        tags: form.tagsText.split(',').map((s) => s.trim()).filter(Boolean),
      });

      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="reveal font-display text-3xl mb-8">Create New Project</h1>

      {error && (
        <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-stone-900 rounded-2xl p-8 border border-stone-800">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Project Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
            placeholder="e.g. Short Film Soundtrack Needed"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 resize-none"
            placeholder="Describe your project, what you're working on, and what kind of help you need..."
            required
          />
        </div>

        {/* Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Skills Needed</label>
            <input
              type="text"
              value={form.requiredSkillsText}
              onChange={(e) => update('requiredSkillsText', e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g. Music Composition, Mixing"
            />
            <p className="text-xs text-stone-400 mt-1">Comma-separated</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Skills Offered</label>
            <input
              type="text"
              value={form.offeredSkillsText}
              onChange={(e) => update('offeredSkillsText', e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g. Video Editing, Color Grading"
            />
            <p className="text-xs text-stone-400 mt-1">Comma-separated</p>
          </div>
        </div>

        {/* Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Resources Needed</label>
            <input
              type="text"
              value={form.requiredResourcesText}
              onChange={(e) => update('requiredResourcesText', e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g. Recording Studio, Microphone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Resources Offered</label>
            <input
              type="text"
              value={form.offeredResourcesText}
              onChange={(e) => update('offeredResourcesText', e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g. Camera Equipment, Editing Suite"
            />
          </div>
        </div>

        {/* Location & Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g. Seoul"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Region</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => update('region', e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g. Gangnam"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => update('deadline', e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <input
            type="text"
            value={form.tagsText}
            onChange={(e) => update('tagsText', e.target.value)}
            className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
            placeholder="e.g. film, music, collaboration"
          />
          <p className="text-xs text-stone-400 mt-1">Comma-separated</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 text-white py-3 rounded-xl font-medium hover:bg-brand-400 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </form>
    </div>
  );
}

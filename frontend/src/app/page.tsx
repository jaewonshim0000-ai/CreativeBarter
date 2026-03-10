'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Authenticated: show dashboard
  if (user) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-4xl text-surface-900">
            Welcome back, {user.name}
          </h1>
          <p className="text-surface-800 mt-2">
            Find collaborators, trade skills, and bring your creative projects to life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            title="My Projects"
            description="Manage your active and past projects"
            href="/projects"
            icon="📁"
          />
          <DashboardCard
            title="Explore Creatives"
            description="Discover nearby artists and their skills"
            href="/explore"
            icon="🔍"
          />
          <DashboardCard
            title="My Matches"
            description="View and respond to collaboration proposals"
            href="/matches"
            icon="🤝"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickAction
            title="Create a Project"
            description="Post what you need and what you can offer"
            href="/projects/new"
          />
          <QuickAction
            title="Update Profile"
            description="Keep your skills and portfolio up to date"
            href="/profile"
          />
        </div>
      </div>
    );
  }

  // Unauthenticated: show landing page
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="font-display text-5xl md:text-7xl text-surface-900 leading-tight">
          Trade Skills,<br />
          <span className="text-brand-500">Create Together</span>
        </h1>
        <p className="mt-6 text-lg text-surface-800 max-w-2xl mx-auto">
          A hyperlocal bartering network for creatives. Exchange your skills and resources
          with nearby artists, musicians, writers, and filmmakers — no money needed.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="bg-brand-500 text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25"
          >
            Get Started Free
          </Link>
          <Link
            href="/explore"
            className="border-2 border-surface-200 text-surface-800 px-8 py-3 rounded-xl text-lg font-medium hover:border-brand-500 transition-colors"
          >
            Explore
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard
          emoji="🎨"
          title="Skill Exchange"
          description="Offer your video editing in exchange for music composition. Trade web design for photography. The possibilities are endless."
        />
        <FeatureCard
          emoji="📍"
          title="Hyperlocal"
          description="Find collaborators in your neighborhood. Work with real people face-to-face, building lasting creative partnerships."
        />
        <FeatureCard
          emoji="🤖"
          title="Smart Matching"
          description="Our AI analyzes your skills and project needs to recommend the perfect collaborator — so you spend less time searching."
        />
      </section>

      {/* How It Works */}
      <section className="text-center">
        <h2 className="font-display text-3xl mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Create Profile', desc: 'List your skills, resources, and portfolio' },
            { step: '2', title: 'Post a Project', desc: 'Describe what you need and what you offer' },
            { step: '3', title: 'Get Matched', desc: 'AI finds the best collaborators nearby' },
            { step: '4', title: 'Collaborate', desc: 'Chat, barter, and create together' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                {item.step}
              </div>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="text-sm text-surface-800 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardCard({ title, description, href, icon }: {
  title: string; description: string; href: string; icon: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-6 border border-surface-200 hover:border-brand-300 hover:shadow-lg transition-all group"
    >
      <span className="text-3xl">{icon}</span>
      <h3 className="mt-3 font-semibold text-lg group-hover:text-brand-600 transition-colors">{title}</h3>
      <p className="text-sm text-surface-800 mt-1">{description}</p>
    </Link>
  );
}

function QuickAction({ title, description, href }: {
  title: string; description: string; href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-surface-200 hover:border-brand-300 transition-all"
    >
      <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 text-lg">+</div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-surface-800">{description}</p>
      </div>
    </Link>
  );
}

function FeatureCard({ emoji, title, description }: {
  emoji: string; title: string; description: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-surface-200">
      <span className="text-4xl">{emoji}</span>
      <h3 className="mt-4 font-semibold text-xl">{title}</h3>
      <p className="text-surface-800 mt-2">{description}</p>
    </div>
  );
}

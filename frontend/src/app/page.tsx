'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-brand-500/20" />
      </div>
    );
  }

  if (user) return <Dashboard user={user} />;
  return <LandingPage />;
}

// ============================================================
// LANDING PAGE — Editorial / Art Gallery aesthetic
// ============================================================

function LandingPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getCommunityStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      {/* ====== HERO ====== */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-surface-950 grain-overlay">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />

        {/* Floating organic shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-brand-400/8 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/5 blur-3xl" />

        {/* Decorative grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 w-full">
          <div className="max-w-4xl">
            {/* Eyebrow */}
            <div className="animate-fade-up delay-100">
              <span className="inline-flex items-center gap-2 text-brand-400 text-sm font-medium tracking-widest uppercase">
                <span className="w-8 h-px bg-brand-400" />
                For Creatives, By Creatives
              </span>
            </div>

            {/* Main headline */}
            <h1 className="mt-6 animate-fade-up delay-200">
              <span className="block font-display text-6xl md:text-8xl lg:text-9xl text-white leading-[0.9] tracking-tight">
                Your Skill
              </span>
              <span className="block font-display text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight mt-2">
                <span className="text-brand-400">Is</span>{' '}
                <span className="text-white italic">Currency</span>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-8 text-xl md:text-2xl text-stone-400 max-w-2xl leading-relaxed animate-fade-up delay-300">
              Trade video editing for music production. Swap web design for
              photography. No money needed — just your talent and
              a community that values it.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4 animate-fade-up delay-400">
              <Link
                href="/register"
                className="group relative bg-brand-500 text-white px-10 py-4 rounded-2xl text-lg font-semibold hover:bg-brand-400 transition-all duration-300 shadow-2xl shadow-brand-500/30 hover:shadow-brand-400/40 hover:-translate-y-0.5"
              >
                Start Trading Skills
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </Link>
              <Link
                href="/community"
                className="group text-stone-400 px-10 py-4 rounded-2xl text-lg font-medium border border-stone-700 hover:border-brand-500 hover:text-brand-400 transition-all duration-300"
              >
                Explore Community
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            {/* Live stats ticker */}
            {stats && (
              <div className="mt-16 flex flex-wrap gap-10 animate-fade-up delay-500">
                <StatPill value={stats.totalUsers} label="Creatives" />
                <StatPill value={stats.acceptedMatches} label="Trades Made" />
                <StatPill value={stats.totalSkills} label="Skills Shared" />
                <StatPill value={`$${stats.estimatedValueExchanged.toLocaleString()}`} label="Value Exchanged" />
              </div>
            )}
          </div>

          {/* Decorative side element */}
          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 animate-fade-in delay-600">
            <div className="relative">
              {/* Rotating ring */}
              <div className="w-64 h-64 border border-stone-700 rounded-full flex items-center justify-center" style={{
                animation: 'spin 20s linear infinite',
              }}>
                <div className="w-48 h-48 border border-stone-800 rounded-full flex items-center justify-center">
                  <div className="w-32 h-32 border border-brand-500/30 rounded-full flex items-center justify-center">
                    <span className="text-brand-400 font-display text-3xl italic">N</span>
                  </div>
                </div>
              </div>
              {/* Orbit dots */}
              {['🎨', '🎵', '📷', '✍️', '🎬', '🎮'].map((emoji, i) => (
                <div
                  key={i}
                  className="absolute w-10 h-10 bg-surface-800 border border-stone-700 rounded-full flex items-center justify-center text-sm"
                  style={{
                    top: `${50 + 45 * Math.sin((i * Math.PI * 2) / 6 - Math.PI / 2)}%`,
                    left: `${50 + 45 * Math.cos((i * Math.PI * 2) / 6 - Math.PI / 2)}%`,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${i * 0.3}s`,
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-stone-900/50 to-transparent" />
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="bg-stone-900/50 py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-brand-500 text-sm font-medium tracking-widest uppercase">The Process</span>
            <h2 className="font-display text-4xl md:text-6xl mt-3 text-stone-100">
              Four steps to your<br />
              <span className="italic text-brand-500">first trade</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
            {[
              {
                num: '01',
                title: 'Show Your Craft',
                desc: 'Add portfolio links — our AI auto-detects your skills, tools, and proficiency level.',
                accent: 'from-brand-500 to-orange-400',
              },
              {
                num: '02',
                title: 'Post or Browse',
                desc: 'Create a project with what you need and offer, or discover what others have.',
                accent: 'from-purple-500 to-pink-400',
              },
              {
                num: '03',
                title: 'Get Matched',
                desc: 'Our graph algorithm finds perfect matches — even multi-person circular trades.',
                accent: 'from-blue-500 to-cyan-400',
              },
              {
                num: '04',
                title: 'Trade & Grow',
                desc: 'Negotiate with credits, collaborate via chat, and build your reputation.',
                accent: 'from-green-500 to-emerald-400',
              },
            ].map((step, i) => (
              <div key={step.num} className="relative group">
                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-12 right-0 w-full h-px bg-stone-700 z-0" />
                )}
                <div className="relative z-10 p-8 text-center">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                    {step.num}
                  </div>
                  <h3 className="mt-5 font-semibold text-lg text-stone-100">{step.title}</h3>
                  <p className="mt-2 text-sm text-stone-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FEATURES BENTO GRID ====== */}
      <section className="bg-stone-900 py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-brand-500 text-sm font-medium tracking-widest uppercase">What Makes Us Different</span>
            <h2 className="font-display text-4xl md:text-6xl mt-3 text-stone-100">
              Not just another<br />
              <span className="italic text-brand-500">marketplace</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Large card */}
            <div className="md:col-span-2 bg-surface-950 rounded-3xl p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl group-hover:bg-brand-500/30 transition-all duration-500" />
              <div className="relative z-10">
                <span className="text-5xl">🔄</span>
                <h3 className="mt-4 text-2xl font-semibold">Circular Barter Chains</h3>
                <p className="mt-3 text-stone-400 text-lg leading-relaxed max-w-lg">
                  When A needs B and B needs C and C needs A — our graph algorithm
                  detects these loops automatically. Multi-party trades that were
                  impossible before are now one click away.
                </p>
              </div>
            </div>

            {/* Small card */}
            <div className="bg-gradient-to-br from-brand-500/10 to-orange-500/10 rounded-3xl p-8 border border-brand-500/20 group hover:shadow-xl transition-all duration-300">
              <span className="text-4xl">🤖</span>
              <h3 className="mt-4 text-xl font-semibold text-stone-100">AI Portfolio Scanner</h3>
              <p className="mt-2 text-stone-400 leading-relaxed">
                Paste your GitHub, Behance, or SoundCloud link.
                Claude analyzes your work and auto-detects skills
                with proficiency ratings.
              </p>
            </div>

            {/* Small card */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl p-8 border border-purple-500/20 group hover:shadow-xl transition-all duration-300">
              <span className="text-4xl">💰</span>
              <h3 className="mt-4 text-xl font-semibold text-stone-100">Trade Credits</h3>
              <p className="mt-2 text-stone-400 leading-relaxed">
                When trades aren&apos;t perfectly equal, credits bridge the gap.
                Negotiate, counter-offer, and settle on a fair exchange
                — all built in.
              </p>
            </div>

            {/* Medium card */}
            <div className="md:col-span-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl p-8 border border-blue-500/20 group hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <span className="text-5xl">🌍</span>
                <div>
                  <h3 className="text-xl font-semibold text-stone-100">Hyperlocal Community Map</h3>
                  <p className="mt-2 text-stone-400 leading-relaxed">
                    Discover creatives near you on an interactive map.
                    Click any pin to see their skills, portfolio, and rating —
                    then message them directly. Build real connections, not just digital ones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== SOCIAL IMPACT ====== */}
      <section className="relative bg-surface-950 py-24 px-6 lg:px-8 overflow-hidden grain-overlay">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <span className="text-brand-400 text-sm font-medium tracking-widest uppercase">Our Mission</span>
          <h2 className="font-display text-4xl md:text-6xl text-white mt-4 leading-tight">
            Empowering young creatives<br />
            <span className="italic text-brand-400">who can&apos;t afford to hire</span>
          </h2>
          <p className="mt-6 text-xl text-stone-400 max-w-3xl mx-auto leading-relaxed">
            Millions of student artists, musicians, and filmmakers have incredible
            talent but zero budget. Nuvra lets them trade what they know
            for what they need — no credit card, no paywall, no age restriction.
            Just skills for skills.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <ImpactCard
              icon="🎓"
              title="Student-First"
              desc="Built for 13-18 year olds who can't use payment platforms but are bursting with creative talent."
            />
            <ImpactCard
              icon="♻️"
              title="Zero Waste Economy"
              desc="Skills don't deplete. When you teach someone video editing, you still have the skill. Infinite value creation."
            />
            <ImpactCard
              icon="🌱"
              title="Community Growth"
              desc="Every trade builds trust, connections, and reputation — the foundation of a thriving creative ecosystem."
            />
          </div>
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="bg-stone-900/50 py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-7xl text-stone-100 leading-tight">
            Ready to trade<br />
            <span className="italic text-brand-500">your first skill?</span>
          </h2>
          <p className="mt-6 text-lg text-stone-400 max-w-xl mx-auto">
            Join a growing community of creatives who are building
            portfolios, earning reputations, and collaborating —
            all without spending a dollar.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-surface-900 text-white px-12 py-4 rounded-2xl text-lg font-semibold hover:bg-surface-800 transition-all duration-300 shadow-xl hover:-translate-y-0.5"
            >
              Create Free Account
            </Link>
            <Link
              href="/community"
              className="text-stone-400 px-8 py-4 rounded-2xl text-lg font-medium hover:text-brand-500 transition-colors"
            >
              View Community Map →
            </Link>
          </div>
          <p className="mt-6 text-xs text-stone-400">
            No credit card · No age restriction · 100 free credits on signup
          </p>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-surface-950 text-stone-500 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Nuvra" className="w-8 h-8" />
            <span className="font-display text-lg text-stone-300">Nuvra</span>
          </div>
          <p className="text-sm">
            Built for Raven Hacks VTL 2026 · Social Impact Track
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/community" className="hover:text-brand-400 transition-colors">Community</Link>
            <Link href="/register" className="hover:text-brand-400 transition-colors">Sign Up</Link>
            <Link href="/login" className="hover:text-brand-400 transition-colors">Log In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <p className="text-2xl md:text-3xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-stone-500 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function ImpactCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-stone-800/50 backdrop-blur border border-stone-700 rounded-2xl p-6 text-left hover:border-brand-500/50 transition-all duration-300">
      <span className="text-3xl">{icon}</span>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-stone-400 leading-relaxed">{desc}</p>
    </div>
  );
}

// ============================================================
// DASHBOARD (logged-in users)
// ============================================================

function Dashboard({ user }: { user: any }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="reveal font-display text-4xl text-stone-100">
          Welcome back, <span className="italic text-brand-500">{user.name}</span>
        </h1>
        <p className="text-stone-400 mt-2">
          Find collaborators, trade skills, and bring your creative projects to life.
        </p>
      </div>

      <div className="reveal-stagger grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="My Projects" description="Manage your active and past projects" href="/projects" icon="📁" />
        <DashboardCard title="Explore Creatives" description="Discover nearby artists and their skills" href="/explore" icon="🔍" />
        <DashboardCard title="My Matches" description="View and respond to collaboration proposals" href="/matches" icon="🤝" />
      </div>

      <div className="reveal-stagger grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard title="🔄 Circular Barters" description="Find multi-person skill exchange loops" href="/circular-barters" icon="" />
        <DashboardCard title="💰 My Wallet" description="Check your credit balance and trade history" href="/wallet" icon="" />
      </div>

      <div className="reveal-stagger grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickAction title="Create a Project" description="Post what you need and what you can offer" href="/projects/new" />
        <QuickAction title="Update Profile" description="Keep your skills and portfolio up to date" href="/profile" />
      </div>
    </div>
  );
}

function DashboardCard({ title, description, href, icon }: {
  title: string; description: string; href: string; icon: string;
}) {
  return (
    <Link
      href={href}
      className="bg-stone-900 rounded-2xl p-6 border border-stone-800 hover:border-brand-500/50 transition-all group card-hover glow-hover"
    >
      {icon && <span className="text-3xl">{icon}</span>}
      <h3 className={`${icon ? 'mt-3' : ''} font-semibold text-lg group-hover:text-brand-600 transition-colors`}>{title}</h3>
      <p className="text-sm text-stone-400 mt-1">{description}</p>
    </Link>
  );
}

function QuickAction({ title, description, href }: {
  title: string; description: string; href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-stone-900 rounded-2xl p-5 border border-stone-800 hover:border-brand-500/50 transition-all card-hover glow-hover"
    >
      <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 text-lg">+</div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-stone-400">{description}</p>
      </div>
    </Link>
  );
}

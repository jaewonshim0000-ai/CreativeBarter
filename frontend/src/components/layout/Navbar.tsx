'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-surface-950/80 backdrop-blur-xl border-b border-stone-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/logo.svg" alt="Nuvra" className="w-9 h-9 group-hover:scale-105 transition-transform" />
            <span className="font-display text-xl text-stone-100">
              Nuvra
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-5">
            {user ? (
              <>
                <NavLink href="/projects">Projects</NavLink>
                <NavLink href="/explore">Explore</NavLink>
                <NavLink href="/messages">Messages</NavLink>
                <NavLink href="/matches">Matches</NavLink>
                <NavLink href="/circular-barters">🔄 Circular</NavLink>
                <NavLink href="/wallet">💰 Wallet</NavLink>
                <NavLink href="/reviews">⭐ Reviews</NavLink>
                <NavLink href="/community">🌍 Map</NavLink>
                <div className="h-5 w-px bg-stone-700" />
                <Link href="/profile" className="text-brand-400 hover:text-brand-300 transition-colors text-sm font-medium">
                  {user.name}
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-stone-500 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink href="/community">🌍 Community</NavLink>
                <Link href="/login" className="text-sm text-stone-400 hover:text-stone-200 transition-colors font-medium">
                  Log In
                </Link>
                <Link href="/register" className="bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 text-stone-400" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-stone-800 space-y-2">
            {user ? (
              <>
                <MobileLink href="/projects" onClick={() => setMenuOpen(false)}>Projects</MobileLink>
                <MobileLink href="/explore" onClick={() => setMenuOpen(false)}>Explore</MobileLink>
                <MobileLink href="/messages" onClick={() => setMenuOpen(false)}>Messages</MobileLink>
                <MobileLink href="/matches" onClick={() => setMenuOpen(false)}>Matches</MobileLink>
                <MobileLink href="/circular-barters" onClick={() => setMenuOpen(false)}>🔄 Circular Barters</MobileLink>
                <MobileLink href="/wallet" onClick={() => setMenuOpen(false)}>💰 Wallet</MobileLink>
                <MobileLink href="/reviews" onClick={() => setMenuOpen(false)}>⭐ Reviews</MobileLink>
                <MobileLink href="/community" onClick={() => setMenuOpen(false)}>🌍 Community</MobileLink>
                <MobileLink href="/profile" onClick={() => setMenuOpen(false)}>Profile</MobileLink>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="block text-sm text-red-400 py-2 px-3 w-full text-left">Logout</button>
              </>
            ) : (
              <>
                <MobileLink href="/community" onClick={() => setMenuOpen(false)}>🌍 Community</MobileLink>
                <MobileLink href="/login" onClick={() => setMenuOpen(false)}>Log In</MobileLink>
                <MobileLink href="/register" onClick={() => setMenuOpen(false)}>Sign Up</MobileLink>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-stone-400 hover:text-brand-400 transition-colors text-sm font-medium">
      {children}
    </Link>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} className="block text-sm font-medium py-2 px-3 text-stone-300 hover:text-brand-400 hover:bg-stone-800/50 rounded-lg transition-all" onClick={onClick}>
      {children}
    </Link>
  );
}

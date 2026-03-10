'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-surface-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <span className="font-display text-xl text-surface-900">
              Creative Barter
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link
                  href="/projects"
                  className="text-surface-800 hover:text-brand-600 transition-colors text-sm font-medium"
                >
                  Projects
                </Link>
                <Link
                  href="/explore"
                  className="text-surface-800 hover:text-brand-600 transition-colors text-sm font-medium"
                >
                  Explore
                </Link>
                <Link
                  href="/messages"
                  className="text-surface-800 hover:text-brand-600 transition-colors text-sm font-medium"
                >
                  Messages
                </Link>
                <Link
                  href="/matches"
                  className="text-surface-800 hover:text-brand-600 transition-colors text-sm font-medium"
                >
                  Matches
                </Link>
                <div className="h-6 w-px bg-surface-200" />
                <Link
                  href="/profile"
                  className="text-surface-800 hover:text-brand-600 transition-colors text-sm font-medium"
                >
                  {user.name}
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-surface-800 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-surface-800 hover:text-brand-600 transition-colors font-medium"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
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
          <div className="md:hidden py-4 border-t border-surface-200 space-y-3">
            {user ? (
              <>
                <Link href="/projects" className="block text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>Projects</Link>
                <Link href="/explore" className="block text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>Explore</Link>
                <Link href="/messages" className="block text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>Messages</Link>
                <Link href="/matches" className="block text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>Matches</Link>
                <Link href="/profile" className="block text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>Profile</Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="block text-sm text-red-600 py-1">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>Log In</Link>
                <Link href="/register" className="block text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

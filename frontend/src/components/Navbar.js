import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  const navLinkClass = 'text-slate-200 hover:text-cyan-200 hover:bg-slate-800/60 px-4 py-2 rounded-xl text-sm font-medium transition-all';

  return (
    <nav className="sticky top-0 z-50 border-b border-cyan-200/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-7">
            <Link to={user ? '/dashboard' : '/login'} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-300/30 flex items-center justify-center shadow-neon">
                <span className="text-cyan-100 font-bold">code</span>
              </div>
              <div>
                <p className="font-display text-sm tracking-wide text-cyan-100 leading-tight">code DSA PORTAL</p>
                <p className="text-[11px] text-slate-400 leading-tight">Practice with intelligent guidance</p>
              </div>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-1">
                <Link to="/dashboard" className={navLinkClass}>Dashboard</Link>
                <Link to="/problems" className={navLinkClass}>Problems</Link>
                <Link to="/profile" className={navLinkClass}>Profile</Link>
                {user.role === 'ADMIN' && <Link to="/admin" className={navLinkClass}>Admin</Link>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:block text-sm text-slate-200">
                  Welcome, <span className="text-cyan-200 font-semibold">{user.username}</span>
                </span>
                <button onClick={logout} className="btn-secondary text-sm">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

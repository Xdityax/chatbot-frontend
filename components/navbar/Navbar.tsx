'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const authContext = useContext(AuthContext);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    }
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="navbar bg-slate-900 border-b border-cyan-400/20">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <Link href="/dashboard" className="text-xl font-bold text-cyan-400">
          Orbynex
        </Link>
        
        <div className="flex items-center gap-8">
          <Link 
            href="/dashboard" 
            className={`transition-colors ${isActive('/dashboard') ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'}`}
          >
            Dashboard
          </Link>
          <Link 
            href="/chat" 
            className={`transition-colors ${isActive('/chat') ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'}`}
          >
            Chat
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-300 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

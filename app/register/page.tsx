"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/auth';
import type { FormEvent } from 'react';

const calculatePasswordStrength = (password: string): { strength: string; color: string; percentage: number } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { strength: 'Weak', color: 'bg-red-500', percentage: 33 };
  if (score <= 4) return { strength: 'Medium', color: 'bg-yellow-500', percentage: 66 };
  return { strength: 'Strong', color: 'bg-green-500', percentage: 100 };
};

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('AuthContext is missing. Wrap the app with AuthProvider.');
  }

  const { saveAuth } = auth;
  const passwordStrength = calculatePasswordStrength(password);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      const res = await authService.register({ name, email, password });
      if (res.token) {
        saveAuth(res.user, res.token);
        router.push('/dashboard');
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setError('Registration error');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(61,243,255,0.18),_transparent_24%),linear-gradient(135deg,_#050816_0%,_#070b18_55%,_#04050d_100%)] px-4 py-10 text-slate-100">
      <div className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-purple-500/30 blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />

      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-sm flex-col justify-center rounded-[24px] border border-cyan-400/20 bg-slate-950/70 p-5 shadow-[0_0_80px_rgba(61,243,255,0.16)] backdrop-blur-2xl md:p-6">
        <span className="inline-flex w-fit items-center rounded-full border border-cyan-300/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/80">
          Create access
        </span>

        <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-transparent bg-gradient-to-r from-white via-cyan-100 to-violet-300 bg-clip-text">
          Sign Up
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Create your profile and unlock the chat workspace.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-3">
          <label className="grid gap-2 text-sm font-medium text-slate-200">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="min-h-11 rounded-2xl border border-cyan-300/20 bg-slate-900/70 px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-200/50 focus:ring-4 focus:ring-cyan-300/10"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-200">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="min-h-11 rounded-2xl border border-cyan-300/20 bg-slate-900/70 px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-200/50 focus:ring-4 focus:ring-cyan-300/10"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-200">
            Password
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                type={showPassword ? "text" : "password"}
                className="w-full min-h-11 rounded-2xl border border-cyan-300/20 bg-slate-900/70 px-4 pr-12 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-200/50 focus:ring-4 focus:ring-cyan-300/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.039M3 12.354c0-.468.033-.926.1-1.376m17.2 7.328a10.05 10.05 0 01-5.975 3.999m5.975-4.001l4.498 4.498M9.172 9.172L3.039 3.039m9.556 5.364l4.498-4.498" />
                  </svg>
                )}
              </button>
            </div>
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Strength</span>
                  <span className={`text-xs font-semibold ${
                    passwordStrength.strength === 'Weak' ? 'text-red-400' :
                    passwordStrength.strength === 'Medium' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {passwordStrength.strength}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-200">
            Confirm Password
            <div className="relative">
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                type={showConfirmPassword ? "text" : "password"}
                className="w-full min-h-11 rounded-2xl border border-cyan-300/20 bg-slate-900/70 px-4 pr-12 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-200/50 focus:ring-4 focus:ring-cyan-300/10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.039M3 12.354c0-.468.033-.926.1-1.376m17.2 7.328a10.05 10.05 0 01-5.975 3.999m5.975-4.001l4.498 4.498M9.172 9.172L3.039 3.039m9.556 5.364l4.498-4.498" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-rose-400 mt-1">Passwords do not match</p>
            )}
          </label>
          <button
            className="mt-1 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-300 px-5 text-sm font-semibold text-slate-950 shadow-[0_12px_34px_rgba(61,243,255,0.22)] transition hover:-translate-y-0.5"
            type="submit"
          >
            Sign Up
          </button>
          {error && <p className="text-sm text-rose-300">{error}</p>}
        </form>

        <p className="mt-5 text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-cyan-200 transition hover:text-cyan-100">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

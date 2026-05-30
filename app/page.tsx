'use client';

import Link from 'next/link';
import { MessageSquare, Bot, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-purple-500/30 blur-3xl" />
      <div className="absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] mb-3">
            <span className="bg-gradient-to-r from-cyan-400 via-white to-violet-400 bg-clip-text text-transparent">
              Orbynex AI Chat
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mb-5 max-w-2xl mx-auto">
            Experience intelligent conversations powered by AI. Chat, collaborate, and create with Orbynex.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold text-sm transition-colors"
            >
              Sign In
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-2 border border-cyan-400/50 hover:bg-cyan-400/10 rounded-lg font-semibold text-sm transition-colors"
            >
              Create Account
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 rounded-lg border border-cyan-400/20 bg-slate-900/50 backdrop-blur">
              <MessageSquare className="w-8 h-8 text-cyan-400 mb-2 mx-auto" />
              <h3 className="text-base font-semibold mb-1">Real-time Chat</h3>
              <p className="text-xs text-slate-400">Instant conversations with AI</p>
            </div>

            <div className="p-4 rounded-lg border border-cyan-400/20 bg-slate-900/50 backdrop-blur">
              <Bot className="w-8 h-8 text-violet-400 mb-2 mx-auto" />
              <h3 className="text-base font-semibold mb-1">Multiple Assistants</h3>
              <p className="text-xs text-slate-400">Different AI personalities</p>
            </div>

            <div className="p-4 rounded-lg border border-cyan-400/20 bg-slate-900/50 backdrop-blur">
              <ArrowRight className="w-8 h-8 text-emerald-400 mb-2 mx-auto" />
              <h3 className="text-base font-semibold mb-1">Seamless Integration</h3>
              <p className="text-xs text-slate-400">Connect effortlessly</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

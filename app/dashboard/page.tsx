'use client';

import useAuth from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, MessageSquare, Bot, Activity, Plus } from 'lucide-react';

export default function DashboardPage() {
  const auth = useAuth();
  const { user, logout } = auth || { user: null, logout: () => {} };
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [assistants] = useState([
    { id: 1, name: 'Companion', description: 'Warm, supportive, and conversational.' },
    { id: 2, name: 'Expert', description: 'Technical and detailed explanations.' },
    { id: 3, name: 'Creative', description: 'Imaginative and innovative ideas.' },
  ]);
  const [showAssistants, setShowAssistants] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-cyan-400">Loading...</div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-slate-400">Manage your chat workspace and AI interactions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/chat?new=true')}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-cyan-300 transition hover:bg-cyan-500/30"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-red-300 transition hover:bg-red-500/30"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Usage Stats */}
          <div className="rounded-lg border border-cyan-500/20 bg-slate-900/50 p-6 backdrop-blur">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
              <h2 className="font-semibold">Usage</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Chats</p>
                <p className="mt-1 text-2xl font-bold text-cyan-300">1</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Messages</p>
                <p className="mt-1 text-2xl font-bold text-cyan-300">18</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Assistants</p>
                <p className="mt-1 text-2xl font-bold text-emerald-300">1</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Avg/Chat</p>
                <p className="mt-1 text-2xl font-bold text-violet-300">18</p>
              </div>
            </div>
          </div>

          {/* Assistant Info */}
          <div className="rounded-lg border border-emerald-500/20 bg-slate-900/50 p-6 backdrop-blur">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-400" />
              <h2 className="font-semibold">Current Assistant</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Companion</p>
                <p className="mt-1 text-sm text-slate-400">Warm, supportive, and conversational.</p>
              </div>
              <button 
                onClick={() => setShowAssistants(!showAssistants)}
                className="w-full rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300 transition hover:bg-emerald-500/30"
              >
                Switch Assistant
              </button>
              
              {/* Assistants Dropdown */}
              {showAssistants && (
                <div className="mt-4 space-y-2 border-t border-slate-700 pt-4">
                  {assistants.map((assistant) => (
                    <button
                      key={assistant.id}
                      onClick={() => {
                        setShowAssistants(false);
                        router.push(`/chat?assistant=${assistant.id}`);
                      }}
                      className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-left transition hover:bg-emerald-500/20"
                    >
                      <p className="text-sm font-medium text-emerald-300">{assistant.name}</p>
                      <p className="text-xs text-slate-400">{assistant.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="mt-8 rounded-lg border border-cyan-500/20 bg-slate-900/50 p-6 backdrop-blur">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <p className="text-sm font-medium">Started conversation</p>
                <p className="text-xs text-slate-400">With Companion Assistant</p>
              </div>
              <span className="text-xs text-slate-500">Today</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Chat created</p>
                <p className="text-xs text-slate-400">New conversation session</p>
              </div>
              <span className="text-xs text-slate-500">Today</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

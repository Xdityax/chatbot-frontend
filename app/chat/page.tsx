"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bot,
  Copy,
  ChevronDown,
  ChevronRight,
  Download,
  Edit3,
  LogOut,
  Menu,
  Moon,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  User2,
  Wifi,
  WifiOff,
  X,
  Star,
} from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';
import { getApiBaseUrl } from '../../services/baseUrl';

type ThemeMode = 'dark' | 'light';
type AccentKey = 'cyan' | 'violet' | 'emerald';
type BubbleStyle = 'glass' | 'solid';
type AssistantType = 'companion' | 'coding' | 'business' | 'fitness' | 'tutor' | 'homework';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  starred?: boolean;
  status?: 'sending' | 'streaming' | 'sent';
};

type ChatRecord = {
  _id: string;
  title: string;
  assistantType: AssistantType;
  model?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
};

type UserProfile = {
  name?: string;
  email?: string;
  id?: string;
};

type AssistantPreset = {
  id: AssistantType;
  label: string;
  description: string;
  tone: string;
  color: string;
};

type StatusTone = 'neutral' | 'success' | 'warning';

const API_BASE = getApiBaseUrl();
const CHAT_STORAGE_KEY = 'orbynex-chat-ui-preferences';
const PINNED_STORAGE_KEY = 'orbynex-chat-pinned';

const assistants: AssistantPreset[] = [
  { id: 'companion', label: 'Companion', description: 'Warm, supportive, and conversational.', tone: 'Empathy first', color: 'from-sky-400 to-indigo-300' },
  { id: 'coding', label: 'Coding Assistant', description: 'Architecture, debugging, and clean code.', tone: 'Developer focus', color: 'from-cyan-400 to-blue-400' },
  { id: 'business', label: 'Business Assistant', description: 'Ideas, productivity, and strategy.', tone: 'Operator mode', color: 'from-amber-300 to-orange-400' },
  { id: 'fitness', label: 'Fitness Coach', description: 'Training plans and wellness habits.', tone: 'Energy and discipline', color: 'from-emerald-400 to-cyan-300' },
  { id: 'tutor', label: 'Intelligence Tutor', description: 'Logic, reasoning, and step-by-step help.', tone: 'Deep explanations', color: 'from-violet-400 to-fuchsia-300' },
  { id: 'homework', label: 'Homework Assistant', description: 'Study help with concise guidance.', tone: 'Education mode', color: 'from-rose-400 to-orange-300' },
];

const quickPrompts = [
  'Draft a SaaS onboarding flow for my app',
  'Explain this code in plain English',
  'Create a 7-day content plan for social media',
  'Debug my API latency issue',
];

const accentThemes: Record<AccentKey, { ring: string; gradient: string; glow: string; soft: string }> = {
  cyan: {
    ring: 'ring-cyan-300/30',
    gradient: 'from-cyan-400 via-sky-400 to-violet-400',
    glow: 'shadow-[0_0_40px_rgba(56,189,248,0.18)]',
    soft: 'bg-cyan-400/10',
  },
  violet: {
    ring: 'ring-violet-300/30',
    gradient: 'from-violet-400 via-fuchsia-400 to-cyan-400',
    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.18)]',
    soft: 'bg-violet-400/10',
  },
  emerald: {
    ring: 'ring-emerald-300/30',
    gradient: 'from-emerald-400 via-cyan-400 to-sky-400',
    glow: 'shadow-[0_0_40px_rgba(52,211,153,0.18)]',
    soft: 'bg-emerald-400/10',
  },
};

const bubbleStyles: Record<BubbleStyle, string> = {
  glass: 'border-white/10 bg-white/6 backdrop-blur-xl',
  solid: 'border-white/10 bg-slate-950/90',
};

const storageTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  return (window.localStorage.getItem(`${CHAT_STORAGE_KEY}:theme`) as ThemeMode) || 'dark';
};

const storageAccent = (): AccentKey => {
  if (typeof window === 'undefined') return 'cyan';
  const value = window.localStorage.getItem(`${CHAT_STORAGE_KEY}:accent`) as AccentKey | null;
  return value && ['cyan', 'violet', 'emerald'].includes(value) ? value : 'cyan';
};

const storageBubbleStyle = (): BubbleStyle => {
  if (typeof window === 'undefined') return 'glass';
  const value = window.localStorage.getItem(`${CHAT_STORAGE_KEY}:bubble`) as BubbleStyle | null;
  return value && ['glass', 'solid'].includes(value) ? value : 'glass';
};

const storageFontScale = (): number => {
  if (typeof window === 'undefined') return 1;
  const raw = window.localStorage.getItem(`${CHAT_STORAGE_KEY}:font`);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0.9 && parsed <= 1.1 ? parsed : 1;
};

const storageBotName = (): string => {
  if (typeof window === 'undefined') return 'Orbynex AI';
  return window.localStorage.getItem(`${CHAT_STORAGE_KEY}:bot`) || 'Orbynex AI';
};

const storagePinned = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PINNED_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

function formatShortDate(value: string) {
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderInline(text: string, keyPrefix: string, theme: 'dark' | 'light') {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-bold-${index}`}>{token.slice(2, -2)}</strong>,
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={`${keyPrefix}-code-${index}`} className={`rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 font-mono text-[0.88em] ${theme === 'dark' ? 'text-cyan-50' : 'text-black'}`}>
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const inner = token.match(/\[([^\]]+)\]\(([^\)]+)\)/);
      if (inner) {
        nodes.push(
          <a
            key={`${keyPrefix}-link-${index}`}
            href={inner[2]}
            target="_blank"
            rel="noreferrer"
            className={`underline decoration-cyan-300/50 underline-offset-4 ${theme === 'dark' ? 'text-cyan-200 hover:text-white' : 'text-black hover:text-slate-700'}`}
          >
            {inner[1]}
          </a>,
        );
      }
    }

    lastIndex = pattern.lastIndex;
    index += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function splitCodeBlocks(content: string) {
  const blocks: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  const regex = /```([\w-]+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }

    blocks.push({ type: 'code', language: match[1] || 'code', content: match[2].trim() });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    blocks.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return blocks.filter((block) => block.content.trim().length > 0);
}

function normalizeMessage(message: Partial<ChatMessage> & { role: 'user' | 'assistant' }) {
  return {
    id: message.id || uid(message.role),
    role: message.role,
    content: message.content || '',
    createdAt: message.createdAt || new Date().toISOString(),
    starred: message.starred || false,
    status: message.status || 'sent',
  } as ChatMessage;
}

function normalizeChat(chat: any): ChatRecord {
  return {
    _id: chat._id || chat.id || uid('chat'),
    title: chat.title || 'New chat',
    assistantType: (chat.assistantType || 'companion') as AssistantType,
    messages: Array.isArray(chat.messages)
      ? chat.messages.map((message: any) => normalizeMessage({ role: message.role || 'assistant', content: message.content, createdAt: message.createdAt }))
      : [],
    createdAt: chat.createdAt || new Date().toISOString(),
    updatedAt: chat.updatedAt || new Date().toISOString(),
    pinned: false,
  };
}

function renderMessageContent(content: string, theme: 'dark' | 'light') {
  const blocks = splitCodeBlocks(content);

  return blocks.map((block, blockIndex) => {
    if (block.type === 'code') {
      return (
        <div key={`code-${blockIndex}`} className="overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950/95">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
            <span>{block.language}</span>
            <span className={theme === 'dark' ? 'text-cyan-200/80' : 'text-black'}>Syntax block</span>
          </div>
          <pre className={`overflow-x-auto p-3 text-[13px] leading-6 ${theme === 'dark' ? 'text-slate-200' : 'text-black'}`}>
            <code>{block.content}</code>
          </pre>
        </div>
      );
    }

    const paragraphs = block.content.split(/\n{2,}/g);

    return (
      <div key={`text-${blockIndex}`} className="space-y-2 text-[14px] leading-7">
        {paragraphs.map((paragraph, paragraphIndex) => (
          <p key={`paragraph-${blockIndex}-${paragraphIndex}`} className="whitespace-pre-wrap break-words">
            {renderInline(paragraph, `inline-${blockIndex}-${paragraphIndex}`, theme)}
          </p>
        ))}
      </div>
    );
  });
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300/80 [animation-delay:150ms]" />
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300/60 [animation-delay:300ms]" />
    </div>
  );
}

function ChatPageContent() {
  const auth = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const historyScrollRef = useRef<HTMLDivElement | null>(null);

  const [ready, setReady] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [accent, setAccent] = useState<AccentKey>('cyan');
  const [bubbleStyle, setBubbleStyle] = useState<BubbleStyle>('glass');
  const [fontScale, setFontScale] = useState(1);
  const [botName, setBotName] = useState('Orbynex AI');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<AssistantType>('companion');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [starredMessageIds, setStarredMessageIds] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>(['openai']);
  const [selectedModel, setSelectedModel] = useState<string>('auto');

  const apiBase = API_BASE;

  useEffect(() => {
    // Wait for auth context to initialize from localStorage
    const checkAuth = setInterval(() => {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      const hasAuth = token || auth?.user;
      
      if (hasAuth) {
        // Auth is available, set up
        const rawUser = typeof window !== 'undefined' ? window.localStorage.getItem('user') : null;

        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser) as UserProfile;
            setUserProfile(parsed);
          } catch {
            if (auth?.user) {
              setUserProfile({
                id: auth.user.id,
                name: auth.user.name,
                email: auth.user.email,
              });
            } else {
              setUserProfile({});
            }
          }
        } else if (auth?.user) {
          setUserProfile({
            id: auth.user.id,
            name: auth.user.name,
            email: auth.user.email,
          });
        }

        setTheme(storageTheme());
        setAccent(storageAccent());
        setBubbleStyle(storageBubbleStyle());
        setFontScale(storageFontScale());
        setBotName(storageBotName());
        setPinnedChats(storagePinned());

        if (typeof window !== 'undefined') {
          try {
            const rawStars = window.localStorage.getItem(`${CHAT_STORAGE_KEY}:stars`);
            setStarredMessageIds(rawStars ? (JSON.parse(rawStars) as string[]) : []);
          } catch {
            setStarredMessageIds([]);
          }
        }

        setReady(true);
        clearInterval(checkAuth);
      }
    }, 50);

    // Fail-safe: redirect to login after 3 seconds if no auth found
    const failSafeTimer = setTimeout(() => {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      if (!token && !auth?.user && !ready) {
        router.replace('/login');
      }
      clearInterval(checkAuth);
    }, 3000);

    return () => {
      clearInterval(checkAuth);
      clearTimeout(failSafeTimer);
    };
  }, [router, auth?.user]);

  useEffect(() => {
    if (!ready || !userProfile?.id) return;

    const loadChats = async () => {
      try {
        const response = await axios.get<ChatRecord[]>(`${apiBase}/api/chat`, {
          params: { userId: userProfile.id },
        });
        const normalized = (response.data || []).map((chat) => ({
          ...normalizeChat(chat),
          pinned: pinnedChats.includes(chat._id),
        }));
        setChats(normalized);
        
        // Check if user clicked "New Chat" from dashboard
        const isNewChat = searchParams.get('new') === 'true';
        if (isNewChat) {
          setActiveChatId(null);
        } else {
          setActiveChatId(normalized[0]?._id || null);
        }
      } catch {
        setChats([]);
      }
    };

    const loadModels = async () => {
      try {
        const response = await axios.get<{ models: string[] }>(`${apiBase}/api/chat/models/available`);
        setAvailableModels(response.data.models || ['openai']);
      } catch {
        setAvailableModels(['openai']);
      }
    };

    loadChats();
    loadModels();

    loadChats();
  }, [ready, userProfile?.id, apiBase, pinnedChats, searchParams]);

  useEffect(() => {
    if (!ready) return;

    const socket = io(apiBase, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    const markConnected = () => setSocketConnected(true);
    const markDisconnected = () => setSocketConnected(false);

    socket.on('connect', markConnected);
    socket.on('disconnect', markDisconnected);
    socket.on('receive_message', () => {
      // live sync channel from backend
    });
    socket.on('message', () => {
      // compatibility with the alternate socket emitter already present in the repo
    });

    return () => {
      socket.off('connect', markConnected);
      socket.off('disconnect', markDisconnected);
      socket.disconnect();
    };
  }, [apiBase, ready]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chats, activeChatId, isSending]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`${CHAT_STORAGE_KEY}:theme`, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`${CHAT_STORAGE_KEY}:accent`, accent);
  }, [accent]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`${CHAT_STORAGE_KEY}:bubble`, bubbleStyle);
  }, [bubbleStyle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`${CHAT_STORAGE_KEY}:font`, String(fontScale));
  }, [fontScale]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`${CHAT_STORAGE_KEY}:bot`, botName);
  }, [botName]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`${CHAT_STORAGE_KEY}:stars`, JSON.stringify(starredMessageIds));
  }, [starredMessageIds]);

  const activeChat = useMemo(
    () => (activeChatId ? chats.find((chat) => chat._id === activeChatId) || null : null),
    [chats, activeChatId],
  );
  const messages = activeChat?.messages || [];

  const selectedAssistantMeta = useMemo(
    () => assistants.find((assistant) => assistant.id === selectedAssistant) || assistants[0],
    [selectedAssistant],
  );

  const filteredChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const sorted = [...chats].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (!query) return sorted;

    return sorted.filter((chat) => {
      const title = chat.title.toLowerCase();
      const assistant = chat.assistantType.toLowerCase();
      const preview = chat.messages.map((item) => item.content).join(' ').toLowerCase();
      return title.includes(query) || assistant.includes(query) || preview.includes(query);
    });
  }, [chats, searchQuery]);

  const metrics = useMemo(() => {
    const totalChats = chats.length;
    const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0);
    const activeAssistants = new Set(chats.map((chat) => chat.assistantType)).size;
    const avgMessages = totalChats ? Math.round(totalMessages / totalChats) : 0;

    return { totalChats, totalMessages, activeAssistants, avgMessages };
  }, [chats]);

  const userName = auth?.user?.name || userProfile?.name || 'Explorer';
  const userEmail = auth?.user?.email || userProfile?.email || 'signed in';

  const handleLogout = () => {
    auth?.logout();
    router.replace('/login');
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessage('');
    setSelectedAssistant('companion');
    setMobileSidebarOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    const chat = chats.find((c) => c._id === chatId);
    if (chat) {
      setSelectedAssistant(chat.assistantType);
      setSelectedModel(chat.model || 'auto');
    }
    setMobileSidebarOpen(false);
  };

  const handlePinChat = (chatId: string) => {
    setPinnedChats((current) =>
      current.includes(chatId) ? current.filter((item) => item !== chatId) : [chatId, ...current],
    );
    setChats((current) => current.map((chat) => (chat._id === chatId ? { ...chat, pinned: !chat.pinned } : chat)));
  };

  const handleRenameChat = (chatId: string) => {
    const current = chats.find((chat) => chat._id === chatId);
    const nextTitle = window.prompt('Rename conversation', current?.title || 'New chat');
    if (!nextTitle?.trim()) return;

    setChats((current) => current.map((chat) => (chat._id === chatId ? { ...chat, title: nextTitle.trim() } : chat)));
  };

  const handleDeleteChat = async (chatId: string) => {
    const current = chats.find((chat) => chat._id === chatId);
    if (!current) return;

    if (!window.confirm(`Delete "${current.title}"?`)) return;

    try {
      await axios.delete(`${apiBase}/api/chat/${chatId}`);
    } catch {
      // best-effort delete even if backend is offline
    }

    const nextChats = chats.filter((chat) => chat._id !== chatId);
    setChats(nextChats);
    setPinnedChats((currentPinned) => currentPinned.filter((id) => id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(nextChats[0]?._id || null);
    }
  };

  const getActiveChatTitle = () => activeChat?.title || 'New conversation';

  const handleSend = async (input?: string) => {
    const trimmed = (input ?? message).trim();
    if (!trimmed || !userProfile?.id) return;

    const userMessage: ChatMessage = normalizeMessage({ role: 'user', content: trimmed, createdAt: new Date().toISOString(), status: 'sent' });
    const assistantPlaceholder: ChatMessage = normalizeMessage({ role: 'assistant', content: 'Thinking...', createdAt: new Date().toISOString(), status: 'streaming' });

    setIsSending(true);
    setMessage('');

    let nextChatId = activeChat?._id || uid('chat');
    let nextChatTitle = activeChat?.title || trimmed.slice(0, 46);

    if (!activeChat) {
      const tempChat: ChatRecord = {
        _id: nextChatId,
        title: nextChatTitle,
        assistantType: selectedAssistant,
        model: selectedModel,
        messages: [userMessage, assistantPlaceholder],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
      };
      setChats((current) => [tempChat, ...current]);
      setActiveChatId(tempChat._id);
    } else {
      setChats((current) =>
        current.map((chat) =>
          chat._id === activeChat._id ? { ...chat, messages: [...chat.messages, userMessage, assistantPlaceholder], updatedAt: new Date().toISOString() } : chat,
        ),
      );
      nextChatId = activeChat._id;
      nextChatTitle = activeChat.title;
    }

    try {
      const response = await axios.post<ChatRecord>(`${apiBase}/api/chat`, {
        message: trimmed,
        userId: userProfile.id,
        assistantType: selectedAssistant,
        title: nextChatTitle,
        model: selectedModel,
        chatId: activeChat?._id || undefined,
      });

      const normalized = normalizeChat(response.data);

      setChats((current) => {
        const pinned = current.find((chat) => chat._id === nextChatId)?.pinned || false;
        const withoutTemp = current.filter((chat) => chat._id !== nextChatId && chat._id !== normalized._id);
        return [{ ...normalized, pinned }, ...withoutTemp];
      });

      setActiveChatId(normalized._id);
    } catch {
      setChats((current) =>
        current.map((chat) =>
          chat._id === nextChatId
            ? {
                ...chat,
                messages: chat.messages.map((item) =>
                  item.id === assistantPlaceholder.id
                    ? {
                        ...item,
                        content: 'I could not reach the AI service right now.',
                        status: 'sent',
                      }
                    : item,
                ),
              }
            : chat,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = () => {
    if (!activeChat) return;
    const lastUserMessage = [...activeChat.messages].reverse().find((item) => item.role === 'user');
    if (lastUserMessage) {
      handleSend(lastUserMessage.content);
    }
  };

  const toggleStarMessage = (chatId: string, messageId: string) => {
    setChats((current) =>
      current.map((chat) =>
        chat._id !== chatId
          ? chat
          : {
              ...chat,
              messages: chat.messages.map((item) => (item.id === messageId ? { ...item, starred: !item.starred } : item)),
            },
      ),
    );

    setStarredMessageIds((current) =>
      current.includes(messageId) ? current.filter((id) => id !== messageId) : [messageId, ...current],
    );
  };

  const copyMessage = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(chats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'orbynex-chat-history.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const scrollHistoryUp = () => {
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollBy({ top: -120, behavior: 'smooth' });
    }
  };

  const scrollHistoryDown = () => {
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollBy({ top: 120, behavior: 'smooth' });
    }
  };

  const applyThemeClass = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
  const surfaceClass = theme === 'dark' ? 'bg-slate-950/85 border-white/10' : 'bg-white/80 border-slate-200/80';
  const panelClass = theme === 'dark' ? 'bg-slate-950/70 border-cyan-400/15' : 'bg-white/75 border-slate-200/70';
  const pageClass = theme === 'dark'
    ? 'bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.24),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(61,243,255,0.18),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#050816_52%,_#01030a_100%)]'
    : 'bg-[radial-gradient(circle_at_top_left,_rgba(165,180,252,0.45),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(103,232,249,0.3),_transparent_20%),linear-gradient(135deg,_#f8fbff_0%,_#edf4ff_52%,_#ffffff_100%)]';
  const accentStyle = accentThemes[accent];

  if (!ready) {
    return (
      <div className={`min-h-screen ${pageClass} ${applyThemeClass} flex items-center justify-center`}>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 backdrop-blur-xl">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
          Loading Orbynex...
        </div>
      </div>
    );
  }

  return (
    <main className={`relative h-screen overflow-hidden ${pageClass} ${applyThemeClass}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className={`absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl ${theme === 'dark' ? 'opacity-100' : 'opacity-60'}`}
          animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute right-10 top-10 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl ${theme === 'dark' ? 'opacity-100' : 'opacity-50'}`}
          animate={{ y: [0, -18, 0], x: [0, -12, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl ${theme === 'dark' ? 'opacity-100' : 'opacity-50'}`}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1680px] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
        <header className={`flex items-center gap-1.5 rounded-2xl border ${surfaceClass} px-2 py-1.5 shadow-[0_0_60px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:px-3`}>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${theme === 'dark' ? 'border-white/10 bg-white/5 text-slate-100' : 'border-slate-200 bg-white text-slate-900'} lg:hidden`}
          >
            <Menu className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setSidebarCollapsed((current) => !current)}
            className={`hidden h-8 items-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition lg:inline-flex ${theme === 'dark' ? 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'}`}
          >
            <ChevronRight className={`h-3 w-3 transition ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            {sidebarCollapsed ? 'Expand' : 'Collapse'}
          </button>

          <div className="flex min-w-0 items-center gap-1.5 ml-[10%]">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${accentStyle.gradient} text-slate-950 ${accentStyle.glow}`}>
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className={`text-[8px] uppercase tracking-[0.28em] ${theme === 'dark' ? 'text-cyan-200/80' : 'text-black'}`}>Orbynex AI Workspace</p>
              <h1 className="truncate text-sm font-semibold sm:text-base">Hello {userName} !!!</h1>
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-center lg:flex">
            <label className={`flex w-full max-w-[320px] items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10px] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search conversations, prompts, or code..."
                className="w-full bg-transparent outline-none placeholder:text-slate-500"
              />
            </label>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className={`hidden items-center gap-1.5 rounded-full border px-2 py-1.5 text-[10px] font-medium sm:flex ${theme === 'dark' ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
              {socketConnected ? <Wifi className="h-2.5 w-2.5 text-emerald-400" /> : <WifiOff className="h-2.5 w-2.5 text-amber-400" />}
              {socketConnected ? 'Live' : 'Reconnecting'}
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${theme === 'dark' ? 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'}`}
              title="Go to Dashboard"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${theme === 'dark' ? 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'}`}
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${theme === 'dark' ? 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'}`}
            >
              <Settings className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleLogout}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${theme === 'dark' ? 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'}`}
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 gap-4">
          <AnimatePresence>
            {(mobileSidebarOpen || !sidebarCollapsed) && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className={`fixed left-0 top-0 z-30 h-full w-[88vw] max-w-[300px] p-2 lg:relative lg:flex lg:h-full lg:min-h-0 lg:w-[18rem] lg:flex-col lg:flex-shrink-0 lg:p-0 ${mobileSidebarOpen ? 'flex' : 'hidden lg:flex'}`}
              >
                <div className={`flex h-full flex-col overflow-hidden rounded-[28px] border-2 ${theme === 'dark' ? 'border-cyan-500/30 bg-slate-950/85 shadow-[0_0_60px_rgba(6,182,212,0.12)]' : 'border-cyan-300/40 bg-white/85 shadow-[0_0_50px_rgba(6,182,212,0.08)]'} backdrop-blur-2xl`}>
                  <div className="flex items-center justify-between border-b border-white/10 p-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${accentStyle.gradient} text-slate-950 flex-shrink-0 ${accentStyle.glow}`}>
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[10px] uppercase tracking-[0.22em] ${theme === 'dark' ? 'text-cyan-200/70' : 'text-black'}`}>Conversations</p>
                        <h2 className="text-sm font-semibold truncate">{botName}</h2>
                      </div>
                    </div>
                    <button onClick={() => setMobileSidebarOpen(false)} className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border flex-shrink-0 lg:hidden ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex h-full flex-col gap-0">
                    {/* Fixed Top Section */}
                    <div className="space-y-1 p-1.5 flex-shrink-0">
                      <button
                        onClick={handleNewChat}
                        className={`flex w-full items-center justify-between rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition ${accentStyle.soft} border-cyan-300/20 ${theme === 'dark' ? 'text-cyan-50' : 'text-black'} hover:brightness-110 ${accentStyle.glow}`}
                      >
                        <span className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          New Chat
                        </span>
                        <ChevronRight className="h-3 w-3" />
                      </button>

                      <div className={`h-px ${theme === 'dark' ? 'bg-gradient-to-r from-white/0 via-white/15 to-white/0' : 'bg-gradient-to-r from-slate-200/0 via-slate-300 to-slate-200/0'}`} />

                      <label className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
                        <Search className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <input
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="Search conversations"
                          className="w-full bg-transparent outline-none placeholder:text-slate-500"
                        />
                      </label>
                    </div>

                    {/* Scrollable History Section */}
                    <div className="flex-1 min-h-0 flex flex-col px-1 pt-0.5 pb-1">
                      <div className="flex items-center justify-between mb-0.5 text-[10px] uppercase tracking-tight font-medium text-slate-400 px-0.5">
                        <span>History</span>
                        <span className="text-[9px]">{filteredChats.length}</span>
                      </div>
                      <div className={`relative flex-1 rounded-xl border flex flex-col overflow-hidden ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                        <div 
                          ref={historyScrollRef}
                          className="flex-1 space-y-0.5 overflow-y-auto p-0.75"
                        >
                          {filteredChats.map((chat) => {
                            const active = chat._id === activeChat?._id;
                            return (
                              <div
                                key={chat._id}
                                className={`group rounded-2xl border p-1 h-[60px] transition flex items-center justify-between gap-1 ${active ? 'border-cyan-300/30 bg-cyan-400/10' : theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                              >
                                {/* Left: Title + meta */}
                                <div className="flex-1 min-w-0 pr-0.5">
                                  <button onClick={() => handleSelectChat(chat._id)} className="text-left w-full">
                                    <p className="truncate text-[10px] font-semibold leading-snug">{chat.title}</p>
                                    <p className="mt-0.25 text-[9px] opacity-70 truncate">{chat.assistantType}</p>
                                  </button>
                                  <div className="mt-0.25 text-[8px] opacity-60 truncate">{formatShortDate(chat.updatedAt)}</div>
                                </div>

                                {/* Right: actions + avatar */}
                                <div className="flex flex-col items-end gap-0.25 flex-shrink-0">
                                  <div className="flex items-center gap-0.25">
                                    <button onClick={() => handlePinChat(chat._id)} className="p-0.25 rounded-md transition hover:bg-white/10" title="Pin">
                                      <Pin className={`h-2 w-2 ${chat.pinned ? (theme === 'dark' ? 'text-cyan-300' : 'text-black') : ''}`} />
                                    </button>
                                    <button onClick={() => handleRenameChat(chat._id)} className="p-0.25 rounded-md transition hover:bg-white/10" title="Rename">
                                      <Edit3 className="h-2 w-2" />
                                    </button>
                                    <button onClick={() => handleDeleteChat(chat._id)} className="p-0.25 rounded-md transition hover:bg-white/10" title="Delete">
                                      <Trash2 className="h-2 w-2" />
                                    </button>
                                  </div>

                                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${accentStyle.gradient} flex items-center justify-center text-slate-950 ${accentStyle.glow}`}>
                                    <User2 className="h-2.5 w-2.5" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {filteredChats.length === 0 && (
                            <div className={`rounded-2xl border border-dashed px-4 py-6 text-sm text-slate-400 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
                              No conversations yet. Start a new chat.
                            </div>
                          )}
                        </div>
                        {filteredChats.length > 3 && (
                          <div className={`flex items-center justify-between border-t flex-shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'} p-0.75 gap-0.5`}>
                            <button
                              onClick={scrollHistoryUp}
                              className={`flex-1 flex items-center justify-center py-0.75 rounded-lg transition ${theme === 'dark' ? 'border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300' : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}
                              title="Scroll up"
                            >
                              <ChevronDown className="h-3 w-3 rotate-180" />
                            </button>
                            <button
                              onClick={scrollHistoryDown}
                              className={`flex-1 flex items-center justify-center py-0.75 rounded-lg transition ${theme === 'dark' ? 'border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300' : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}
                              title="Scroll down"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          <section className={`flex min-w-0 flex-1 flex-col rounded-[28px] border-2 ${theme === 'dark' ? 'border-emerald-500/25 bg-slate-950/85 shadow-[0_0_70px_rgba(16,185,129,0.12)]' : 'border-emerald-300/35 bg-white/85 shadow-[0_0_60px_rgba(16,185,129,0.08)]'} backdrop-blur-2xl overflow-hidden`}>
            {/* Fixed Header */}
            <div className="flex items-center justify-between gap-1.5 border-b border-white/10 px-2 py-1.5 sm:px-3 flex-shrink-0">
              <div className="min-w-0">
                <div className={`flex items-center gap-1 text-[8px] uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-cyan-200/80' : 'text-black'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>{socketConnected ? 'Connected' : 'Connecting'}</span>
                </div>
                <h2 className="mt-0.5 truncate text-sm font-semibold sm:text-base">{getActiveChatTitle()}</h2>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedAssistant((current) => assistants[(assistants.findIndex((item) => item.id === current) + 1) % assistants.length].id)}
                  className={`hidden rounded-lg border px-2 py-1 text-[10px] transition md:inline-flex ${theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  {selectedAssistantMeta.tone}
                </button>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className={`hidden rounded-lg border px-2 py-1 text-[10px] transition md:inline-flex ${theme === 'dark' ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'}`}
                >
                  <option value="auto">Auto Model</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model.charAt(0).toUpperCase() + model.slice(1)}
                    </option>
                  ))}
                </select>
                <button onClick={handleRegenerate} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] transition ${theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  <RotateCcw className="h-3 w-3" />
                  Regenerate
                </button>
              </div>
            </div>

            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto px-2.5 py-3 sm:px-4 min-h-0">
              {messages.length === 0 ? (
                <div className="relative flex min-h-[calc(100vh-240px)] items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] px-4 py-8">
                  <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 6, repeat: Infinity }}
                  >
                    <div className="absolute left-10 top-8 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
                    <div className="absolute right-10 top-16 h-44 w-44 rounded-full bg-violet-400/20 blur-3xl" />
                    <div className="absolute bottom-8 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
                  </motion.div>

                  <div className="relative z-10 mx-auto max-w-3xl text-center">
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br ${accentStyle.gradient} text-slate-950 ${accentStyle.glow}`}>
                      <Bot className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                      Premium AI workspace, built for modern conversations.
                    </h3>
                    <p className="mt-2.5 text-xs leading-6 text-slate-400 sm:text-sm">
                      ChatGPT-inspired speed, Claude-like clarity, and Gemini-style polish in one elegant dashboard.
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {quickPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => setMessage(prompt)}
                          className={`rounded-2xl border p-2.5 text-left text-xs transition hover:-translate-y-0.5 ${theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                        >
                          <p className={`text-[10px] uppercase tracking-[0.22em] ${theme === 'dark' ? 'text-cyan-200/70' : 'text-black'}`}>Suggested prompt</p>
                          <p className="mt-2 leading-5">{prompt}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex w-full max-w-none flex-col gap-4">
                  {messages.map((item) => {
                    const isUser = item.role === 'user';
                    const itemStarred = item.starred || starredMessageIds.includes(item.id);

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[92%] sm:max-w-[84%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
                          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${isUser ? (theme === 'dark' ? 'bg-cyan-400/15 text-cyan-200' : 'bg-slate-100 text-black') : 'bg-white/10 text-slate-200'}`}>
                              {isUser ? <User2 className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                            </span>
                            <span>{isUser ? userName : botName}</span>
                            <span className="text-slate-500">{formatTime(item.createdAt)}</span>
                          </div>

                          <div className={`rounded-[26px] border px-3 py-2 shadow-[0_14px_50px_rgba(0,0,0,0.15)] ${bubbleStyles[bubbleStyle]} ${isUser ? `border-cyan-300/25 bg-gradient-to-br ${accentStyle.gradient} text-slate-950` : theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                            <div className="space-y-2" style={{ fontSize: `${fontScale * 0.85}rem` }}>
                              {renderMessageContent(item.content, theme)}
                            </div>

                            <div className={`mt-2 flex flex-wrap items-center gap-2 text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-black'}`}>
                              <span>{item.status === 'streaming' ? 'Streaming' : item.status === 'sending' ? 'Sending' : 'Delivered'}</span>
                              <span>•</span>
                              <span>{formatShortDate(item.createdAt)}</span>
                            </div>
                          </div>

                          <div className="mt-1.5 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                            {!isUser && (
                              <>
                                <button onClick={() => copyMessage(item.content)} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] ${theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                  <Copy className="h-3 w-3" />
                                  Copy
                                </button>
                                <button onClick={() => toggleStarMessage(activeChat?._id || '', item.id)} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] ${itemStarred ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                  <Star className={`h-3 w-3 ${itemStarred ? 'fill-current' : ''}`} />
                                  Favorite
                                </button>
                                <button onClick={handleRegenerate} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] ${theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                  <RotateCcw className="h-3 w-3" />
                                  Retry
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {isSending && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className={`max-w-[84%] rounded-[26px] border px-3 py-2 ${bubbleStyles[bubbleStyle]} ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-slate-200">
                            <Bot className="h-3.5 w-3.5" />
                          </span>
                          <span>{botName}</span>
                        </div>
                        <LoadingDots />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Fixed Input Area */}
            <div className={`border-t border-white/10 px-2 py-1.5 sm:px-3 sm:py-2 ${theme === 'dark' ? 'bg-slate-950/80' : 'bg-white/70'} backdrop-blur-xl flex-shrink-0`}>
              <div className="mx-auto w-full max-w-none">
                <div className={`rounded-xl border px-2 py-1.5 shadow-[0_0_12px_rgba(15,23,42,0.06)] ${theme === 'dark' ? 'border-cyan-300/10 bg-white/4' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-2">
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          if (message.trim() && !isSending) {
                            handleSend();
                          }
                        }
                      }}
                      placeholder={`Message ${botName}...`}
                      rows={1}
                      className={`h-8 flex-1 resize-none rounded-lg border px-2 py-1.5 text-xs outline-none transition placeholder:text-slate-500 ${theme === 'dark' ? 'border-white/10 bg-slate-950/70 text-slate-100 focus:border-cyan-300/25' : 'border-slate-200 bg-white text-slate-900 focus:border-cyan-400/40'}`}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!message.trim() || isSending}
                      className={`inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${theme === 'dark' ? `bg-gradient-to-r ${accentStyle.gradient} text-slate-950 ${accentStyle.glow} hover:brightness-110` : 'bg-slate-950 text-white hover:brightness-110'}`}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              onClick={(event) => event.stopPropagation()}
              className={`h-full w-full max-w-md overflow-y-auto border-l ${theme === 'dark' ? 'border-white/10 bg-slate-950/95' : 'border-slate-200 bg-white/95'} p-4 shadow-[0_0_80px_rgba(15,23,42,0.25)]`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Settings</p>
                  <h3 className="mt-1 text-2xl font-semibold">Customize your workspace</h3>
                </div>
                <button onClick={() => setSettingsOpen(false)} className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className={`rounded-[24px] border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Chatbot name</label>
                  <input value={botName} onChange={(event) => setBotName(event.target.value)} className={`mt-3 w-full rounded-2xl border px-4 py-3 outline-none ${theme === 'dark' ? 'border-white/10 bg-slate-950/70 text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`} />
                </div>

                <div className={`rounded-[24px] border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Accent color</label>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    {(['cyan', 'violet', 'emerald'] as AccentKey[]).map((key) => (
                      <button key={key} onClick={() => setAccent(key)} className={`rounded-2xl border px-3 py-2 ${accent === key ? 'border-cyan-300/30 bg-cyan-400/10' : 'border-white/10 bg-white/5'}`}>
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`rounded-[24px] border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Bubble style</label>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <button onClick={() => setBubbleStyle('glass')} className={`rounded-2xl border px-3 py-2 ${bubbleStyle === 'glass' ? 'border-cyan-300/30 bg-cyan-400/10' : 'border-white/10 bg-white/5'}`}>Glass</button>
                    <button onClick={() => setBubbleStyle('solid')} className={`rounded-2xl border px-3 py-2 ${bubbleStyle === 'solid' ? 'border-cyan-300/30 bg-cyan-400/10' : 'border-white/10 bg-white/5'}`}>Solid</button>
                  </div>
                </div>

                <div className={`rounded-[24px] border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Font size</label>
                  <input type="range" min="0.9" max="1.1" step="0.05" value={fontScale} onChange={(event) => setFontScale(Number(event.target.value))} className="mt-4 w-full" />
                </div>

                <div className={`rounded-[24px] border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span>Theme</span>
                    <button onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                      {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                      {theme}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ChatPageContent />
    </Suspense>
  );
}

function StatusRow({ label, value, active }: { label: string; value: string; active?: boolean }) {
  const { theme } = useContext(AuthContext) as unknown as { theme: string };
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className={active ? (theme === 'dark' ? 'text-cyan-200' : 'text-black') : 'text-slate-300'}>{value}</span>
    </div>
  );
}

function ShieldIcon({ theme }: { theme: string }) {
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${theme === 'dark' ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-200 text-black'}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    </div>
  );
}

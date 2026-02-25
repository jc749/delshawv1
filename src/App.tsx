import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Users, Lightbulb, Newspaper, TrendingUp,
  MessageSquare, ChevronRight, ArrowUpRight, ArrowDownRight,
  Search, Bell, Menu, Send, Sparkles, Target, Gavel,
  Mail, Twitter, Linkedin, ExternalLink, Radio, Plus,
  RefreshCw, Star, Filter, X, ChevronDown, Eye, Check, Copy
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const ensureStr = (v: any): string => {
  if (typeof v === 'string') return v;
  if (!v) return '';
  return JSON.stringify(v);
};

// ─── Static fallback client data (used if Notion is empty) ───────────────────
const STATIC_CLIENTS: Record<string, any> = {
  "Joy Sunday": {
    name: "Joy Sunday", handle: "@joysunday", followers: "1.1M", followerChange: -1.54,
    avgLikes: "22K", likesChange: 5.68, avgReels: "348K", engagementRate: "2.0%",
    location: "New York City",
    interests: ["Television & Film", "Fashion", "Electronics", "Activewear", "Travel"],
    brandAffinity: ["Apple", "Aquazzura", "Balenciaga", "Balmain", "Cartier", "Disney", "Netflix"],
    audienceGender: "67.3% Female, 32.7% Male",
    topLocations: "United States 69.14%, Brazil 3.77%, United Kingdom 3.09%",
    audience: {
      gender: [{ name: 'Female', value: 67.3 }, { name: 'Male', value: 32.7 }],
      age: [
        { range: '13-17', followers: 4.23, likes: 9.11 },
        { range: '18-24', followers: 25.46, likes: 43.4 },
        { range: '25-34', followers: 48.63, likes: 36.72 },
        { range: '35-44', followers: 18.8, likes: 7.93 },
        { range: '45-64', followers: 2.84, likes: 2.81 },
      ],
      locations: [
        { name: 'United States', value: 69.14 }, { name: 'Brazil', value: 3.77 },
        { name: 'United Kingdom', value: 3.09 }, { name: 'France', value: 1.97 }, { name: 'Nigeria', value: 1.76 },
      ]
    },
    recentPerformance: [
      { month: 'Sep', followers: 1040, likes: 26 }, { month: 'Oct', followers: 1100, likes: 26.5 },
      { month: 'Nov', followers: 1105, likes: 21 }, { month: 'Dec', followers: 1095, likes: 20.5 },
      { month: 'Jan', followers: 1085, likes: 22 },
    ]
  },
  "Quinta Brunson": {
    name: "Quinta Brunson", handle: "@quintab", followers: "2M", followerChange: 0.64,
    avgLikes: "74K", likesChange: -23.69, avgReels: "1M", engagementRate: "3.75%",
    location: "New York City",
    interests: ["Television & Film", "Fashion", "Electronics", "Beauty", "Jewellery"],
    brandAffinity: ["Apple", "Balmain", "Carolina Herrera", "Christian Dior", "Christian Louboutin"],
    audienceGender: "77.19% Female, 22.81% Male",
    topLocations: "United States 75.35%, United Kingdom 4.09%, Canada 3.19%",
    audience: {
      gender: [{ name: 'Female', value: 77.19 }, { name: 'Male', value: 22.81 }],
      age: [
        { range: '13-17', followers: 4.86, likes: 6.7 }, { range: '18-24', followers: 35.69, likes: 33.02 },
        { range: '25-34', followers: 46.23, likes: 43.94 }, { range: '35-44', followers: 11.69, likes: 12.89 },
        { range: '45-64', followers: 1.53, likes: 3.43 },
      ],
      locations: [
        { name: 'United States', value: 75.35 }, { name: 'United Kingdom', value: 4.09 },
        { name: 'Canada', value: 3.19 }, { name: 'France', value: 0.82 }, { name: 'Australia', value: 1.81 },
      ]
    },
    recentPerformance: [
      { month: 'Sep', followers: 1935, likes: 108 }, { month: 'Oct', followers: 1955, likes: 98 },
      { month: 'Nov', followers: 1960, likes: 97 }, { month: 'Dec', followers: 1965, likes: 97 },
      { month: 'Jan', followers: 1975, likes: 74 },
    ]
  },
  "Kelly Rowland": {
    name: "Kelly Rowland", handle: "@kellyrowland", followers: "17M", followerChange: 0.01,
    avgLikes: "105K", likesChange: 13.95, avgReels: "1.3M", engagementRate: "0.63%",
    location: "New York City",
    interests: ["Television & Film", "Shopping", "Coffee & Tea", "Fashion", "Sports"],
    brandAffinity: ["Airbnb", "Balenciaga", "Givenchy", "Huggies", "Lego"],
    audienceGender: "65.7% Female, 34.3% Male",
    topLocations: "United States 46.89%, Brazil 5.74%, Nigeria 4.2%",
    audience: {
      gender: [{ name: 'Female', value: 65.7 }, { name: 'Male', value: 34.3 }],
      age: [
        { range: '13-17', followers: 3.21, likes: 3.62 }, { range: '18-24', followers: 21.47, likes: 21.67 },
        { range: '25-34', followers: 49.96, likes: 55.97 }, { range: '35-44', followers: 20.74, likes: 16.23 },
        { range: '45-64', followers: 4.62, likes: 2.52 },
      ],
      locations: [
        { name: 'United States', value: 46.89 }, { name: 'Brazil', value: 5.74 },
        { name: 'Nigeria', value: 4.2 }, { name: 'United Kingdom', value: 3.72 }, { name: 'South Africa', value: 3.9 },
      ]
    },
    recentPerformance: [
      { month: 'Sep', followers: 16740, likes: 102 }, { month: 'Oct', followers: 16760, likes: 108 },
      { month: 'Nov', followers: 16775, likes: 95 }, { month: 'Dec', followers: 16785, likes: 93 },
      { month: 'Jan', followers: 16790, likes: 105 },
    ]
  },
};

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b'];
const API_BASE = ''; // Empty = same-origin on Vercel; set to https://your-app.vercel.app for local dev

// ─── API Helpers ─────────────────────────────────────────────────────────────
async function fetchNotion<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/${endpoint}`);
  if (!res.ok) throw new Error(`API ${endpoint} failed: ${res.status}`);
  return res.json();
}

async function postApi<T>(endpoint: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${endpoint} failed: ${res.status}`);
  return res.json();
}

// ─── Shared Components ────────────────────────────────────────────────────────
const StatCard = ({ title, value, change, icon: Icon }: any) => (
  <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-indigo-50 rounded-lg"><Icon className="w-5 h-5 text-indigo-600" /></div>
      {change !== undefined && (
        <div className={cn("flex items-center text-xs font-medium px-2 py-1 rounded-full",
          change > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
          {change > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </motion.div>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
  </div>
);

const LoadingSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-xl" />
    ))}
  </div>
);

const SourceBadge = ({ source }: { source: string }) => {
  const colors: Record<string, string> = {
    'Article': 'bg-blue-50 text-blue-600 border-blue-100',
    'Podcast': 'bg-purple-50 text-purple-600 border-purple-100',
    'Client Lookalike': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Manual': 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", colors[source] || colors['Manual'])}>
      {source}
    </span>
  );
};

// ─── Chat Interface ───────────────────────────────────────────────────────────
const ChatInterface = ({ client, articles, episodes }: { client: any; articles: any[]; episodes: any[] }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: `Hi! I'm your Del Shaw AI assistant. I'm up to date on ${client.name}'s data and today's industry. How can I help you prepare?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: `Hi! I'm your Del Shaw AI assistant. I'm up to date on ${client.name}'s data and today's industry. How can I help?` }]);
  }, [client.name]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const newsContext = [
        ...articles.slice(0, 5).map(a => `[ARTICLE] ${a.title}: ${a.summary}`),
        ...episodes.slice(0, 3).map(e => `[PODCAST] ${e.podcast} - ${e.episode}: ${e.summary}`),
      ].join('\n');

      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          client,
          articles,
          episodes,
          userMessage: userMsg,
          prompt: `You are an expert talent agent assistant for Del Shaw Mackintosh & Kaiserman.

CLIENT DATA: ${client.name} | ${client.followers} followers | ${client.engagementRate} engagement | Brands: ${Array.isArray(client.brandAffinity) ? client.brandAffinity.join(', ') : client.brandAffinity}

CURRENT INDUSTRY CONTEXT FROM NOTION:
${newsContext}

USER QUESTION: ${userMsg}

Answer strategically with real context from the news above where relevant.`,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: ensureStr(data.result) || "I couldn't process that." }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-indigo-600" />
        <span className="font-semibold text-slate-800">Strategy Chat</span>

      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("max-w-[80%] rounded-2xl p-3 text-sm",
            msg.role === 'user' ? "ml-auto bg-indigo-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none")}>
            <Markdown>{ensureStr(msg.content)}</Markdown>
          </div>
        ))}
        {loading && <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm w-fit animate-pulse">Thinking...</div>}
      </div>
      <div className="p-4 border-t border-slate-100 flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about negotiation points, brand strategy..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"><Send className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

// ─── Insights Views (powered by real Notion content) ─────────────────────────
// Shared card format for Negotiation + Strategy
const InsightCard = ({ label, title, body, color = 'indigo' }: { label: string; title: string; body: string; color?: string }) => (
  <div className="group">
    <h4 className="font-semibold text-slate-800 text-sm leading-tight mb-2">{title}</h4>
    <div className={`p-3 bg-${color}-50/50 rounded-xl border border-${color}-100/50`}>
      <p className={`text-[10px] font-bold text-${color}-600 uppercase tracking-wider mb-1`}>{label}</p>
      <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
    </div>
  </div>
);

const ModuleHeader = ({ icon: Icon, title, onRefresh, loading }: { icon: any; title: string; onRefresh: () => void; loading: boolean }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-indigo-600" />
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    <button onClick={onRefresh} disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-40">
      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
    </button>
  </div>
);

const InsightsView = ({ client, articles, episodes, cache, onCache }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true); setError(false);
    try {
      const data = await postApi<{ result: any }>('analyze', { type: 'negotiation', client, articles, episodes });
      const result = Array.isArray(data.result) ? data.result : [];
      setItems(result);
      if (onCache) onCache(result);
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (cache && Array.isArray(cache) && cache.length > 0) { setItems(cache); setLoading(false); return; }
    load();
  }, [client.name]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full">
      <ModuleHeader icon={Gavel} title="Negotiation Leverage" onRefresh={load} loading={loading} />
      <div className="space-y-5">
        {loading ? <LoadingSkeleton /> : error ? (
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-600">
            Failed. <button onClick={load} className="underline font-bold">Retry</button>
          </div>
        ) : items.map((item, i) => (
          <InsightCard key={i} label="Leverage Point" title={item.title} body={item.insight} color="indigo" />
        ))}
      </div>
    </div>
  );
};

const NewsView = ({ client, articles, episodes }: any) => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true); setError(false);
    try {
      const data = await postApi<{ result: any }>('analyze', { type: 'news', client, articles, episodes });
      const result = Array.isArray(data.result) ? data.result : [];
      setNews(result);
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [client.name]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full">
      <ModuleHeader icon={Newspaper} title="Industry Pulse" onRefresh={load} loading={loading} />
      <div className="space-y-5">
        {loading ? <LoadingSkeleton /> : error ? (
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-600">
            Failed. <button onClick={load} className="underline font-bold">Retry</button>
          </div>
        ) : news.map((item, i) => (
          <div key={i} className="group">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-slate-800 text-sm leading-tight group-hover:text-indigo-600 transition-colors">{item.title}</h4>
              {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0"><ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600" /></a>}
            </div>
            <div className="mt-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Why it matters</p>
              <p className="text-xs text-slate-600 leading-relaxed">{item.why}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StrategyView = ({ client, articles, episodes }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true); setError(false);
    try {
      const data = await postApi<{ result: any }>('analyze', { type: 'strategy', client, articles, episodes });
      const result = Array.isArray(data.result) ? data.result : [];
      setItems(result);
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [client.name]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full">
      <ModuleHeader icon={TrendingUp} title="Monetization Strategy" onRefresh={load} loading={loading} />
      <div className="space-y-5">
        {loading ? <LoadingSkeleton rows={2} /> : error ? (
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-600">
            Failed. <button onClick={load} className="underline font-bold">Retry</button>
          </div>
        ) : items.map((item, i) => (
          <InsightCard key={i} label="Opportunity" title={item.title} body={item.insight} color="violet" />
        ))}
      </div>
    </div>
  );
};


// ─── Social Draft Modal ───────────────────────────────────────────────────────
const SocialDraftModal = ({ type, article, onClose }: {
  type: 'linkedin' | 'thread';
  article: { title: string; source: string; why: string };
  onClose: () => void;
}) => {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generate = async () => {
      try {
        const res = await postApi<{ result: string }>('analyze', {
          type: type === 'linkedin' ? 'social-linkedin' : 'social-thread',
          article,
        });
        setDraft(res.result || '');
      } catch {
        setDraft('Failed to generate. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLinkedin = type === 'linkedin';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              {isLinkedin
                ? <Linkedin className="w-4 h-4 text-blue-600" />
                : <Twitter className="w-4 h-4 text-sky-500" />}
              <h3 className="font-bold text-slate-900">{isLinkedin ? 'LinkedIn Post' : 'Twitter Thread'}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{article.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Drafting{isLinkedin ? ' post' : ' thread'}...</span>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-200 max-h-80 overflow-y-auto">
              {draft}
            </div>
          )}
        </div>
        {!loading && (
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={copy}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                copied ? "bg-green-600 text-white" : isLinkedin ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-sky-500 text-white hover:bg-sky-600")}>
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy to Clipboard</>}
            </button>
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Pitch Email Modal ────────────────────────────────────────────────────────
const PitchEmailModal = ({ pitch, onClose }: { pitch: { hook: string; target: string }; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);

  const subject = `Placement Opportunity: ${pitch.target}`;
  const body = `Hey team —

Saw something I want you to run with. There's a timely angle for ${pitch.target}:

${pitch.hook}

This feels like a natural fit for a quote, profile, or op-ed placement depending on how you want to approach it. Let me know what you need from me to make it happen.

— Sloan`;

  const fullEmail = `To: [PR Team]
Subject: ${subject}

${body}`;

  const copy = () => {
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Draft Email</h3>
            <p className="text-xs text-slate-500 mt-0.5">Target: {pitch.target}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-200 max-h-72 overflow-y-auto">
            {fullEmail}
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={copy}
            className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
              copied ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700")}>
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy to Clipboard</>}
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Sloan's Desk ─────────────────────────────────────────────────────────────
const SloanDesk = ({ articles, episodes, cache, onCache }: { articles: any[]; episodes: any[]; cache?: any; onCache?: (d: any) => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activePitch, setActivePitch] = useState<{ hook: string; target: string } | null>(null);
  const [socialDraft, setSocialDraft] = useState<{ type: 'linkedin' | 'thread'; article: any } | null>(null);

  const load = async () => {
    setLoading(true); setError(false);
    try {
      const res = await postApi<{ result: any }>('analyze', { type: 'sloan-desk', client: {}, articles, episodes });
      setData(res.result);
      if (onCache) onCache(res.result);
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (cache) { setData(cache); setLoading(false); return; }
    if (articles.length > 0) load();
  }, [articles.length]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Loading today's intelligence...</p>
    </div>
  );

  if (error) return (
    <div className="p-12 flex flex-col items-center justify-center">
      <div className="p-6 bg-rose-50 rounded-2xl text-center max-w-md">
        <p className="text-rose-600 font-bold mb-2">Failed to load desk</p>
        <button onClick={load} className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700">Retry</button>
      </div>
    </div>
  );

  if (!data) return <div className="p-8 text-center text-slate-400">No data yet. Make sure your Notion articles DB has content.</div>;

  return (
    <div className="space-y-12">
      <section>
        <SectionHeader title="Hollywood & Digital Pulse" subtitle="Today's most relevant stories for Sloan's book" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data.headlines || []).map((h: any, i: number) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <h4 className="font-bold text-slate-900 mb-3 leading-tight text-sm">{h.title}</h4>
              {h.source && <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold tracking-wider">{h.source}</p>}
              <div className="p-3 bg-indigo-50 rounded-xl mb-4">
                <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1 tracking-wider">Why it matters</p>
                <p className="text-xs text-slate-600 leading-relaxed">{h.why}</p>
              </div>
              <div className="space-y-2">
                {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700 transition-all">
                  <ExternalLink className="w-3 h-3" /> Read Full Article
                </a>}
                <div className="flex gap-2">
                  <button onClick={() => setSocialDraft({ type: 'linkedin', article: h })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                    <Linkedin className="w-3 h-3" /> LinkedIn Post
                  </button>
                  <button onClick={() => setSocialDraft({ type: 'thread', article: h })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-all">
                    <Twitter className="w-3 h-3" /> Thread
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Drafted LinkedIn Posts" subtitle="Thought leadership based on real current news" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(data.linkedin || []).map((post: string, i: number) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
              key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col group">
              <div className="flex-1 text-sm text-slate-600 italic mb-4 leading-relaxed">
                <Markdown>{ensureStr(post)}</Markdown>
              </div>
              <button onClick={() => copyToClipboard(ensureStr(post), i)}
                className={cn("w-full py-2 rounded-xl text-xs font-bold transition-all",
                  copiedIndex === i ? "bg-emerald-600 text-white" : "bg-slate-50 border border-slate-200 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600")}>
                {copiedIndex === i ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="PR Pitches" subtitle="Strategic hooks for media features" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(data.pitches || []).map((p: any, i: number) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + i * 0.1 }}
              key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-indigo-500">
              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider">
                Target: {p.target}
              </span>
              <p className="text-sm text-slate-700 font-medium leading-relaxed mt-3 mb-4">{p.hook}</p>
              <button onClick={() => setActivePitch(p)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">
                <Mail className="w-4 h-4" /> Draft Email to PR Team
              </button>
            </motion.div>
          ))}
        </div>
      </section>
      {activePitch && <PitchEmailModal pitch={activePitch} onClose={() => setActivePitch(null)} />}
      {socialDraft && <SocialDraftModal type={socialDraft.type} article={socialDraft.article} onClose={() => setSocialDraft(null)} />}

      {episodes.length > 0 && (
        <section>
          <SectionHeader title="Podcast Listening Queue" subtitle="Recent episodes from your Notion Podcast DB" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {episodes.slice(0, 6).map((ep: any, i: number) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 + i * 0.08 }}
                key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-50 rounded-lg"><Radio className="w-3.5 h-3.5 text-purple-600" /></div>
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{ep.podcast}</span>
                </div>
                <h4 className="font-semibold text-slate-800 text-sm mb-2 leading-tight">{ep.episode}</h4>
                {ep.summary && <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{ep.summary}</p>}
                {ep.date && <p className="text-[10px] text-slate-400 mt-2">{new Date(ep.date).toLocaleDateString()}</p>}
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ─── Talent Radar ─────────────────────────────────────────────────────────────
const AddProspectModal = ({ onAdd, onClose }: { onAdd: (p: any) => Promise<void>; onClose: () => void }) => {
  const [form, setForm] = useState({ name: '', whyFit: '', link: '', followersReach: '', upsideNotes: '', matchScore: '', platform: [] as string[] });
  const [saving, setSaving] = useState(false);
  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Film/TV', 'Music'];

  const togglePlatform = (p: string) => {
    setForm(prev => ({
      ...prev,
      platform: prev.platform.includes(p) ? prev.platform.filter(x => x !== p) : [...prev.platform, p]
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onAdd({ ...form, matchScore: form.matchScore ? parseFloat(form.matchScore) : null });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900 text-lg">Add Prospect Manually</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-900" /></button>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Name *', key: 'name', placeholder: 'Full name' },
            { label: 'Why They\'re a Fit', key: 'whyFit', placeholder: 'Why Sloan should pursue this person...' },
            { label: 'Link (Instagram/TikTok/Article)', key: 'link', placeholder: 'https://...' },
            { label: 'Followers / Reach', key: 'followersReach', placeholder: '2.4M Instagram' },
            { label: 'Upside Notes', key: 'upsideNotes', placeholder: 'What makes them interesting right now...' },
            { label: 'Match Score (1–10)', key: 'matchScore', placeholder: '8' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">{label}</label>
              <input value={(form as any)[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Platform</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map(p => (
                <button key={p} onClick={() => togglePlatform(p)}
                  className={cn("px-3 py-1 rounded-full text-xs font-bold border transition-all",
                    form.platform.includes(p) ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300")}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !form.name.trim()}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all">
            {saving ? 'Saving...' : 'Add to Radar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};


const OutreachModal = ({ prospect, onClose }: { prospect: any; onClose: () => void }) => {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generate = async () => {
      try {
        const res = await postApi<{ result: string }>('analyze', {
          type: 'talent-outreach',
          prospect,
        });
        setDraft(res.result || '');
      } catch {
        setDraft('Failed to generate. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900">Draft Outreach</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">To: {prospect.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Drafting outreach email...</span>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-200 max-h-80 overflow-y-auto">
              {draft}
            </div>
          )}
        </div>
        {!loading && (
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={copy}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                copied ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700")}>
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy to Clipboard</>}
            </button>
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const TalentRadar = ({ articles, episodes, clients, cache, onCache }: any) => {
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const [outreachProspect, setOutreachProspect] = useState<any>(null);
  const [error, setError] = useState('');

  const loadProspects = async () => {
    try {
      const data = await fetchNotion<{ prospects: any[] }>('talent-radar');
      const p = data.prospects || [];
      setProspects(p);
      if (p.length > 0 && onCache) onCache(p); // only cache if we got results
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runAI = async () => {
    setRunning(true); setError('');
    try {
      const data = await postApi<{ prospects: any[]; newCount: number }>('talent-radar', { clients });
      if (data.newCount === 0) {
        setError('No new prospects found — all extracted names already exist in your Talent Radar.');
      }
      // Always re-fetch from Notion after scan so we get the freshly saved rows
      await loadProspects();
    } catch (err: any) {
      setError('AI extraction failed: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  const addManual = async (prospect: any) => {
    await postApi('talent-radar-add', prospect);
    await loadProspects();
  };

  useEffect(() => {
    if (cache && cache.length > 0) {
      setProspects(cache);
      setLoading(false);
      return;
    }
    loadProspects(); // always fetch fresh if cache is empty
  }, []); // eslint-disable-line

  const sources = ['All', 'Article', 'Podcast', 'Client Lookalike', 'Manual'];
  const filtered = filter === 'All' ? prospects : prospects.filter(p => p.source === filter);
  const sorted = [...filtered].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  return (
    <div>
      {showAdd && <AddProspectModal onAdd={addManual} onClose={() => setShowAdd(false)} />}
      {outreachProspect && <OutreachModal prospect={outreachProspect} onClose={() => setOutreachProspect(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Talent Radar</h1>
          <p className="text-slate-500 text-sm mt-1">AI-identified matches based on your ideal client profile and current roster</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
            <Plus className="w-4 h-4" /> Add Manual
          </button>
          <button onClick={runAI} disabled={running}
            className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg",
              running ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200")}>
            <RefreshCw className={cn("w-4 h-4", running && "animate-spin")} />
            {running ? 'Scanning...' : 'Run AI Scan'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Prospects', value: prospects.length, color: 'indigo' },
          { label: 'AI Extracted', value: prospects.filter(p => p.addedBy === 'AI').length, color: 'purple' },
          { label: 'High Match (8+)', value: prospects.filter(p => (p.matchScore || 0) >= 8).length, color: 'emerald' },
          { label: 'Pending Review', value: prospects.filter(p => p.status === 'New').length, color: 'amber' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className={cn("text-2xl font-bold mt-1", `text-${color}-600`)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        {sources.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
              filter === s ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300")}>
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 flex-shrink-0">{sorted.length} prospects</span>
      </div>

      {/* Prospect Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium mb-2">No prospects yet</p>
          <p className="text-slate-400 text-sm mb-6">Run the AI scan to extract names from your Notion articles, or add prospects manually.</p>
          <button onClick={runAI} disabled={running}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
            {running ? 'Scanning...' : 'Run First AI Scan'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((prospect, i) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              key={prospect.id || i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col">

              {/* Top: avatar + source */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-bold text-sm">{prospect.name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {prospect.sourceArticle && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight mb-1 truncate">{prospect.sourceArticle}</p>
                  )}
                  {prospect.matchScore && (
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider",
                      prospect.matchScore >= 8 ? "text-emerald-500" : "text-amber-500")}>
                      Match {prospect.matchScore}/10
                    </span>
                  )}
                </div>
                <select className="text-[10px] font-bold text-slate-500 bg-transparent border-none outline-none cursor-pointer flex-shrink-0"
                  defaultValue={prospect.status || 'New'}>
                  {['New', 'Reviewed', 'Outreach Sent', 'Pass', 'Signed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Name */}
              <h3 className="font-bold text-slate-900 text-lg mb-3">{prospect.name}</h3>

              {/* Description — whyFit as clean prose */}
              {prospect.whyFit && (
                <p className="text-sm text-slate-500 leading-relaxed mb-2 flex-1">{prospect.whyFit}</p>
              )}
              {prospect.upsideNotes && (
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{prospect.upsideNotes}</p>
              )}

              {/* CTA buttons */}
              <div className="mt-auto flex flex-col gap-2">
                {prospect.link ? (
                  <a href={prospect.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all">
                    <ExternalLink className="w-4 h-4" />
                    {(prospect.platform || []).includes('YouTube') ? 'View Channel' :
                     (prospect.platform || []).includes('Film/TV') ? 'View IMDB' : 'View Profile'}
                  </a>
                ) : prospect.sourceArticle ? (
                  <button disabled className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold opacity-60">
                    Read Article
                  </button>
                ) : null}
                <button onClick={() => setOutreachProspect(prospect)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all">
                  <Mail className="w-4 h-4" /> Draft Outreach
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Client View ──────────────────────────────────────────────────────────────
const ClientView = ({ client, articles, episodes }: { client: any; articles: any[]; episodes: any[] }) => (
  <>
    {/* Hero */}
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-3xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold border-4 border-white shadow-xl">
          {client.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold text-slate-900">{client.name}</h1>
            <Sparkles className="w-6 h-6 text-indigo-500 fill-indigo-500" />
          </div>
          <p className="text-slate-500 text-lg">{client.handle} • {client.location}</p>
          <div className="flex gap-2 mt-3">
            {(Array.isArray(client.brandAffinity) ? client.brandAffinity : (client.brandAffinity || '').split(',').map((s: string) => s.trim())).slice(0, 3).map((brand: string) => (
              <span key={brand} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400">{brand}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">Export Profile</button>
        <button className="px-6 py-3 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> AI Deck Gen
        </button>
      </div>
    </div>

    {/* Stats */}
    <section className="mt-8">
      <SectionHeader title="Performance Metrics" subtitle="Social health and growth trends" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Followers" value={client.followers} change={client.followerChange} icon={Users} />
        <StatCard title="Avg. Likes" value={client.avgLikes} change={client.likesChange} icon={Sparkles} />
        <StatCard title="Reels Plays" value={client.avgReels} icon={TrendingUp} />
        <StatCard title="Engagement Rate" value={client.engagementRate} icon={Target} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <SectionHeader title="Growth Velocity" subtitle="Follower trend over 5 months" />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={client.recentPerformance}>
                <defs>
                  <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="followers" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#cf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <SectionHeader title="Audience Gender" subtitle="Distribution by gender" />
          <div className="h-[260px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={client.audience?.gender} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {(client.audience?.gender || []).map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Primary</span>
              <span className="text-lg font-bold text-slate-800">{client.audience?.gender?.[0]?.name}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Audience */}
    <section className="mt-8">
      <SectionHeader title="Audience Intelligence" subtitle="Deep dive into follower demographics" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <SectionHeader title="Age Demographics" subtitle="Followers vs Likers by age group" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={client.audience?.age}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="followers" fill="#6366f1" radius={[4, 4, 0, 0]} name="Followers %" />
                <Bar dataKey="likes" fill="#ec4899" radius={[4, 4, 0, 0]} name="Likes %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <SectionHeader title="Geographic Reach" subtitle="Top locations by follower count" />
          <div className="space-y-5 mt-4">
            {(client.audience?.locations || []).map((loc: any, i: number) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-700">{loc.name}</span>
                  <span className="text-slate-500 font-medium">{loc.value}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${loc.value}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full bg-indigo-500 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Intelligence */}
    <section className="mt-8">
      <SectionHeader title={`${client.name} Intelligence`} subtitle="AI-powered analysis using real industry content" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InsightsView client={client} articles={articles} episodes={episodes} />
        <NewsView client={client} articles={articles} episodes={episodes} />
        <StrategyView client={client} articles={articles} episodes={episodes} />
      </div>
    </section>

    {/* Chat */}
    <section className="mt-8 pb-12">
      <SectionHeader title="AI Strategy Assistant" subtitle={`Ask about ${client.name}'s data, deals, or current industry trends`} />
      <div className="max-w-4xl mx-auto">
        <ChatInterface client={client} articles={articles} episodes={episodes} />
      </div>
    </section>
  </>
);

// ─── Root App ─────────────────────────────────────────────────────────────────
type View = 'sloan' | 'radar' | string; // string = client name

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<View>('sloan');
  const [activeClient, setActiveClient] = useState('Joy Sunday');

  // Notion data state
  const [articles, setArticles] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [notionClients, setNotionClients] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dataError, setDataError] = useState('');

  // ── Cache — persists across view switches, only clears on manual refresh ──
  const [sloanCache, setSloanCache] = useState<any>(null);
  const [clientCache, setClientCache] = useState<Record<string, any>>({});
  const [radarCache, setRadarCache] = useState<any[]>([]);

  // Build merged client list (static + any from Notion)
  const clients = { ...STATIC_CLIENTS };
  notionClients.forEach(nc => {
    if (!clients[nc.name]) clients[nc.name] = { ...nc, audience: {}, recentPerformance: [] };
  });

  const client = clients[activeClient];

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [artData, podData] = await Promise.allSettled([
          fetchNotion<{ articles: any[] }>('articles'),
          fetchNotion<{ episodes: any[] }>('podcasts'),
        ]);
        if (artData.status === 'fulfilled') setArticles(artData.value.articles || []);
        if (podData.status === 'fulfilled') setEpisodes(podData.value.episodes || []);
        // Clients are optional — don't block on failure
        try {
          const cData = await fetchNotion<{ clients: any[] }>('clients');
          setNotionClients(cData.clients || []);
        } catch {}
      } catch (err) {
        setDataError('Could not connect to Notion. Check your NOTION_TOKEN and DB IDs in Vercel env vars.');
      } finally {
        setDataLoaded(true);
      }
    };
    loadAll();
  }, []);

  const navItems = [
    { id: 'sloan', label: "Sloan's Desk", icon: LayoutDashboard },
    { id: 'radar', label: 'Talent Radar', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={cn("bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50 sticky top-0 h-screen", sidebarOpen ? "w-64" : "w-20")}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Target className="text-white w-5 h-5" />
          </div>
          {sidebarOpen && <span className="font-bold text-xl tracking-tight">Del Shaw</span>}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setView(id as View)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                view === id ? "bg-indigo-50 text-indigo-600 font-semibold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}

          <div className="h-px bg-slate-100 my-3 mx-2" />
          {sidebarOpen && <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Clients</p>}

          {Object.keys(clients).map(name => (
            <button key={name} onClick={() => { setActiveClient(name); setView('client'); }}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                view === 'client' && activeClient === name ? "bg-indigo-50 text-indigo-600 font-semibold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}>
              <Users className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm truncate">{name}</span>}
            </button>
          ))}
        </nav>

        {/* Notion status */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-100">
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium",
              dataLoaded && articles.length > 0 ? "bg-emerald-50 text-emerald-700" : dataError ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500")}>
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                dataLoaded && articles.length > 0 ? "bg-emerald-500" : dataError ? "bg-rose-500" : "bg-slate-300 animate-pulse")} />
              {!dataLoaded ? "Connecting to Notion..." : dataError ? "Notion disconnected" : "Connected"}
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <Menu className="w-5 h-5" />
            </button>
            {view === 'client' && (
              <select value={activeClient} onChange={e => setActiveClient(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-8 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
                {Object.keys(clients).map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." className="bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900">Sloan Whiteside-Munteanu</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Associate</p>
              </div>
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">SW</div>
            </div>
          </div>
        </header>

        {dataError && (
          <div className="mx-8 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>Notion not connected:</strong> {dataError} — App is running with static demo data.
          </div>
        )}

        <div className="p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {view === 'sloan' && (
              <motion.div key="sloan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <SloanDesk articles={articles} episodes={episodes} cache={sloanCache} onCache={setSloanCache} />
              </motion.div>
            )}
            {view === 'radar' && (
              <motion.div key="radar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <TalentRadar articles={articles} episodes={episodes} clients={notionClients} cache={radarCache} onCache={setRadarCache} />
              </motion.div>
            )}
            {view === 'client' && client && (
              <motion.div key={activeClient} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ClientView client={client} articles={articles} episodes={episodes} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

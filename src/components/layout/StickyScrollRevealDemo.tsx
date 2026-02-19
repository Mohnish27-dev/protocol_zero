"use client";
import React from "react";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import {
  Shield,
  Sparkles,
  Zap,
  Lock,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  TrendingUp,
  Bug,
  FileSearch,
  Mail,
  BarChart3,
} from "lucide-react";

// ============================================================================
// CODE POLICE PREVIEW - Exact replica of the real dashboard
// ============================================================================
const CodePolicePreview = () => (
  <div className="h-full w-full bg-zinc-950 p-6 overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-red-500/10">
          <Shield className="w-5 h-5 text-red-400" />
        </div>
        <span className="text-base font-bold text-white">Code Police</span>
      </div>
      <button className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-lg">
        <Plus className="w-3.5 h-3.5" />
        Connect
      </button>
    </div>

    {/* Project Cards - Like real page */}
    <div className="space-y-3">
      {/* Project 1 */}
      <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-800">
            <GitBranch className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">react-dashboard</span>
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-green-500/10 text-green-400">active</span>
            </div>
            <span className="text-xs text-zinc-500">anurag3407/react-dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-zinc-400">Completed</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            <span className="text-xs text-orange-400">3 issues</span>
          </div>
          <span className="text-xs text-zinc-500 ml-auto">Today</span>
        </div>
      </div>

      {/* Project 2 */}
      <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-800">
            <GitBranch className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">api-server</span>
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-green-500/10 text-green-400">active</span>
            </div>
            <span className="text-xs text-zinc-500">anurag3407/api-server</span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-zinc-400">Critical</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-xs text-red-400">7 issues</span>
          </div>
          <span className="text-xs text-zinc-500 ml-auto">Yesterday</span>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// AUTO-FIX PREVIEW - Shows the auto-fix PR generation feature
// ============================================================================
const AutoFixPreview = () => (
  <div className="h-full w-full bg-zinc-950 p-6 overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Zap className="w-5 h-5 text-amber-400" />
        </div>
        <span className="text-base font-bold text-white">Auto-Fix Engine</span>
      </div>
      <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-green-500/10 text-green-400">Ready</span>
    </div>

    {/* Fix Items */}
    <div className="space-y-3">
      <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-2.5 mb-2.5">
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-semibold text-white">SQL Injection Vulnerability</span>
        </div>
        <div className="p-2.5 bg-black/40 rounded font-mono text-[10px] text-green-400 mb-2.5">
          <span className="text-red-400">- </span>query = `SELECT * FROM ${"{"}input{"}"}`<br />
          <span className="text-green-400">+ </span>query = db.query(&quot;SELECT * FROM ?&quot;, [input])
        </div>
        <div className="flex items-center gap-2.5">
          <button className="px-2.5 py-1.5 bg-amber-500/20 text-amber-400 text-[11px] font-medium rounded-lg flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Apply Fix
          </button>
          <span className="text-[11px] text-zinc-500">auth/login.ts:42</span>
        </div>
      </div>

      <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-2.5 mb-2.5">
          <Bug className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-semibold text-white">Unhandled Promise Rejection</span>
        </div>
        <div className="p-2.5 bg-black/40 rounded font-mono text-[10px] text-green-400 mb-2.5">
          <span className="text-red-400">- </span>await fetchData()<br />
          <span className="text-green-400">+ </span>try {"{"} await fetchData() {"}"} catch(e) {"{"}...{"}"}
        </div>
        <div className="flex items-center gap-2.5">
          <button className="px-2.5 py-1.5 bg-amber-500/20 text-amber-400 text-[11px] font-medium rounded-lg flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Apply Fix
          </button>
          <span className="text-[11px] text-zinc-500">api/users.ts:87</span>
        </div>
      </div>

      <div className="mt-3 p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-white">Create Auto-Fix PR</span>
          </div>
          <span className="text-[11px] text-amber-400">2 fixes ready</span>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// ANALYTICS PREVIEW - Shows the analytics dashboard
// ============================================================================
const AnalyticsPreview = () => (
  <div className="h-full w-full bg-zinc-950 p-6 overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
        </div>
        <span className="text-base font-bold text-white">Analytics</span>
      </div>
      <span className="text-xs text-zinc-500">Last 30 days</span>
    </div>

    {/* Stats Row */}
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-center">
        <p className="text-xl font-bold text-white">92</p>
        <p className="text-[11px] text-zinc-500">Health Score</p>
      </div>
      <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-center">
        <p className="text-xl font-bold text-green-400">↓ 45%</p>
        <p className="text-[11px] text-zinc-500">Issues Down</p>
      </div>
      <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-center">
        <p className="text-xl font-bold text-cyan-400">247</p>
        <p className="text-[11px] text-zinc-500">Reviews</p>
      </div>
    </div>

    {/* Mini Chart */}
    <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl mb-4">
      <div className="flex items-center gap-2.5 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-medium text-white">Issue Trend</span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {[40, 65, 45, 80, 55, 35, 50, 30, 25, 20, 15, 18].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-cyan-500/40 to-cyan-500/80"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>

    {/* Top Issues */}
    <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl">
      <span className="text-xs font-medium text-white">Top Categories</span>
      <div className="space-y-2 mt-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Security</span>
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-[75%] h-full bg-red-400 rounded-full" />
            </div>
            <span className="text-[11px] text-zinc-500">75%</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Performance</span>
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-[45%] h-full bg-amber-400 rounded-full" />
            </div>
            <span className="text-[11px] text-zinc-500">45%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// EMAIL REPORTS PREVIEW - Shows the email notification feature
// ============================================================================
const EmailReportsPreview = () => (
  <div className="h-full w-full bg-zinc-950 p-6 overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-violet-500/10">
          <Mail className="w-5 h-5 text-violet-400" />
        </div>
        <span className="text-base font-bold text-white">Email Reports</span>
      </div>
    </div>

    {/* Email Preview */}
    <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl mb-3">
      <div className="flex items-center gap-2.5 mb-3">
        <Shield className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-white">Code Analysis Report</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <FileSearch className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] text-zinc-400">react-dashboard • main branch</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] text-zinc-400">156 files analyzed, 3 issues found</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-800/50 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-[11px] text-zinc-300">1 critical: SQL injection in auth.ts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-[11px] text-zinc-300">2 high: Unvalidated inputs</span>
        </div>
      </div>
    </div>

    <div className="p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl">
      <div className="flex items-center gap-2.5">
        <Mail className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-medium text-white">Automated on every push</span>
      </div>
      <p className="text-[11px] text-zinc-500 mt-1.5">Detailed reports sent to your inbox with actionable fixes</p>
    </div>
  </div>
);

const content = [
  {
    title: "🛡️ Code Police — Your AI Security Guard",
    description:
      "Stop shipping bugs and vulnerabilities. Our AI agent analyzes every GitHub commit in real-time, catching security flaws before they hit production. Get detailed PR reviews with actionable fixes, automated security scanning, and performance insights delivered to your inbox.",
    content: <CodePolicePreview />,
  },
  {
    title: "⚡ Auto-Fix Engine — One-Click Fixes",
    description:
      "Don't just find bugs — fix them automatically. Code Police generates production-ready fixes for every issue found, from SQL injections to unhandled promises. Review the diff, approve with one click, and let us create a PR with all the fixes applied.",
    content: <AutoFixPreview />,
  },
  {
    title: "📊 Analytics Dashboard — Track Your Code Health",
    description:
      "Get a bird's-eye view of your codebase health with real-time analytics. Track issue trends over time, monitor security scores, and identify the most common problem categories. Data-driven insights help you prioritize what matters most.",
    content: <AnalyticsPreview />,
  },
  {
    title: "📧 Smart Email Reports — Stay Informed",
    description:
      "Never miss a critical issue. Get beautifully formatted analysis reports sent directly to your inbox after every push. Each report includes severity breakdowns, specific file locations, and suggested fixes — all without opening the dashboard.",
    content: <EmailReportsPreview />,
  },
];

export default function StickyScrollRevealDemo() {
  return (
    <section className="w-full py-20 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Section Header - Minimal */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            Your Complete Code Review Toolkit
          </h2>
          <p className="text-lg text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            An autonomous AI agent working 24/7 to review, protect, and improve your codebase.
            From security scanning to auto-fix PRs — we&apos;ve got you covered.
          </p>
        </div>

        <StickyScroll content={content} contentClassName="h-[25rem] w-[23rem]" />
      </div>
    </section>
  );
}

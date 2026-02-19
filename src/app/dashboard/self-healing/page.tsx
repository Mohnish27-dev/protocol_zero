"use client";

/**
 * ============================================================================
 * SELF-HEALING - MAIN DASHBOARD PAGE
 * ============================================================================
 * URL input form + session history list.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
    Sparkles,
    History,
    Bug,
    CheckCircle2,
    Zap,
    Loader2,
} from "lucide-react";
import { HealingForm } from "@/components/self-healing/HealingForm";
import { SessionCard } from "@/components/self-healing/SessionCard";
import type { HealingStatus } from "@/types";

interface SessionData {
    id: string;
    repoUrl: string;
    repoOwner: string;
    repoName: string;
    branchName: string;
    status: HealingStatus;
    currentAttempt: number;
    maxAttempts: number;
    bugs?: Array<{ fixed: boolean }>;
    score?: { finalScore: number; bugsFixed: number; totalBugs: number } | null;
    startedAt: string;
    completedAt?: string;
}

export default function SelfHealingPage() {
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchSessions = useCallback(async () => {
        try {
            const res = await fetch("/api/self-healing/sessions");
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        } catch (err) {
            console.error("Failed to fetch sessions:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isSignedIn) {
            fetchSessions();
        }
    }, [isSignedIn, fetchSessions]);

    const handleSubmit = async (repoUrl: string) => {
        setSubmitting(true);
        try {
            const res = await fetch("/api/self-healing/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoUrl }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to start healing");
            }

            // Navigate to the session detail page
            router.push(`/dashboard/self-healing/${data.sessionId}`);
        } catch (error) {
            setSubmitting(false);
            throw error;
        }
    };

    // Quick stats
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
        (s) => s.status === "completed"
    ).length;
    const totalBugsFixed = sessions.reduce(
        (sum, s) => sum + (s.score?.bugsFixed || s.bugs?.filter((b) => b.fixed).length || 0),
        0
    );
    const avgScore =
        sessions.filter((s) => s.score).length > 0
            ? Math.round(
                sessions
                    .filter((s) => s.score)
                    .reduce((sum, s) => sum + (s.score?.finalScore || 0), 0) /
                sessions.filter((s) => s.score).length
            )
            : 0;

    return (
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl backdrop-blur-sm border border-emerald-500/10">
                        <Sparkles className="w-7 h-7 text-emerald-400" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-300 via-zinc-100 to-cyan-300 bg-clip-text text-transparent">
                    Self-Healing Code
                </h1>
                <p className="text-zinc-500 text-sm max-w-lg mx-auto">
                    Enter a GitHub repository URL. The AI agent will clone it, find bugs,
                    run tests, write fixes, and iterate until all tests pass.
                </p>
            </div>

            {/* Form */}
            <HealingForm onSubmit={handleSubmit} isLoading={submitting} />

            {/* Quick Stats */}
            {totalSessions > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center">
                        <Zap className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                        <span className="text-2xl font-bold text-zinc-200">
                            {totalSessions}
                        </span>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">
                            Sessions
                        </p>
                    </div>
                    <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <span className="text-2xl font-bold text-zinc-200">
                            {completedSessions}
                        </span>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">
                            Completed
                        </p>
                    </div>
                    <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center">
                        <Bug className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                        <span className="text-2xl font-bold text-zinc-200">
                            {totalBugsFixed}
                        </span>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">
                            Bugs Fixed
                        </p>
                    </div>
                    <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center">
                        <Sparkles className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                        <span className="text-2xl font-bold text-zinc-200">{avgScore}</span>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">
                            Avg Score
                        </p>
                    </div>
                </div>
            )}

            {/* Session History */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-zinc-500" />
                    <h2 className="text-sm font-semibold text-zinc-300">
                        Session History
                    </h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="p-4 bg-white/5 rounded-2xl inline-block mb-3">
                            <Sparkles className="w-8 h-8 text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 text-sm">
                            No healing sessions yet. Enter a GitHub URL above to start.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {sessions.map((session) => (
                            <SessionCard key={session.id} session={session} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

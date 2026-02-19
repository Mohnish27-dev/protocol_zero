"use client";

/**
 * ============================================================================
 * SELF-HEALING - SESSION CARD COMPONENT
 * ============================================================================
 * Summary card for a healing session used in the sessions list.
 */

import Link from "next/link";
import { GitBranch, Clock, Bug, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { HealingStatus } from "@/types";

interface SessionCardProps {
    session: {
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
    };
}

export function SessionCard({ session }: SessionCardProps) {
    const bugsFixed = session.bugs?.filter((b) => b.fixed).length || session.score?.bugsFixed || 0;
    const totalBugs = session.bugs?.length || session.score?.totalBugs || 0;

    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "—";
        }
    };

    const getDuration = () => {
        if (!session.completedAt || !session.startedAt) return null;
        try {
            const start = new Date(session.startedAt).getTime();
            const end = new Date(session.completedAt).getTime();
            const diffSec = Math.round((end - start) / 1000);
            if (diffSec < 60) return `${diffSec}s`;
            return `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`;
        } catch {
            return null;
        }
    };

    const duration = getDuration();

    return (
        <Link href={`/dashboard/self-healing/${session.id}`}>
            <div className="group relative bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-5 hover:border-emerald-500/20 transition-all duration-300 cursor-pointer">
                {/* Top glow on hover */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <GitBranch className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-emerald-300 transition-colors">
                                {session.repoOwner}/{session.repoName}
                            </h3>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                {session.branchName}
                            </p>
                        </div>
                    </div>
                    <StatusBadge status={session.status} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(session.startedAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Bug className="w-3.5 h-3.5" />
                        <span>
                            {bugsFixed}/{totalBugs} fixed
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        {session.status === "completed" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : session.status === "failed" ? (
                            <XCircle className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                            <Clock className="w-3.5 h-3.5 text-yellow-400" />
                        )}
                        <span>
                            {session.status === "completed" || session.status === "failed"
                                ? `${session.currentAttempt}/${session.maxAttempts} attempts`
                                : `Attempt ${session.currentAttempt}/${session.maxAttempts}`}
                        </span>
                    </div>
                </div>

                {/* Score & Duration footer */}
                {(session.score || duration) && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                        {session.score && (
                            <div className="flex items-center gap-2">
                                <span
                                    className={`text-lg font-bold ${session.score.finalScore >= 80
                                            ? "text-emerald-400"
                                            : session.score.finalScore >= 50
                                                ? "text-yellow-400"
                                                : "text-red-400"
                                        }`}
                                >
                                    {session.score.finalScore}
                                </span>
                                <span className="text-xs text-zinc-600">/100</span>
                            </div>
                        )}
                        {duration && (
                            <span className="text-xs text-zinc-500">{duration}</span>
                        )}
                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                )}
            </div>
        </Link>
    );
}

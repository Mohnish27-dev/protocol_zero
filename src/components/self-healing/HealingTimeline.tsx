"use client";

/**
 * ============================================================================
 * SELF-HEALING - HEALING TIMELINE COMPONENT
 * ============================================================================
 * Animated vertical timeline showing each attempt's progress.
 */

import { CheckCircle2, XCircle, Loader2, GitCommitHorizontal } from "lucide-react";
import type { HealingAttempt } from "@/types";

interface HealingTimelineProps {
    attempts: HealingAttempt[];
    currentAttempt: number;
    maxAttempts: number;
    isActive: boolean;
}

export function HealingTimeline({
    attempts,
    currentAttempt,
    maxAttempts,
    isActive,
}: HealingTimelineProps) {
    return (
        <div className="space-y-0">
            {attempts.map((attempt, idx) => (
                <div key={attempt.attempt} className="relative flex gap-4">
                    {/* Connector line */}
                    {idx < attempts.length - 1 && (
                        <div className="absolute left-[17px] top-10 bottom-0 w-px bg-white/10" />
                    )}
                    {/* Active connector */}
                    {idx === attempts.length - 1 && isActive && (
                        <div className="absolute left-[17px] top-10 bottom-0 w-px bg-gradient-to-b from-emerald-500/30 to-transparent" />
                    )}

                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1 z-10">
                        {attempt.status === "passed" ? (
                            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                        ) : attempt.status === "failed" ? (
                            <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-400" />
                            </div>
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                        <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-zinc-200">
                                    Attempt {attempt.attempt}/{maxAttempts}
                                </h4>
                                <span className="text-xs text-zinc-500">
                                    {Math.round(attempt.durationMs / 1000)}s
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-zinc-500">Bugs Found:</span>
                                    <span className="ml-2 text-zinc-300">{attempt.bugsFound}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500">Bugs Fixed:</span>
                                    <span className="ml-2 text-emerald-400">{attempt.bugsFixed}</span>
                                </div>
                            </div>

                            {attempt.commitSha && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
                                    <GitCommitHorizontal className="w-3.5 h-3.5" />
                                    <code className="text-zinc-400">
                                        {attempt.commitSha.slice(0, 7)}
                                    </code>
                                    <span className="text-zinc-600 truncate max-w-[200px]">
                                        {attempt.commitMessage}
                                    </span>
                                </div>
                            )}

                            {/* Collapsible test output */}
                            {attempt.testOutput && (
                                <details className="mt-3">
                                    <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">
                                        View test output
                                    </summary>
                                    <pre className="mt-2 p-3 bg-neutral-950/60 rounded-lg text-xs text-zinc-400 overflow-x-auto max-h-40 overflow-y-auto font-mono">
                                        {attempt.testOutput.slice(0, 2000)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Active attempt indicator */}
            {isActive && currentAttempt > attempts.length && (
                <div className="relative flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                        <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                        </div>
                    </div>
                    <div className="flex-1 pb-6">
                        <div className="bg-neutral-900/50 border border-violet-500/20 rounded-xl p-4 animate-pulse">
                            <h4 className="text-sm font-semibold text-zinc-300">
                                Attempt {currentAttempt}/{maxAttempts} in progress...
                            </h4>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

/**
 * ============================================================================
 * SELF-HEALING - SCORE BREAKDOWN COMPONENT
 * ============================================================================
 * Recharts-based visualization showing score breakdown.
 */

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { Trophy, Clock, GitCommitHorizontal, Bug, Zap, Target } from "lucide-react";
import type { HealingScore } from "@/types";

interface ScoreBreakdownProps {
    score: HealingScore;
}

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
    const bugFixRate = score.totalBugs > 0
        ? Math.round((score.bugsFixed / score.totalBugs) * 100)
        : 0;

    const chartData = [
        { name: "Bugs Fixed", value: Math.round((score.bugsFixed / Math.max(score.totalBugs, 1)) * 60), max: 60, color: "#34d399" },
        { name: "Tests Pass", value: score.testsPassed ? 20 : 0, max: 20, color: "#818cf8" },
        { name: "Efficiency", value: score.attempts <= 2 ? 10 : score.attempts <= 3 ? 5 : 0, max: 10, color: "#f472b6" },
        { name: "Speed", value: score.speedBonus, max: 10, color: "#38bdf8" },
        { name: "Penalty", value: -score.commitPenalty, max: 0, color: "#f87171" },
    ].filter(d => d.value !== 0 || d.name !== "Penalty");

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    };

    return (
        <div className="space-y-6">
            {/* Score circle */}
            <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        {/* Background circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="8"
                        />
                        {/* Score arc */}
                        <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke={
                                score.finalScore >= 80
                                    ? "#34d399"
                                    : score.finalScore >= 50
                                        ? "#facc15"
                                        : "#f87171"
                            }
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${(score.finalScore / 100) * 314} 314`}
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                            className={`text-3xl font-bold ${score.finalScore >= 80
                                    ? "text-emerald-400"
                                    : score.finalScore >= 50
                                        ? "text-yellow-400"
                                        : "text-red-400"
                                }`}
                        >
                            {score.finalScore}
                        </span>
                        <span className="text-xs text-zinc-500">/100</span>
                    </div>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-neutral-900/50 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Bug className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Bugs Fixed</span>
                    </div>
                    <span className="text-lg font-bold text-zinc-200">
                        {score.bugsFixed}/{score.totalBugs}
                    </span>
                    <span className="text-xs text-zinc-500 ml-1">({bugFixRate}%)</span>
                </div>

                <div className="bg-neutral-900/50 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Target className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Tests</span>
                    </div>
                    <span className={`text-lg font-bold ${score.testsPassed ? "text-emerald-400" : "text-red-400"}`}>
                        {score.testsPassed ? "PASSED" : "FAILED"}
                    </span>
                </div>

                <div className="bg-neutral-900/50 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Attempts</span>
                    </div>
                    <span className="text-lg font-bold text-zinc-200">{score.attempts}</span>
                    <span className="text-xs text-zinc-500 ml-1">/5</span>
                </div>

                <div className="bg-neutral-900/50 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Time</span>
                    </div>
                    <span className="text-lg font-bold text-zinc-200">{formatTime(score.timeSeconds)}</span>
                    {score.speedBonus > 0 && (
                        <span className="text-xs text-emerald-400 ml-1">+{score.speedBonus}</span>
                    )}
                </div>

                <div className="bg-neutral-900/50 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <GitCommitHorizontal className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Commits</span>
                    </div>
                    <span className="text-lg font-bold text-zinc-200">{score.totalCommits}</span>
                    {score.commitPenalty > 0 && (
                        <span className="text-xs text-red-400 ml-1">-{score.commitPenalty}</span>
                    )}
                </div>

                <div className="bg-neutral-900/50 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Speed Bonus</span>
                    </div>
                    <span className={`text-lg font-bold ${score.speedBonus > 0 ? "text-emerald-400" : "text-zinc-500"}`}>
                        {score.speedBonus > 0 ? `+${score.speedBonus}` : "—"}
                    </span>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5">
                <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Score Breakdown</h4>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" domain={[-10, 60]} tick={{ fontSize: 10, fill: "#71717a" }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#a1a1aa" }} width={80} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#171717",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                fontSize: "12px",
                            }}
                            labelStyle={{ color: "#d4d4d8" }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

"use client";

/**
 * ============================================================================
 * SELF-HEALING - BUG TABLE COMPONENT
 * ============================================================================
 * Filterable/sortable table displaying detected bugs by category.
 */

import { useState } from "react";
import { CheckCircle2, XCircle, Filter } from "lucide-react";
import type { HealingBug, BugCategory } from "@/types";

interface BugTableProps {
    bugs: HealingBug[];
}

const categoryColors: Record<BugCategory, string> = {
    SYNTAX: "text-red-400 bg-red-400/10",
    LINTING: "text-yellow-400 bg-yellow-400/10",
    RUNTIME: "text-orange-400 bg-orange-400/10",
    LOGIC: "text-violet-400 bg-violet-400/10",
    IMPORT: "text-blue-400 bg-blue-400/10",
    TYPE: "text-cyan-400 bg-cyan-400/10",
    DEPENDENCY: "text-pink-400 bg-pink-400/10",
};

export function BugTable({ bugs }: BugTableProps) {
    const [filterCategory, setFilterCategory] = useState<BugCategory | "ALL">("ALL");
    const [filterFixed, setFilterFixed] = useState<"ALL" | "FIXED" | "UNFIXED">("ALL");

    const filteredBugs = bugs.filter((bug) => {
        if (filterCategory !== "ALL" && bug.category !== filterCategory) return false;
        if (filterFixed === "FIXED" && !bug.fixed) return false;
        if (filterFixed === "UNFIXED" && bug.fixed) return false;
        return true;
    });

    const categories: BugCategory[] = [
        "SYNTAX",
        "LINTING",
        "RUNTIME",
        "LOGIC",
        "IMPORT",
        "TYPE",
        "DEPENDENCY",
    ];

    const categoryCounts = categories.reduce((acc, cat) => {
        acc[cat] = bugs.filter((b) => b.category === cat).length;
        return acc;
    }, {} as Record<BugCategory, number>);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter:</span>
                </div>

                {/* Category filter */}
                <div className="flex gap-1.5 flex-wrap">
                    <button
                        onClick={() => setFilterCategory("ALL")}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${filterCategory === "ALL"
                                ? "bg-white/10 text-zinc-200"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                            }`}
                    >
                        All ({bugs.length})
                    </button>
                    {categories.map(
                        (cat) =>
                            categoryCounts[cat] > 0 && (
                                <button
                                    key={cat}
                                    onClick={() =>
                                        setFilterCategory(filterCategory === cat ? "ALL" : cat)
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${filterCategory === cat
                                            ? categoryColors[cat]
                                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                        }`}
                                >
                                    {cat} ({categoryCounts[cat]})
                                </button>
                            )
                    )}
                </div>

                {/* Status filter */}
                <div className="flex gap-1.5 ml-auto">
                    <button
                        onClick={() =>
                            setFilterFixed(filterFixed === "FIXED" ? "ALL" : "FIXED")
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${filterFixed === "FIXED"
                                ? "bg-emerald-400/10 text-emerald-400"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                            }`}
                    >
                        Fixed
                    </button>
                    <button
                        onClick={() =>
                            setFilterFixed(filterFixed === "UNFIXED" ? "ALL" : "UNFIXED")
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${filterFixed === "UNFIXED"
                                ? "bg-red-400/10 text-red-400"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                            }`}
                    >
                        Unfixed
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-white/5 bg-neutral-900/50">
                            <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                                Status
                            </th>
                            <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                                Category
                            </th>
                            <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                                File
                            </th>
                            <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                                Line
                            </th>
                            <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                                Message
                            </th>
                            <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                                Fixed At
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBugs.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="text-center py-8 text-zinc-600"
                                >
                                    {bugs.length === 0
                                        ? "No bugs detected yet"
                                        : "No bugs match the current filter"}
                                </td>
                            </tr>
                        ) : (
                            filteredBugs.map((bug) => (
                                <tr
                                    key={bug.id}
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        {bug.fixed ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-400" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${categoryColors[bug.category] || "text-zinc-400 bg-zinc-400/10"
                                                }`}
                                        >
                                            {bug.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-300 font-mono">
                                        {bug.filePath}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400 font-mono">
                                        {bug.line}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                                        {bug.message}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-500">
                                        {bug.fixedAtAttempt ? `Attempt ${bug.fixedAtAttempt}` : "—"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

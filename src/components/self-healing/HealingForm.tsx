"use client";

/**
 * ============================================================================
 * SELF-HEALING - HEALING FORM COMPONENT
 * ============================================================================
 * GitHub URL input with validation and submit button.
 */

import { useState } from "react";
import { GitBranch, Loader2, Zap } from "lucide-react";

interface HealingFormProps {
    onSubmit: (repoUrl: string) => Promise<void>;
    isLoading: boolean;
}

export function HealingForm({ onSubmit, isLoading }: HealingFormProps) {
    const [repoUrl, setRepoUrl] = useState("");
    const [error, setError] = useState<string | null>(null);

    const validateUrl = (url: string): boolean => {
        const githubPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;
        return githubPattern.test(url.trim());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!repoUrl.trim()) {
            setError("Please enter a GitHub repository URL");
            return;
        }

        if (!validateUrl(repoUrl)) {
            setError(
                "Invalid GitHub URL. Expected format: https://github.com/owner/repo"
            );
            return;
        }

        try {
            await onSubmit(repoUrl.trim());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to start healing");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
            <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-violet-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <GitBranch className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-200">
                                Enter GitHub Repository URL
                            </h3>
                            <p className="text-xs text-zinc-500">
                                The AI agent will clone, analyze, fix, and push automatically
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="url"
                                value={repoUrl}
                                onChange={(e) => {
                                    setRepoUrl(e.target.value);
                                    setError(null);
                                }}
                                placeholder="https://github.com/owner/repository"
                                className="w-full px-4 py-3 bg-neutral-950/60 border border-white/10 rounded-xl text-zinc-200 placeholder-zinc-600 
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50
                           transition-all duration-200 text-sm"
                                disabled={isLoading}
                                id="repo-url-input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !repoUrl.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 
                         text-white font-medium rounded-xl transition-all duration-200 
                         disabled:opacity-40 disabled:cursor-not-allowed
                         flex items-center gap-2 text-sm whitespace-nowrap
                         shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                            id="start-healing-btn"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    Start Healing
                                </>
                            )}
                        </button>
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-red-400 rounded-full" />
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </form>
    );
}

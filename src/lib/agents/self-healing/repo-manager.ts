/**
 * ============================================================================
 * SELF-HEALING AGENT - REPO MANAGER (FORK-BASED)
 * ============================================================================
 * Handles all Git operations using a FORK-BASED approach:
 * 
 * 1. Fork the target repo under the bot account
 * 2. Clone the FORK (bot has full write access)
 * 3. Create branch, fix bugs, commit with [AI-AGENT] prefix
 * 4. Push to the FORK
 * 5. Create cross-fork PR: bot-fork → original repo
 * 
 * This allows creating PRs on ANY public repo without 
 * needing the user to authenticate with GitHub.
 * 
 * Requires: GITHUB_BOT_TOKEN in .env (one-time developer setup)
 */

import { execSync } from "child_process";
import { existsSync, rmSync, mkdirSync } from "fs";
import path from "path";

// ============================================================================
// CONSTANTS
// ============================================================================

const SANDBOX_BASE = "/tmp/self-healing";
const TEAM_NAME = "TECH_CHAOS";
const LEADER_NAME = "ANURAG_MISHRA";
const BRANCH_SUFFIX = "AI_Fix";
const COMMIT_PREFIX = "[AI-AGENT]";

/**
 * Get the bot token from environment
 */
export function getBotToken(): string {
    const token = process.env.GITHUB_BOT_TOKEN;
    if (!token) {
        throw new Error(
            "GITHUB_BOT_TOKEN is not set. Add it to your .env file. " +
            "Create one at: GitHub → Settings → Developer settings → Personal Access Tokens"
        );
    }
    return token;
}

/**
 * Get the standard branch name per RIFT 2026 convention
 * Rules: All UPPERCASE, underscores only, ends with _AI_Fix
 */
export function getHealingBranchName(): string {
    return `${TEAM_NAME}_${LEADER_NAME}_${BRANCH_SUFFIX}`;
}

/**
 * Get the sandbox directory for a session
 */
export function getSandboxDir(sessionId: string): string {
    return path.join(SANDBOX_BASE, sessionId);
}

// ============================================================================
// FORK OPERATIONS
// ============================================================================

export interface ForkResult {
    forkOwner: string;
    forkRepo: string;
    forkUrl: string;
    success: boolean;
    error?: string;
}

/**
 * Fork a repository under the bot account.
 * If the fork already exists, GitHub returns the existing fork.
 */
export async function forkRepo(
    owner: string,
    repo: string,
): Promise<ForkResult> {
    const token = getBotToken();
    console.log(`[RepoManager] Forking ${owner}/${repo}...`);

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/forks`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ default_branch_only: false }),
            }
        );

        if (!response.ok && response.status !== 202) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `Fork failed (${response.status}): ${errorData.message || response.statusText}`
            );
        }

        const forkData = await response.json();
        const forkOwner = forkData.owner?.login || forkData.full_name?.split("/")[0];
        const forkRepoName = forkData.name || repo;

        console.log(`[RepoManager] ✅ Fork created/found: ${forkOwner}/${forkRepoName}`);

        // Wait for fork to be ready (GitHub creates forks asynchronously)
        await waitForFork(forkOwner, forkRepoName, token);

        return {
            forkOwner,
            forkRepo: forkRepoName,
            forkUrl: `https://github.com/${forkOwner}/${forkRepoName}`,
            success: true,
        };
    } catch (error) {
        const err = error as Error;
        console.error(`[RepoManager] Fork failed:`, err.message);
        return {
            forkOwner: "",
            forkRepo: "",
            forkUrl: "",
            success: false,
            error: err.message,
        };
    }
}

/**
 * Wait for a fork to become available (GitHub creates forks asynchronously)
 */
async function waitForFork(
    owner: string,
    repo: string,
    token: string,
    maxWaitMs: number = 30000
): Promise<void> {
    const startTime = Date.now();
    const interval = 2000;

    while (Date.now() - startTime < maxWaitMs) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/vnd.github.v3+json",
                    },
                }
            );
            if (response.ok) return;
        } catch {
            // Not ready yet
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
    console.warn(`[RepoManager] Fork may not be fully ready after ${maxWaitMs}ms, proceeding anyway`);
}

// ============================================================================
// GIT OPERATIONS
// ============================================================================

/**
 * Clone a repository into the sandbox.
 * Clones the FORK (bot has write access to it).
 */
export async function cloneRepo(
    repoUrl: string,
    sessionId: string,
    forkOwner?: string,
    forkRepoName?: string,
): Promise<string> {
    const sandboxDir = getSandboxDir(sessionId);

    if (!existsSync(SANDBOX_BASE)) {
        mkdirSync(SANDBOX_BASE, { recursive: true });
    }

    if (existsSync(sandboxDir)) {
        rmSync(sandboxDir, { recursive: true, force: true });
    }

    // Clone the fork if available (we have write access), otherwise clone original
    let cloneTarget: string;
    if (forkOwner && forkRepoName) {
        const token = getBotToken();
        cloneTarget = `https://${token}@github.com/${forkOwner}/${forkRepoName}.git`;
        console.log(`[RepoManager] Cloning FORK: ${forkOwner}/${forkRepoName}`);
    } else {
        cloneTarget = repoUrl;
        if (!cloneTarget.endsWith(".git")) cloneTarget += ".git";
        console.log(`[RepoManager] Cloning original: ${repoUrl}`);
    }

    try {
        execSync(`git clone --depth=50 "${cloneTarget}" "${sandboxDir}"`, {
            timeout: 120000,
            stdio: "pipe",
        });

        // Add original as "upstream" remote
        if (forkOwner && forkRepoName) {
            const { owner, repo } = parseGitHubUrl(repoUrl);
            try {
                execSync(
                    `git -C "${sandboxDir}" remote add upstream "https://github.com/${owner}/${repo}.git"`,
                    { stdio: "pipe" }
                );
            } catch {
                // upstream may already exist
            }
        }

        console.log(`[RepoManager] ✅ Clone successful`);
        return sandboxDir;
    } catch (error) {
        const err = error as Error & { stderr?: Buffer };
        const stderr = err.stderr?.toString() || err.message;
        throw new Error(`Failed to clone repository: ${stderr}`);
    }
}

/**
 * Create and checkout the healing branch
 */
export function createBranch(repoDir: string): string {
    const branchName = getHealingBranchName();
    console.log(`[RepoManager] Creating branch: ${branchName}`);

    try {
        try {
            execSync(`git -C "${repoDir}" fetch origin ${branchName}`, { stdio: "pipe" });
            execSync(`git -C "${repoDir}" checkout ${branchName}`, { stdio: "pipe" });
            console.log(`[RepoManager] Checked out existing branch: ${branchName}`);
        } catch {
            execSync(`git -C "${repoDir}" checkout -b ${branchName}`, { stdio: "pipe" });
            console.log(`[RepoManager] Created new branch: ${branchName}`);
        }
        return branchName;
    } catch (error) {
        const err = error as Error;
        throw new Error(`Failed to create branch: ${err.message}`);
    }
}

/**
 * Stage all changes, commit with [AI-AGENT] prefix
 */
export function commitChanges(repoDir: string, message: string): string | null {
    const fullMessage = `${COMMIT_PREFIX} ${message}`;
    console.log(`[RepoManager] Committing: ${fullMessage}`);

    try {
        execSync(`git -C "${repoDir}" config user.email "ai-agent@protocol-zero.dev"`, { stdio: "pipe" });
        execSync(`git -C "${repoDir}" config user.name "Protocol Zero AI Agent"`, { stdio: "pipe" });
        execSync(`git -C "${repoDir}" add -A`, { stdio: "pipe" });

        // Check if there are changes
        try {
            execSync(`git -C "${repoDir}" diff --cached --quiet`, { stdio: "pipe" });
            console.log("[RepoManager] No changes to commit");
            return null;
        } catch {
            // There ARE changes — continue
        }

        execSync(`git -C "${repoDir}" commit -m "${fullMessage.replace(/"/g, '\\"')}"`, { stdio: "pipe" });
        const sha = execSync(`git -C "${repoDir}" rev-parse HEAD`, { stdio: "pipe" }).toString().trim();
        console.log(`[RepoManager] ✅ Committed: ${sha.slice(0, 7)}`);
        return sha;
    } catch (error) {
        const err = error as Error;
        throw new Error(`Failed to commit: ${err.message}`);
    }
}

/**
 * Push the branch to origin (the fork — bot has write access)
 */
export function pushBranch(repoDir: string, branchName: string): void {
    console.log(`[RepoManager] Pushing branch: ${branchName}`);
    try {
        execSync(`git -C "${repoDir}" push -u origin ${branchName} --force`, {
            timeout: 60000,
            stdio: "pipe",
        });
        console.log(`[RepoManager] ✅ Push successful`);
    } catch (error) {
        const err = error as Error & { stderr?: Buffer };
        const stderr = err.stderr?.toString() || err.message;
        throw new Error(`Failed to push: ${stderr}`);
    }
}

/**
 * Get the HEAD commit SHA
 */
export function getLatestCommitSha(repoDir: string): string {
    return execSync(`git -C "${repoDir}" rev-parse HEAD`, { stdio: "pipe" }).toString().trim();
}

/**
 * Get the total number of commits on the healing branch
 */
export function getCommitCount(repoDir: string, branchName: string): number {
    try {
        const mainBranch = getDefaultBranch(repoDir);
        const output = execSync(
            `git -C "${repoDir}" rev-list --count ${mainBranch}..${branchName}`,
            { stdio: "pipe" }
        ).toString().trim();
        return parseInt(output, 10) || 0;
    } catch {
        return 0;
    }
}

/**
 * Get the default branch name (main/master)
 */
export function getDefaultBranch(repoDir: string): string {
    try {
        const output = execSync(
            `git -C "${repoDir}" symbolic-ref refs/remotes/origin/HEAD`,
            { stdio: "pipe" }
        ).toString().trim();
        return output.replace("refs/remotes/origin/", "");
    } catch {
        try {
            execSync(`git -C "${repoDir}" rev-parse --verify origin/main`, { stdio: "pipe" });
            return "main";
        } catch {
            return "master";
        }
    }
}

/**
 * Clean up the sandbox directory
 */
export function cleanupSandbox(sessionId: string): void {
    const sandboxDir = getSandboxDir(sessionId);
    if (existsSync(sandboxDir)) {
        console.log(`[RepoManager] Cleaning up sandbox: ${sandboxDir}`);
        rmSync(sandboxDir, { recursive: true, force: true });
    }
}

/**
 * Parse a GitHub URL to extract owner and repo name
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
    const patterns = [
        /github\.com\/([^/]+)\/([^/.]+?)(?:\.git)?$/,
        /github\.com\/([^/]+)\/([^/]+?)\/?$/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return { owner: match[1], repo: match[2] };
    }
    throw new Error(`Invalid GitHub URL: ${url}`);
}

// ============================================================================
// CROSS-FORK PR CREATION
// ============================================================================

export interface PullRequestResult {
    success: boolean;
    prNumber?: number;
    prUrl?: string;
    error?: string;
}

/**
 * Create a cross-fork Pull Request.
 * PR goes: forkOwner:branchName → originalOwner:defaultBranch
 * Works on ANY public repo.
 */
export async function createPullRequest(
    repoDir: string,
    originalOwner: string,
    originalRepo: string,
    branchName: string,
    forkOwner: string,
    bugsFixed: number,
    totalBugs: number,
    attempts: number,
    score: number,
): Promise<PullRequestResult> {
    const token = getBotToken();
    const defaultBranch = getDefaultBranch(repoDir);

    console.log(`[RepoManager] Creating cross-fork PR: ${forkOwner}:${branchName} → ${originalOwner}/${originalRepo}:${defaultBranch}`);

    const title = `[AI-AGENT] Self-Healing: Fixed ${bugsFixed}/${totalBugs} bugs (Score: ${score}/100)`;
    const body = `## 🤖 AI-AGENT Self-Healing Report

### Branch: \`${branchName}\`

| Metric | Value |
|--------|-------|
| Bugs Found | ${totalBugs} |
| Bugs Fixed | ${bugsFixed} |
| Attempts | ${attempts}/5 |
| Score | ${score}/100 |

---

### Naming Compliance
- ✅ Branch: \`${branchName}\` (UPPERCASE, underscores, ends with _AI_Fix)
- ✅ All commits prefixed with \`[AI-AGENT]\`
- ✅ No direct push to \`${defaultBranch}\`
- ✅ Fully automated — zero human intervention
- ✅ Fork-based PR (no direct repo access needed)

### How it works
1. Repository forked under bot account
2. Cloned into sandbox environment
3. Test suite auto-detected and executed
4. AI Scout agent scanned for bugs
5. AI Engineer agent wrote targeted fixes
6. Changes committed with \`[AI-AGENT]\` prefix
7. Pushed to fork, cross-fork PR created
8. Iterated up to 5 times until tests pass

---
*Generated by Protocol Zero Self-Healing Agent*`;

    try {
        // Cross-fork PR: head is "forkOwner:branchName"
        const response = await fetch(
            `https://api.github.com/repos/${originalOwner}/${originalRepo}/pulls`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    body,
                    head: `${forkOwner}:${branchName}`,
                    base: defaultBranch,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 422 && errorData.errors?.[0]?.message?.includes("pull request already exists")) {
                console.log(`[RepoManager] PR already exists for ${branchName}`);
                return { success: true, prUrl: `https://github.com/${originalOwner}/${originalRepo}/pulls` };
            }
            throw new Error(`GitHub API error ${response.status}: ${errorData.message || response.statusText}`);
        }

        const prData = await response.json();
        console.log(`[RepoManager] ✅ PR created: #${prData.number} - ${prData.html_url}`);
        return { success: true, prNumber: prData.number, prUrl: prData.html_url };
    } catch (error) {
        const err = error as Error;
        console.error(`[RepoManager] Failed to create PR:`, err.message);
        return { success: false, error: err.message };
    }
}

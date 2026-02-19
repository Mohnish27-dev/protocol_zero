/**
 * ============================================================================
 * SELF-HEALING AGENT - REPO MANAGER
 * ============================================================================
 * Handles all Git operations: clone, branch, commit, push.
 * Uses local /tmp sandboxing for MVP. Upgrade path to Docker later.
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
 * Get the standard branch name per RIFT 2026 convention
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
// GIT OPERATIONS
// ============================================================================

/**
 * Clone a repository into the sandbox
 */
export async function cloneRepo(
    repoUrl: string,
    sessionId: string,
    githubToken?: string
): Promise<string> {
    const sandboxDir = getSandboxDir(sessionId);

    // Ensure sandbox base exists
    if (!existsSync(SANDBOX_BASE)) {
        mkdirSync(SANDBOX_BASE, { recursive: true });
    }

    // Clean up any existing sandbox
    if (existsSync(sandboxDir)) {
        rmSync(sandboxDir, { recursive: true, force: true });
    }

    // Construct authenticated URL if token provided
    let cloneUrl = repoUrl;
    if (githubToken) {
        const urlObj = new URL(repoUrl);
        cloneUrl = `https://${githubToken}@${urlObj.host}${urlObj.pathname}`;
    }

    // Ensure .git extension
    if (!cloneUrl.endsWith(".git")) {
        cloneUrl += ".git";
    }

    console.log(`[RepoManager] Cloning ${repoUrl} to ${sandboxDir}`);

    try {
        execSync(`git clone --depth=50 "${cloneUrl}" "${sandboxDir}"`, {
            timeout: 120000, // 2 min timeout
            stdio: "pipe",
        });
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
        // Check if branch already exists remotely
        try {
            execSync(`git -C "${repoDir}" fetch origin ${branchName}`, {
                stdio: "pipe",
            });
            execSync(`git -C "${repoDir}" checkout ${branchName}`, {
                stdio: "pipe",
            });
            console.log(`[RepoManager] Checked out existing branch: ${branchName}`);
        } catch {
            // Branch doesn't exist, create it
            execSync(`git -C "${repoDir}" checkout -b ${branchName}`, {
                stdio: "pipe",
            });
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
export function commitChanges(
    repoDir: string,
    message: string
): string | null {
    const fullMessage = `${COMMIT_PREFIX} ${message}`;
    console.log(`[RepoManager] Committing: ${fullMessage}`);

    try {
        // Configure git user for commits
        execSync(
            `git -C "${repoDir}" config user.email "ai-agent@protocol-zero.dev"`,
            { stdio: "pipe" }
        );
        execSync(
            `git -C "${repoDir}" config user.name "Protocol Zero AI Agent"`,
            { stdio: "pipe" }
        );

        // Stage all changes
        execSync(`git -C "${repoDir}" add -A`, { stdio: "pipe" });

        // Check if there are changes to commit
        try {
            execSync(`git -C "${repoDir}" diff --cached --quiet`, { stdio: "pipe" });
            console.log("[RepoManager] No changes to commit");
            return null;
        } catch {
            // diff --quiet exits with 1 if there ARE changes — this is what we want
        }

        // Commit
        execSync(`git -C "${repoDir}" commit -m "${fullMessage.replace(/"/g, '\\"')}"`, {
            stdio: "pipe",
        });

        // Get the commit SHA
        const sha = execSync(`git -C "${repoDir}" rev-parse HEAD`, {
            stdio: "pipe",
        })
            .toString()
            .trim();

        console.log(`[RepoManager] ✅ Committed: ${sha.slice(0, 7)}`);
        return sha;
    } catch (error) {
        const err = error as Error;
        throw new Error(`Failed to commit: ${err.message}`);
    }
}

/**
 * Push the branch to remote
 */
export function pushBranch(repoDir: string, branchName: string): void {
    console.log(`[RepoManager] Pushing branch: ${branchName}`);

    try {
        execSync(
            `git -C "${repoDir}" push -u origin ${branchName} --force`,
            {
                timeout: 60000,
                stdio: "pipe",
            }
        );
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
    return execSync(`git -C "${repoDir}" rev-parse HEAD`, { stdio: "pipe" })
        .toString()
        .trim();
}

/**
 * Get the total number of commits on the healing branch
 */
export function getCommitCount(repoDir: string, branchName: string): number {
    try {
        // Count commits unique to this branch
        const mainBranch = getDefaultBranch(repoDir);
        const output = execSync(
            `git -C "${repoDir}" rev-list --count ${mainBranch}..${branchName}`,
            { stdio: "pipe" }
        )
            .toString()
            .trim();
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
        )
            .toString()
            .trim();
        return output.replace("refs/remotes/origin/", "");
    } catch {
        // Fallback: try main, then master
        try {
            execSync(`git -C "${repoDir}" rev-parse --verify origin/main`, {
                stdio: "pipe",
            });
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
export function parseGitHubUrl(url: string): {
    owner: string;
    repo: string;
} {
    // Handle various GitHub URL formats
    const patterns = [
        /github\.com\/([^/]+)\/([^/.]+?)(?:\.git)?$/,
        /github\.com\/([^/]+)\/([^/]+?)\/?$/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return { owner: match[1], repo: match[2] };
        }
    }

    throw new Error(`Invalid GitHub URL: ${url}`);
}

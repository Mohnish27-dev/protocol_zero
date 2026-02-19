/**
 * ============================================================================
 * SELF-HEALING AGENT - ORCHESTRATOR
 * ============================================================================
 * The main healing loop controller. Coordinates all agents:
 * 1. Clone repo → create branch
 * 2. Loop up to 5 times:
 *    - Run Scanner to find bugs
 *    - Run Tester to execute tests
 *    - If tests pass → break, report success
 *    - Run Engineer to write fixes
 *    - Commit with [AI-AGENT] prefix, push
 * 3. Calculate score and emit final result
 */

import {
    cloneRepo,
    createBranch,
    commitChanges,
    pushBranch,
    getCommitCount,
    cleanupSandbox,
    parseGitHubUrl,
    createPullRequest,
} from "./repo-manager";
import { runTests } from "./test-runner";
import { scanForBugs } from "./bug-scanner";
import { fixAllBugs } from "./fix-engineer";
import {
    getSessionEmitter,
    removeSessionEmitter,
    emitStatus,
    emitLog,
    emitBugFound,
    emitTestResult,
    emitFixApplied,
    emitAttemptComplete,
    emitScore,
    emitError,
} from "./progress-emitter";
import type {
    HealingBug,
    HealingAttempt,
    HealingScore,
    HealingStatus,
} from "@/types";
import { getAdminDb } from "@/lib/firebase/admin";

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ATTEMPTS = 5;
const SPEED_BONUS_THRESHOLD_SEC = 300; // 5 minutes
const MAX_COMMITS_PENALTY_THRESHOLD = 20;

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export interface OrchestratorInput {
    sessionId: string;
    repoUrl: string;
    userId: string;
    githubToken: string;
}

/**
 * Run the full self-healing loop
 * This function runs asynchronously and streams events via the progress emitter
 */
export async function runHealingLoop(input: OrchestratorInput): Promise<void> {
    const { sessionId, repoUrl, userId, githubToken } = input;
    const startTime = Date.now();

    // Initialize session emitter
    getSessionEmitter(sessionId);

    // Parse repo URL
    let repoOwner: string;
    let repoName: string;
    try {
        const parsed = parseGitHubUrl(repoUrl);
        repoOwner = parsed.owner;
        repoName = parsed.repo;
    } catch (error) {
        await updateSessionStatus(sessionId, "failed", (error as Error).message);
        emitError(sessionId, (error as Error).message);
        removeSessionEmitter(sessionId);
        return;
    }

    const allBugs: HealingBug[] = [];
    const attempts: HealingAttempt[] = [];
    let repoDir = "";
    let branchName = "";

    try {
        // ================================================================
        // PHASE 1: CLONE
        // ================================================================
        await updateSessionStatus(sessionId, "cloning");
        emitStatus(sessionId, "cloning", `Cloning ${repoOwner}/${repoName}...`);
        emitLog(sessionId, `Starting self-healing for ${repoUrl}`);

        repoDir = await cloneRepo(repoUrl, sessionId, githubToken);
        emitLog(sessionId, `✅ Repository cloned successfully`);

        // Create branch
        branchName = createBranch(repoDir);
        emitLog(sessionId, `✅ Branch created: ${branchName}`);

        // Update session with branch info
        await updateSessionField(sessionId, {
            repoOwner,
            repoName,
            branchName,
        });

        // ================================================================
        // PHASE 2: HEALING LOOP
        // ================================================================
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            const attemptStart = Date.now();
            emitLog(sessionId, `\n━━━ Attempt ${attempt}/${MAX_ATTEMPTS} ━━━`);

            await updateSessionField(sessionId, {
                currentAttempt: attempt,
            });

            // ── SCAN ──
            await updateSessionStatus(sessionId, "scanning");
            emitStatus(sessionId, "scanning", `Scanning for bugs (attempt ${attempt})...`);

            // Run tests first to get error context
            await updateSessionStatus(sessionId, "testing");
            emitStatus(sessionId, "testing", `Running tests (attempt ${attempt})...`);
            emitLog(sessionId, `Running test suite...`);

            const testResult = runTests(repoDir);

            emitTestResult(sessionId, {
                passed: testResult.passed,
                output: testResult.fullOutput.slice(0, 2000),
                errorCount: testResult.errors.length,
                attempt,
            });

            // If tests pass, we're done!
            if (testResult.passed) {
                emitLog(sessionId, `🎉 ALL TESTS PASSED on attempt ${attempt}!`);

                const attemptRecord: HealingAttempt = {
                    attempt,
                    status: "passed",
                    testOutput: testResult.fullOutput.slice(0, 5000),
                    bugsFound: 0,
                    bugsFixed: 0,
                    durationMs: Date.now() - attemptStart,
                    timestamp: new Date().toISOString(),
                };
                attempts.push(attemptRecord);

                emitAttemptComplete(sessionId, {
                    attempt,
                    status: "passed",
                    bugsFound: 0,
                    bugsFixed: 0,
                    durationMs: attemptRecord.durationMs,
                });

                // Calculate and emit score
                const score = calculateScore(
                    allBugs,
                    true,
                    attempt,
                    getCommitCount(repoDir, branchName),
                    (Date.now() - startTime) / 1000
                );

                await finalizeSession(sessionId, "completed", allBugs, attempts, score);
                emitScore(sessionId, score as unknown as Record<string, unknown>);

                // Create PR
                emitLog(sessionId, `📝 Creating Pull Request...`);
                const prResult = await createPullRequest(
                    repoDir, repoOwner, repoName, branchName, githubToken,
                    score.bugsFixed, score.totalBugs, attempt, score.finalScore
                );
                if (prResult.success) {
                    emitLog(sessionId, `✅ PR created: ${prResult.prUrl}`);
                    await updateSessionField(sessionId, { prUrl: prResult.prUrl, prNumber: prResult.prNumber });
                } else {
                    emitLog(sessionId, `⚠️ PR creation failed: ${prResult.error}`);
                }

                emitStatus(sessionId, "completed", `✅ Self-healing complete! Score: ${score.finalScore}/100`);
                return;
            }

            // Tests failed — scan for bugs
            emitLog(sessionId, `❌ Tests failed. ${testResult.errors.length} errors detected.`);

            await updateSessionStatus(sessionId, "scanning");
            emitStatus(sessionId, "scanning", `AI scanning for bugs (attempt ${attempt})...`);

            const bugs = await scanForBugs(
                repoDir,
                testResult.errors.map((e) => ({
                    filePath: e.filePath,
                    line: e.line,
                    message: e.message,
                    type: e.type,
                }))
            );

            // Track new bugs
            const newBugs: HealingBug[] = [];
            for (const bug of bugs) {
                const existing = allBugs.find(
                    (b) => b.filePath === bug.filePath && b.line === bug.line
                );
                if (!existing) {
                    allBugs.push(bug);
                    newBugs.push(bug);
                    emitBugFound(sessionId, {
                        category: bug.category,
                        filePath: bug.filePath,
                        line: bug.line,
                        message: bug.message,
                    });
                }
            }

            emitLog(
                sessionId,
                `Found ${bugs.length} bugs (${newBugs.length} new, ${allBugs.length} total)`
            );

            if (bugs.length === 0) {
                emitLog(sessionId, `⚠️ No bugs detected but tests still failing. Trying with raw error output...`);
            }

            // ── FIX ──
            await updateSessionStatus(sessionId, "fixing");
            emitStatus(sessionId, "fixing", `Engineering fixes (attempt ${attempt})...`);
            emitLog(sessionId, `🔧 AI engineer writing fixes...`);

            const unfixedBugs = bugs.filter((b) => !b.fixed);
            const fixResult = await fixAllBugs(
                repoDir,
                unfixedBugs.length > 0 ? unfixedBugs : bugs,
                testResult.fullOutput
            );

            // Emit fix events
            for (const result of fixResult.results) {
                if (result.applied) {
                    emitFixApplied(sessionId, {
                        filePath: result.filePath,
                        description: result.description,
                        bugId: result.bugId,
                    });

                    // Mark bug as fixed
                    const bug = allBugs.find((b) => b.id === result.bugId);
                    if (bug) {
                        bug.fixed = true;
                        bug.fixedAtAttempt = attempt;
                    }
                }
            }

            emitLog(
                sessionId,
                `✅ Applied ${fixResult.bugsFixed} fixes across ${fixResult.filesChanged} files`
            );

            // ── COMMIT & PUSH ──
            await updateSessionStatus(sessionId, "pushing");
            emitStatus(sessionId, "pushing", `Committing and pushing (attempt ${attempt})...`);

            const commitMessage = `Fix ${fixResult.bugsFixed} bug(s) - attempt ${attempt}/${MAX_ATTEMPTS}`;
            const commitSha = commitChanges(repoDir, commitMessage);

            if (commitSha) {
                pushBranch(repoDir, branchName);
                emitLog(sessionId, `✅ Pushed commit ${commitSha.slice(0, 7)}: [AI-AGENT] ${commitMessage}`);
            } else {
                emitLog(sessionId, `⚠️ No file changes to commit`);
            }

            // Record attempt
            const attemptRecord: HealingAttempt = {
                attempt,
                status: "failed",
                testOutput: testResult.fullOutput.slice(0, 5000),
                bugsFound: bugs.length,
                bugsFixed: fixResult.bugsFixed,
                commitSha: commitSha || undefined,
                commitMessage: commitSha ? `[AI-AGENT] ${commitMessage}` : undefined,
                durationMs: Date.now() - attemptStart,
                timestamp: new Date().toISOString(),
            };
            attempts.push(attemptRecord);

            emitAttemptComplete(sessionId, {
                attempt,
                status: "failed",
                bugsFound: bugs.length,
                bugsFixed: fixResult.bugsFixed,
                durationMs: attemptRecord.durationMs,
            });

            // Update session in Firestore
            await updateSessionField(sessionId, {
                bugs: allBugs,
                attempts,
            });
        }

        // ================================================================
        // MAX RETRIES REACHED — Run final test
        // ================================================================
        emitLog(sessionId, `\n━━━ Final Verification ━━━`);
        emitStatus(sessionId, "testing", `Running final test suite...`);

        const finalTest = runTests(repoDir);

        const totalCommits = getCommitCount(repoDir, branchName);
        const elapsedSec = (Date.now() - startTime) / 1000;
        const score = calculateScore(
            allBugs,
            finalTest.passed,
            MAX_ATTEMPTS,
            totalCommits,
            elapsedSec
        );

        if (finalTest.passed) {
            await finalizeSession(sessionId, "completed", allBugs, attempts, score);
            emitScore(sessionId, score as unknown as Record<string, unknown>);

            // Create PR
            emitLog(sessionId, `📝 Creating Pull Request...`);
            const prResult = await createPullRequest(
                repoDir, repoOwner, repoName, branchName, githubToken,
                score.bugsFixed, score.totalBugs, MAX_ATTEMPTS, score.finalScore
            );
            if (prResult.success) {
                emitLog(sessionId, `✅ PR created: ${prResult.prUrl}`);
                await updateSessionField(sessionId, { prUrl: prResult.prUrl, prNumber: prResult.prNumber });
            } else {
                emitLog(sessionId, `⚠️ PR creation failed: ${prResult.error}`);
            }

            emitStatus(sessionId, "completed", `✅ Self-healing complete after ${MAX_ATTEMPTS} attempts! Score: ${score.finalScore}/100`);
        } else {
            await finalizeSession(sessionId, "failed", allBugs, attempts, score);
            emitScore(sessionId, score as unknown as Record<string, unknown>);

            // Still create PR with partial fixes
            if (score.bugsFixed > 0) {
                emitLog(sessionId, `📝 Creating PR with partial fixes...`);
                const prResult = await createPullRequest(
                    repoDir, repoOwner, repoName, branchName, githubToken,
                    score.bugsFixed, score.totalBugs, MAX_ATTEMPTS, score.finalScore
                );
                if (prResult.success) {
                    emitLog(sessionId, `✅ PR created: ${prResult.prUrl}`);
                    await updateSessionField(sessionId, { prUrl: prResult.prUrl, prNumber: prResult.prNumber });
                } else {
                    emitLog(sessionId, `⚠️ PR creation failed: ${prResult.error}`);
                }
            }

            emitStatus(
                sessionId,
                "failed",
                `❌ Max retries reached. Fixed ${score.bugsFixed}/${score.totalBugs} bugs. Score: ${score.finalScore}/100`
            );
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Orchestrator] Fatal error:`, error);
        emitError(sessionId, errorMessage);
        emitLog(sessionId, `💀 Fatal error: ${errorMessage}`);
        await updateSessionStatus(sessionId, "failed", errorMessage);
    } finally {
        // Cleanup
        if (repoDir) {
            try {
                cleanupSandbox(sessionId);
            } catch {
                // Ignore cleanup errors
            }
        }

        // Keep emitter alive for a bit so SSE clients can get final events
        setTimeout(() => {
            removeSessionEmitter(sessionId);
        }, 10000);
    }
}

// ============================================================================
// SCORING
// ============================================================================

function calculateScore(
    bugs: HealingBug[],
    testsPassed: boolean,
    attempts: number,
    totalCommits: number,
    timeSeconds: number
): HealingScore {
    const totalBugs = bugs.length;
    const bugsFixed = bugs.filter((b) => b.fixed).length;

    // Base score: bugs fixed
    let baseScore = totalBugs > 0 ? Math.round((bugsFixed / totalBugs) * 60) : 0;

    // Tests passing bonus: +20
    if (testsPassed) {
        baseScore += 20;
    }

    // Fewer attempts bonus: +10 if finished in 1-2 attempts
    if (attempts <= 2) {
        baseScore += 10;
    } else if (attempts <= 3) {
        baseScore += 5;
    }

    // Speed bonus: +10 if under 5 minutes
    const speedBonus = timeSeconds < SPEED_BONUS_THRESHOLD_SEC ? 10 : 0;

    // Commit penalty: -1 per commit over 20
    const commitPenalty =
        totalCommits > MAX_COMMITS_PENALTY_THRESHOLD
            ? totalCommits - MAX_COMMITS_PENALTY_THRESHOLD
            : 0;

    const finalScore = Math.max(0, Math.min(100, baseScore + speedBonus - commitPenalty));

    return {
        totalBugs,
        bugsFixed,
        testsPassed,
        attempts,
        totalCommits,
        timeSeconds: Math.round(timeSeconds),
        speedBonus,
        commitPenalty,
        finalScore,
    };
}

// ============================================================================
// FIRESTORE HELPERS
// ============================================================================

async function updateSessionStatus(
    sessionId: string,
    status: HealingStatus,
    error?: string
): Promise<void> {
    try {
        const db = getAdminDb();
        if (!db) return;
        const updateData: Record<string, unknown> = {
            status,
            updatedAt: new Date(),
        };
        if (error) {
            updateData.error = error;
        }
        if (status === "completed" || status === "failed") {
            updateData.completedAt = new Date();
        }
        await db.collection("healing-sessions").doc(sessionId).update(updateData);
    } catch (err) {
        console.warn(`[Orchestrator] Failed to update session status:`, err);
    }
}

async function updateSessionField(
    sessionId: string,
    data: Record<string, unknown>
): Promise<void> {
    try {
        const db = getAdminDb();
        if (!db) return;
        await db
            .collection("healing-sessions")
            .doc(sessionId)
            .update({ ...data, updatedAt: new Date() });
    } catch (err) {
        console.warn(`[Orchestrator] Failed to update session:`, err);
    }
}

async function finalizeSession(
    sessionId: string,
    status: HealingStatus,
    bugs: HealingBug[],
    attempts: HealingAttempt[],
    score: HealingScore
): Promise<void> {
    try {
        const db = getAdminDb();
        if (!db) return;
        await db.collection("healing-sessions").doc(sessionId).update({
            status,
            bugs,
            attempts,
            score,
            completedAt: new Date(),
            updatedAt: new Date(),
        });
    } catch (err) {
        console.warn(`[Orchestrator] Failed to finalize session:`, err);
    }
}

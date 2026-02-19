import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { runHealingLoop } from "@/lib/agents/self-healing/orchestrator";
import { parseGitHubUrl, getHealingBranchName } from "@/lib/agents/self-healing/repo-manager";
import { v4 as uuidv4 } from "uuid";

/**
 * ============================================================================
 * SELF-HEALING - START ENDPOINT
 * ============================================================================
 * POST /api/self-healing/start
 *
 * Accepts a GitHub URL, creates a healing session, and kicks off
 * the healing loop in the background.
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { repoUrl } = body;

        if (!repoUrl) {
            return NextResponse.json(
                { error: "Missing required field: repoUrl" },
                { status: 400 }
            );
        }

        // Validate GitHub URL
        let repoOwner: string;
        let repoName: string;
        try {
            const parsed = parseGitHubUrl(repoUrl);
            repoOwner = parsed.owner;
            repoName = parsed.repo;
        } catch {
            return NextResponse.json(
                { error: "Invalid GitHub URL. Expected format: https://github.com/owner/repo" },
                { status: 400 }
            );
        }

        // Get GitHub token from Clerk OAuth
        let githubToken: string | null = null;

        try {
            const clerkResponse = await fetch(
                `https://api.clerk.com/v1/users/${userId}/oauth_access_tokens/oauth_github`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                    },
                }
            );

            if (clerkResponse.ok) {
                const tokens = await clerkResponse.json();
                if (tokens && tokens.length > 0 && tokens[0].token) {
                    githubToken = tokens[0].token;
                }
            }
        } catch (tokenError) {
            console.error("[Self-Healing] Error fetching Clerk token:", tokenError);
        }

        // Fallback: Check Firestore for stored token
        const db = getAdminDb();
        if (!githubToken && db) {
            const userDoc = await db.collection("users").doc(userId).get();
            const userData = userDoc.data();
            githubToken = userData?.githubAccessToken || null;
        }

        if (!githubToken) {
            return NextResponse.json(
                { error: "GitHub token not found. Please connect GitHub in settings." },
                { status: 400 }
            );
        }

        // Create session
        const sessionId = uuidv4();
        const branchName = getHealingBranchName();
        const now = new Date();

        const sessionData = {
            id: sessionId,
            userId,
            repoUrl,
            repoOwner,
            repoName,
            branchName,
            status: "queued" as const,
            currentAttempt: 0,
            maxAttempts: 5,
            bugs: [],
            attempts: [],
            score: null,
            startedAt: now,
            createdAt: now,
            updatedAt: now,
        };

        // Store in Firestore
        if (db) {
            await db.collection("healing-sessions").doc(sessionId).set(sessionData);
        }

        // Start the healing loop in the background (non-blocking)
        runHealingLoop({
            sessionId,
            repoUrl,
            userId,
            githubToken,
        }).catch((error) => {
            console.error("[Self-Healing] Background loop error:", error);
        });

        return NextResponse.json({
            success: true,
            sessionId,
            branchName,
            message: `Self-healing started for ${repoOwner}/${repoName}`,
        });
    } catch (error) {
        console.error("[Self-Healing] Start error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to start self-healing", details: errorMessage },
            { status: 500 }
        );
    }
}

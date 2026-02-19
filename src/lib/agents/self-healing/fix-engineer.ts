/**
 * ============================================================================
 * SELF-HEALING AGENT - FIX ENGINEER (Agent C: "The Engineer")
 * ============================================================================
 * Uses Gemini via LangChain to write code fixes based on error logs
 * and bug reports. Writes fixes directly to the local filesystem.
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import type { HealingBug } from "@/types";

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

function getGeminiModel(temperature: number = 0.1) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is required");
    }

    return new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash",
        temperature,
        apiKey,
        maxOutputTokens: 8192,
    });
}

// ============================================================================
// TYPES
// ============================================================================

export interface FixResult {
    filePath: string;
    bugId: string;
    description: string;
    applied: boolean;
    error?: string;
}

// ============================================================================
// AI FIX GENERATION
// ============================================================================

const ENGINEER_SYSTEM_PROMPT = `You are an expert software engineer AI agent. Your ONLY job is to fix bugs in code.

RULES:
1. You will be given a file's content WITH line numbers and a list of bugs to fix.
2. You must output the COMPLETE FIXED FILE CONTENT — the entire file, not just the changed lines.
3. Your output must be ONLY the fixed file content wrapped in a code block. NO explanations, NO comments about what you changed.
4. Make MINIMAL changes — only fix the reported bugs, do not refactor or improve anything else.
5. Ensure your fix does not introduce new bugs.
6. Preserve ALL existing formatting, indentation, and style.
7. If a bug cannot be fixed without more context, make your best guess at a safe fix.

COMMON FIX PATTERNS:
- SYNTAX: Fix missing brackets, parentheses, quotes, semicolons
- IMPORT: Add missing imports, fix import paths
- TYPE: Add type annotations, fix type mismatches
- RUNTIME: Add null checks, fix undefined access
- LOGIC: Fix conditions, comparisons, off-by-one errors
- LINTING: Remove unused variables, add missing semicolons
- DEPENDENCY: Fix package references, update imports

OUTPUT FORMAT:
\`\`\`<language>
<complete fixed file content>
\`\`\``;

/**
 * Generate and apply fixes for bugs in a specific file
 */
export async function fixBugsInFile(
    repoDir: string,
    filePath: string,
    bugs: HealingBug[],
    testOutput?: string,
    onProgress?: {
        onFixApplied?: (result: FixResult) => void;
        onLog?: (message: string) => void;
    }
): Promise<FixResult[]> {
    const fullPath = path.join(repoDir, filePath);
    const results: FixResult[] = [];

    if (!existsSync(fullPath)) {
        console.warn(`[FixEngineer] File not found: ${fullPath}`);
        return bugs.map((bug) => ({
            filePath,
            bugId: bug.id,
            description: "File not found",
            applied: false,
            error: "File not found",
        }));
    }

    const originalContent = readFileSync(fullPath, "utf-8");
    const language = path.extname(filePath).slice(1);

    // Number lines for AI context
    const numberedContent = originalContent
        .split("\n")
        .map((line, i) => `${i + 1}: ${line}`)
        .join("\n");

    // Build bug descriptions
    const bugDescriptions = bugs
        .map(
            (bug) =>
                `- [${bug.category}] Line ${bug.line}: ${bug.message} (severity: ${bug.severity})`
        )
        .join("\n");

    // Build prompt
    let prompt = `Fix the following bugs in this file:\n\n`;
    prompt += `**File:** ${filePath}\n\n`;
    prompt += `**Bugs to fix:**\n${bugDescriptions}\n\n`;

    if (testOutput) {
        prompt += `**Test error output (for context):**\n\`\`\`\n${testOutput.slice(0, 3000)}\n\`\`\`\n\n`;
    }

    prompt += `**Current file content:**\n\`\`\`${language}\n${numberedContent}\n\`\`\`\n\n`;
    prompt += `Output the COMPLETE fixed file content in a code block. Do NOT include line numbers in your output.`;

    const model = getGeminiModel(0.1);

    try {
        console.log(`[FixEngineer] Generating fixes for ${filePath} (${bugs.length} bugs)`);
        onProgress?.onLog?.(`🔧 Generating fixes for ${filePath} (${bugs.length} bugs)...`);

        const response = await model.invoke([
            new SystemMessage(ENGINEER_SYSTEM_PROMPT),
            new HumanMessage(prompt),
        ]);

        const content = typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);

        // Extract the code block from the response
        const codeBlockMatch = content.match(/```[\w]*\n([\s\S]*?)```/);
        if (!codeBlockMatch) {
            console.warn(`[FixEngineer] No code block found in response for ${filePath}`);
            return bugs.map((bug) => ({
                filePath,
                bugId: bug.id,
                description: "AI did not return a code block",
                applied: false,
                error: "No code block in AI response",
            }));
        }

        const fixedContent = codeBlockMatch[1];

        // Validate the fix is different from original
        if (fixedContent.trim() === originalContent.trim()) {
            console.warn(`[FixEngineer] AI returned identical content for ${filePath}`);
            return bugs.map((bug) => ({
                filePath,
                bugId: bug.id,
                description: "No changes applied",
                applied: false,
                error: "Fixed content identical to original",
            }));
        }

        // Write the fixed content
        writeFileSync(fullPath, fixedContent, "utf-8");
        console.log(`[FixEngineer] ✅ Applied fixes to ${filePath}`);

        // Mark all bugs in this file as fixed
        const results = bugs.map((bug) => ({
            filePath,
            bugId: bug.id,
            description: `Fixed ${bug.category} error at line ${bug.line}`,
            applied: true,
        }));
        for (const result of results) {
            onProgress?.onFixApplied?.(result);
            onProgress?.onLog?.(`✨ Fixed: ${filePath} - ${result.description}`);
        }
        return results;
    } catch (error) {
        const err = error as Error;
        console.error(`[FixEngineer] Failed to fix ${filePath}:`, err.message);
        return bugs.map((bug) => ({
            filePath,
            bugId: bug.id,
            description: `AI fix failed: ${err.message}`,
            applied: false,
            error: err.message,
        }));
    }
}

/**
 * Fix all bugs across all files
 */
export async function fixAllBugs(
    repoDir: string,
    bugs: HealingBug[],
    testOutput?: string,
    onProgress?: {
        onFixApplied?: (result: FixResult) => void;
        onLog?: (message: string) => void;
    }
): Promise<{
    results: FixResult[];
    filesChanged: number;
    bugsFixed: number;
}> {
    // Group bugs by file
    const bugsByFile = new Map<string, HealingBug[]>();
    for (const bug of bugs) {
        const existing = bugsByFile.get(bug.filePath) || [];
        existing.push(bug);
        bugsByFile.set(bug.filePath, existing);
    }

    console.log(
        `[FixEngineer] Fixing ${bugs.length} bugs across ${bugsByFile.size} files`
    );

    const allResults: FixResult[] = [];
    let filesChanged = 0;
    let bugsFixed = 0;

    // Process files sequentially to avoid rate limits
    for (const [filePath, fileBugs] of bugsByFile.entries()) {
        const results = await fixBugsInFile(repoDir, filePath, fileBugs, testOutput, onProgress);
        allResults.push(...results);

        const applied = results.filter((r) => r.applied);
        if (applied.length > 0) {
            filesChanged++;
            bugsFixed += applied.length;
        }

        // Small delay between files to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(
        `[FixEngineer] ✅ Fixed ${bugsFixed}/${bugs.length} bugs in ${filesChanged} files`
    );

    return { results: allResults, filesChanged, bugsFixed };
}

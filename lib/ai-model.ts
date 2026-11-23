/**
 * Single place for the Claude model used by every AI feature.
 * Override with the CLAUDE_MODEL env var in Vercel to switch models without a code change.
 * Check https://platform.claude.com/docs/en/about-claude/model-deprecations before retirement dates.
 */
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6"

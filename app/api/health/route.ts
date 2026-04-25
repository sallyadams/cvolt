import { NextResponse } from "next/server";

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "unknown",
    checks: {
      database: false,
      anthropic: false,
      stripe: false,
      nextauth: false,
    },
  };

  // Check database connection
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = true;
  } catch (error) {
    health.checks.database = false;
    console.error("Database health check failed:", error);
  }

  // Check Anthropic API key
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 10) {
    health.checks.anthropic = true;
  }

  // Check Stripe configuration
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
    health.checks.stripe = true;
  }

  // Check NextAuth configuration
  if (process.env.NEXTAUTH_SECRET) {
    health.checks.nextauth = true;
  }

  // Determine overall status
  const allChecksPass = Object.values(health.checks).every(Boolean);
  health.status = allChecksPass ? "ok" : "warning";

  return NextResponse.json(health, {
    status: allChecksPass ? 200 : 200, // Still return 200 for health checks
  });
}
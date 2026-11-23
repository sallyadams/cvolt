import { NextRequest, NextResponse } from "next/server"

/**
 * Small in-memory sliding-window rate limiter.
 * Each Vercel instance keeps its own counters, so this slows down abuse (password guessing,
 * fake sign-ups, AI spam) but is not a hard global guarantee. For a strict limit across
 * all instances, move the store to Upstash Redis or the database.
 */
const buckets = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k)
  }
  return true
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown"
}

/** Returns a 429 response when the caller is over the limit, otherwise null. */
export function limitRequest(req: NextRequest, name: string, limit: number, windowMs: number): NextResponse | null {
  if (rateLimit(`${name}:${clientIp(req.headers)}`, limit, windowMs)) return null
  return NextResponse.json(
    { error: "Trop de tentatives. Réessayez dans quelques minutes. / Too many attempts, please try again later." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) } }
  )
}

import { NextRequest, NextResponse } from "next/server"
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

function extractText(html: string): string {
  return html
    // Drop entire sections that never contain job content
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    // Block-level tags → newline so paragraphs stay readable
    .replace(/<\/(p|div|li|h[1-6]|section|article|br)>/gi, "\n")
    // Strip remaining tags
    .replace(/<[^>]+>/g, " ")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    // Collapse blank lines and excess spaces
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    // Cap at 8 000 chars — enough for any job description
    .slice(0, 8000)
}

/** True for loopback, private, link-local and other non-public addresses. */
function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase()
    if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7))
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")
  }
  const [a, b] = ip.split(".").map(Number)
  return (
    a === 10 || a === 127 || a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  )
}

async function assertPublicHost(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("blocked protocol")
  const host = url.hostname.replace(/^\[|\]$/g, "")
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("blocked host")
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true })
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) throw new Error("blocked host")
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { url } = body as { url?: string }

  if (!url?.trim()) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  // Validate: must be a well-formed http/https URL
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "Only http and https URLs are supported" },
      { status: 400 }
    )
  }

  try {
    // Follow at most 3 redirects ourselves, checking every hop is a public address.
    let target = parsed
    let res: Response | null = null
    for (let hop = 0; hop < 4; hop++) {
      try {
        await assertPublicHost(target)
      } catch {
        return NextResponse.json({ error: "This address cannot be imported" }, { status: 400 })
      }
      res = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
        signal: AbortSignal.timeout(10_000),
        redirect: "manual",
      })
      const loc = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null
      if (!loc) break
      target = new URL(loc, target)
      res = null
    }
    if (!res) {
      return NextResponse.json({ error: "Too many redirects" }, { status: 422 })
    }

    if (!res.ok) {
      console.warn(`[import-url] ${target.hostname} returned ${res.status}`)
      return NextResponse.json(
        { error: "Could not fetch that page" },
        { status: 422 }
      )
    }

    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("html")) {
      return NextResponse.json(
        { error: "URL does not point to an HTML page" },
        { status: 422 }
      )
    }

    const html = await res.text()
    const text = extractText(html)

    if (text.length < 100) {
      return NextResponse.json(
        { error: "No readable content found at that URL" },
        { status: 422 }
      )
    }

    return NextResponse.json({ text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[import-url] fetch error:", msg)
    return NextResponse.json(
      { error: "Failed to reach the job page" },
      { status: 422 }
    )
  }
}

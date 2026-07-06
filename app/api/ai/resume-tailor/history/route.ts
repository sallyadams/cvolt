import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const docs = await prisma.generatedDocument.findMany({
    where: { userId, type: "tailored_cv" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, content: true, createdAt: true },
  })

  const history = docs.map((doc) => {
    let parsed: Record<string, unknown> = {}
    try {
      parsed = JSON.parse(doc.content)
    } catch {}
    return {
      id: doc.id,
      createdAt: doc.createdAt,
      jobTitle: parsed.jobTitle ?? "Target Role",
      companyName: parsed.companyName ?? "—",
      cvTitle: parsed.cvTitle ?? "",
      ats_score_before: parsed.ats_score_before ?? 0,
      ats_score_after: parsed.ats_score_after ?? 0,
      // Include full result so client can restore view without an extra fetch
      result: parsed,
    }
  })

  return NextResponse.json(history)
}

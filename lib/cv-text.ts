/**
 * PDF-uploaded CVs store a placeholder (`[PDF: filename]`) in `rawText` since
 * the raw PDF bytes aren't parsed to plain text at upload time. Routes that
 * read CV content must fall back to reconstructing text from `parsedJson`.
 */
export function cvTextFromParsed(parsedJson: string): string {
  try {
    const p = JSON.parse(parsedJson)
    const lines: string[] = []
    if (p.personal?.name) lines.push(p.personal.name)
    if (p.personal?.email) lines.push(p.personal.email)
    if (p.personal?.phone) lines.push(p.personal.phone)
    if (p.personal?.location) lines.push(p.personal.location)
    if (p.summary) lines.push("\nSUMMARY\n" + p.summary)
    if (p.experience?.length) {
      lines.push("\nEXPERIENCE")
      for (const exp of p.experience) {
        lines.push(`${exp.title ?? ""} at ${exp.company ?? ""} (${exp.dates ?? exp.period ?? ""})`)
        if (exp.bullets?.length) lines.push(...exp.bullets.map((b: string) => `• ${b}`))
      }
    }
    if (p.education?.length) {
      lines.push("\nEDUCATION")
      for (const edu of p.education) {
        lines.push(`${edu.degree ?? ""} — ${edu.institution ?? ""} (${edu.dates ?? ""})`)
      }
    }
    if (p.skills) {
      const skills = [
        ...(Array.isArray(p.skills) ? p.skills : []),
        ...(p.skills.technical ?? []),
        ...(p.skills.soft ?? []),
        ...(p.skills.tools ?? []),
        ...(p.skills.languages ?? []),
      ]
      if (skills.length) lines.push("\nSKILLS\n" + skills.join(", "))
    }
    if (p.certifications?.length) {
      lines.push("\nCERTIFICATIONS\n" + p.certifications.join(", "))
    }
    return lines.filter(Boolean).join("\n").trim()
  } catch {
    return ""
  }
}

/** Resolves usable CV text, falling back to `parsedJson` if `rawText` is a PDF-upload placeholder. */
export function resolveCvText(cv: { rawText?: string | null; parsedJson?: string | null }): string {
  let cvText = cv.rawText ?? ""
  if (!cvText || cvText.startsWith("[PDF:")) {
    cvText = cvTextFromParsed(cv.parsedJson ?? "")
  }
  return cvText
}

export type EvidenceType = "experience" | "education" | "skill" | "certification"

export type EvidenceCatalog = Record<EvidenceType, string[]>

/**
 * Flattens a CV's parsedJson into per-type, index-addressable lists of human-readable
 * labels. Used to (a) tell the AI exactly which real CV facts it's allowed to cite,
 * and (b) resolve/validate its citations server-side afterward — the label shown to
 * the user always comes from this catalog, never from AI-generated text, so a
 * citation can't misrepresent what's actually on the CV.
 */
export function buildEvidenceCatalog(parsedJson: string): EvidenceCatalog {
  const catalog: EvidenceCatalog = { experience: [], education: [], skill: [], certification: [] }
  try {
    const p = JSON.parse(parsedJson)
    if (p.experience?.length) {
      catalog.experience = p.experience.map(
        (exp: any) => `${exp.title ?? "Role"} at ${exp.company ?? "Unknown"} (${exp.dates ?? exp.period ?? ""})`
      )
    }
    if (p.education?.length) {
      catalog.education = p.education.map(
        (edu: any) => `${edu.degree ?? "Degree"} — ${edu.institution ?? ""} (${edu.dates ?? ""})`
      )
    }
    if (p.skills) {
      catalog.skill = [
        ...(Array.isArray(p.skills) ? p.skills : []),
        ...(p.skills.technical ?? []),
        ...(p.skills.soft ?? []),
        ...(p.skills.tools ?? []),
        ...(p.skills.languages ?? []),
      ]
    }
    if (p.certifications?.length) {
      catalog.certification = p.certifications
    }
  } catch {
    // malformed parsedJson — return the empty catalog, callers treat citations as unresolvable
  }
  return catalog
}

/** Renders an evidence catalog as a numbered reference list for an AI prompt. */
export function formatEvidenceCatalog(catalog: EvidenceCatalog): string {
  const sections: string[] = []
  for (const type of ["experience", "education", "skill", "certification"] as EvidenceType[]) {
    const items = catalog[type]
    if (!items.length) continue
    sections.push(
      `${type.toUpperCase()}:\n` + items.map((label, i) => `[${i}] ${label}`).join("\n")
    )
  }
  return sections.join("\n\n")
}

/** Looks up the real label for a cited (type, index) pair, or null if it doesn't exist in the catalog. */
export function resolveEvidenceLabel(
  catalog: EvidenceCatalog,
  type: string | undefined,
  index: number | undefined
): string | null {
  if (!type || typeof index !== "number") return null
  const items = catalog[type as EvidenceType]
  if (!items) return null
  return items[index] ?? null
}

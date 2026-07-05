"use client"

import { useState, ReactNode } from "react"

// ── CopyButton ─────────────────────────────────────────────────────────────────

interface CopyButtonProps {
  text: string
  size?: "sm" | "md"
  label?: string
}

export function CopyButton({ text, size = "sm", label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const sizeClass = size === "md"
    ? "text-sm px-4 py-2"
    : "text-xs px-3 py-1.5"

  return (
    <button
      onClick={handleCopy}
      className={`${sizeClass} rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
        copied
          ? "bg-green-100 text-green-700 border border-green-200"
          : "bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200"
      }`}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────────

type BadgeColor = "indigo" | "green" | "red" | "yellow" | "gray" | "blue" | "orange"

const BADGE_STYLES: Record<BadgeColor, string> = {
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  green:  "bg-green-100 text-green-700 border-green-200",
  red:    "bg-red-100 text-red-700 border-red-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  gray:   "bg-gray-100 text-gray-600 border-gray-200",
  blue:   "bg-blue-100 text-blue-700 border-blue-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
}

interface BadgeProps {
  label: string
  color?: BadgeColor
}

export function Badge({ label, color = "gray" }: BadgeProps) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${BADGE_STYLES[color]}`}>
      {label}
    </span>
  )
}

// ── ResultCard ─────────────────────────────────────────────────────────────────

interface ResultCardProps {
  title: string
  icon?: string
  badge?: string
  badgeColor?: BadgeColor
  copyText?: string
  copyLabel?: string
  headerRight?: ReactNode
  children: ReactNode
  className?: string
  /** Subtle background tint for the card body */
  tint?: "none" | "indigo" | "green" | "red" | "yellow" | "blue" | "amber"
}

const TINT_STYLES: Record<string, string> = {
  none:   "bg-white",
  indigo: "bg-indigo-50/40",
  green:  "bg-green-50/40",
  red:    "bg-red-50/40",
  yellow: "bg-yellow-50/40",
  blue:   "bg-blue-50/40",
  amber:  "bg-amber-50/40",
}

export function ResultCard({
  title,
  icon,
  badge,
  badgeColor = "gray",
  copyText,
  copyLabel,
  headerRight,
  children,
  className = "",
  tint = "none",
}: ResultCardProps) {
  return (
    <div className={`${TINT_STYLES[tint]} border border-gray-200 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <span className="text-lg shrink-0">{icon}</span>}
          <h3 className="font-semibold text-gray-900 text-sm truncate">{title}</h3>
          {badge && <Badge label={badge} color={badgeColor} />}
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          {headerRight}
          {copyText && <CopyButton text={copyText} label={copyLabel} />}
        </div>
      </div>
      {/* Body */}
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

// ── EmptyState ─────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
}

export function EmptyState({ icon = "✦", title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl mb-4">
        {icon}
      </div>
      <p className="font-semibold text-gray-700 mb-1">{title}</p>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
    </div>
  )
}

// ── LoadingState ───────────────────────────────────────────────────────────────

interface LoadingStateProps {
  message?: string
  subMessage?: string
}

export function LoadingState({
  message = "Generating your result…",
  subMessage = "This takes about 10–15 seconds",
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative w-14 h-14 mb-5">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
      <p className="font-semibold text-gray-700 mb-1">{message}</p>
      <p className="text-sm text-gray-400">{subMessage}</p>
    </div>
  )
}

// ── SectionLabel ───────────────────────────────────────────────────────────────

interface SectionLabelProps {
  color?: BadgeColor
  children: ReactNode
}

const LABEL_STYLES: Record<BadgeColor, string> = {
  indigo: "text-indigo-700",
  green:  "text-green-700",
  red:    "text-red-700",
  yellow: "text-yellow-700",
  gray:   "text-gray-600",
  blue:   "text-blue-700",
  orange: "text-orange-700",
}

export function SectionLabel({ color = "gray", children }: SectionLabelProps) {
  return (
    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${LABEL_STYLES[color]}`}>
      {children}
    </p>
  )
}

// ── Pill ───────────────────────────────────────────────────────────────────────

interface PillProps {
  label: string
  color?: BadgeColor
}

export function Pill({ label, color = "gray" }: PillProps) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${BADGE_STYLES[color]}`}>
      {label}
    </span>
  )
}

// ── TextBlock ──────────────────────────────────────────────────────────────────

interface TextBlockProps {
  text: string
  tint?: "none" | "indigo" | "green" | "blue" | "amber" | "red"
}

const TEXTBLOCK_TINTS: Record<string, string> = {
  none:   "bg-gray-50",
  indigo: "bg-indigo-50",
  green:  "bg-green-50",
  blue:   "bg-blue-50",
  amber:  "bg-amber-50",
  red:    "bg-red-50",
}

export function TextBlock({ text, tint = "none" }: TextBlockProps) {
  return (
    <div className={`${TEXTBLOCK_TINTS[tint]} rounded-xl px-4 py-3`}>
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  )
}

// ── BulletList ─────────────────────────────────────────────────────────────────

interface BulletListProps {
  items: string[]
  icon?: string
  iconColor?: string
}

export function BulletList({ items, icon = "→", iconColor = "text-indigo-400" }: BulletListProps) {
  if (!items.length) return null
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
          <span className={`${iconColor} mt-0.5 shrink-0 font-bold`}>{icon}</span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}

// ── ProgressBar ────────────────────────────────────────────────────────────────

interface ProgressBarProps {
  label: string
  value: number
  max?: number
}

export function ProgressBar({ label, value, max = 100 }: ProgressBarProps) {
  const pct = Math.round((value / max) * 100)
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500"
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-700 font-medium capitalize">{label}</span>
        <span className={`font-semibold text-xs ${pct >= 70 ? "text-green-600" : pct >= 40 ? "text-yellow-600" : "text-red-600"}`}>
          {value}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── BeforeAfter ────────────────────────────────────────────────────────────────

interface BeforeAfterProps {
  before: string
  after: string
  copyAfter?: boolean
}

export function BeforeAfter({ before, after, copyAfter = true }: BeforeAfterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Before</p>
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line line-through decoration-red-300">
            {before}
          </p>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-green-600">After</p>
          {copyAfter && <CopyButton text={after} />}
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line font-medium">
            {after}
          </p>
        </div>
      </div>
    </div>
  )
}

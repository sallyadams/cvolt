"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

const purple = "#7c5cfc"
const navy = "#0a0e27"
const gray900 = "#0f172a"
const gray600 = "#64748b"
const white = "#ffffff"

interface ConversationSummary {
  id: string
  title: string | null
  updatedAt: string
}

interface Message {
  id?: string
  role: "user" | "assistant"
  content: string
}

export default function CoachPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loadingConv, setLoadingConv] = useState(false)
  const [sending, setSending] = useState(false)
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadConversations = () => {
    fetch("/api/ai/coach/conversations")
      .then((res) => res.json())
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load conversations:", err))
  }

  useEffect(loadConversations, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const openConversation = (id: string) => {
    setActiveId(id)
    setLoadingConv(true)
    setUpgradeRequired(false)
    setError(null)
    fetch(`/api/ai/coach/conversations/${id}`)
      .then((res) => res.json())
      .then((data) => setMessages(Array.isArray(data.messages) ? data.messages : []))
      .catch((err) => console.error("Failed to load conversation:", err))
      .finally(() => setLoadingConv(false))
  }

  const newConversation = async () => {
    setError(null)
    setUpgradeRequired(false)
    const res = await fetch("/api/ai/coach/conversations", { method: "POST" })
    const conv = await res.json()
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
    setMessages([])
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return

    let conversationId = activeId
    if (!conversationId) {
      const res = await fetch("/api/ai/coach/conversations", { method: "POST" })
      const conv = await res.json()
      conversationId = conv.id
      setConversations((prev) => [conv, ...prev])
      setActiveId(conv.id)
    }

    const userText = input.trim()
    setInput("")
    setError(null)
    setUpgradeRequired(false)
    setMessages((prev) => [...prev, { role: "user", content: userText }])
    setSending(true)

    try {
      const res = await fetch(`/api/ai/coach/conversations/${conversationId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userText }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 402) {
        setUpgradeRequired(true)
        setMessages((prev) => prev.slice(0, -1))
        return
      }
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
      loadConversations()
    } catch {
      setError("Network error. Please try again.")
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8f9fe" }}>
      {/* Thread list */}
      <div style={{ width: 280, flexShrink: 0, background: white, borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 16px 12px" }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: gray900, margin: "0 0 4px" }}>🧠 Career Coach</h1>
          <p style={{ fontSize: 12, color: gray600, margin: "0 0 12px" }}>Ask anything about your job search.</p>
          <button
            onClick={newConversation}
            style={{ width: "100%", background: purple, color: white, border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            + New conversation
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              style={{
                display: "block", width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                padding: "12px", borderRadius: 10, marginBottom: 4,
                background: activeId === c.id ? "#ede9fe" : "transparent",
                fontSize: 13, fontWeight: activeId === c.id ? 700 : 500,
                color: gray900,
              }}
            >
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.title || "New conversation"}
              </div>
              <div style={{ fontSize: 11, color: gray600, marginTop: 2 }}>
                {new Date(c.updatedAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 24px" }}>
          {!activeId && messages.length === 0 ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: gray600, fontSize: 14, textAlign: "center" }}>
              Ask your Career Coach about your CV, ATS scores, interview readiness, or job applications.
            </div>
          ) : loadingConv ? (
            <div style={{ color: gray600, fontSize: 14 }}>Loading…</div>
          ) : (
            <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
              {messages.map((m, i) => (
                <div key={m.id || i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "80%", padding: "12px 16px", borderRadius: 14, fontSize: 14, lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    background: m.role === "user" ? purple : white,
                    color: m.role === "user" ? white : gray900,
                    boxShadow: m.role === "user" ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ padding: "12px 16px", borderRadius: 14, background: white, color: gray600, fontSize: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid #f0f0f0", background: white, padding: "16px 24px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            {upgradeRequired && (
              <div style={{ background: "#fef3c7", color: "#92400e", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 10 }}>
                You've reached your Career Coach message limit for this plan.{" "}
                <Link href="/upgrade" style={{ fontWeight: 700, color: navy }}>Upgrade →</Link>
              </div>
            )}
            {error && (
              <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 10 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Ask your career coach…"
                disabled={sending}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                style={{
                  background: purple, color: white, border: "none", borderRadius: 10, padding: "0 22px",
                  fontWeight: 700, fontSize: 14, cursor: sending ? "default" : "pointer", opacity: sending ? 0.7 : 1,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

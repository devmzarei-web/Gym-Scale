"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { MessageSquare, Send, Loader2, User, ArrowRight, CheckCheck } from "lucide-react"

export default function ClientMessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [inputContent, setInputContent] = useState("")
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function fetchMessages() {
    try {
      const res = await fetch("/api/client/messages")
      const data = await res.json()
      if (res.ok && data.messages) {
        setMessages(data.messages)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputContent.trim()) return

    setSending(true)
    try {
      const res = await fetch("/api/client/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputContent }),
      })

      if (res.ok) {
        setInputContent("")
        fetchMessages()
      } else {
        const data = await res.json()
        alert(data.error || "خطا در ارسال پیام.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
            <MessageSquare className="h-7 w-7 text-emerald-600" />
            گفتگو با مربی اختصاصی
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ارسال پیام، سوالات درباره برنامه تمرینی یا رژیم و دریافت پاسخ از مربی
          </p>
        </div>

        <Link
          href="/client"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </Link>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[65vh]">
        {/* Chat Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <MessageSquare className="h-10 w-10 text-slate-300" />
              <p className="text-xs">هنوز پیامی بین شما و مربی رد و بدل نشده است.</p>
              <p className="text-[11px] text-slate-400">اولین پیام خود را ارسال نمایید!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderRole === "CLIENT"
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-2xl text-xs space-y-1.5 shadow-xs ${
                      isMine
                        ? "bg-emerald-600 text-white rounded-tr-none"
                        : "bg-white text-slate-900 border border-slate-200 rounded-tl-none"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] ${
                        isMine ? "text-emerald-100" : "text-slate-400"
                      }`}
                    >
                      <span>{new Date(msg.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                      {isMine && <CheckCheck className="h-3 w-3 text-emerald-200" />}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="پیام خود را برای مربی بنویسید..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
          />
          <button
            type="submit"
            disabled={sending || !inputContent.trim()}
            className="flex items-center justify-center p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all shadow-md disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rotate-180" />}
          </button>
        </form>
      </div>
    </div>
  )
}

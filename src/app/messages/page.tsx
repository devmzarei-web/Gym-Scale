"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { MessageSquare, Send, Loader2, User, Search, CheckCheck } from "lucide-react"
import { toast } from "sonner"

function TrainerMessagesContent() {
  const searchParams = useSearchParams()
  const initialClientId = searchParams.get("clientId") || ""

  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId)
  const [messages, setMessages] = useState<any[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [inputContent, setInputContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchClientsAndMessages()

    // Real-time live polling for new messages every 2.5s while on trainer chat page
    const interval = setInterval(() => {
      fetchClientsAndMessages(true)
    }, 2500)

    return () => clearInterval(interval)
  }, [selectedClientId])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function fetchClientsAndMessages(isSilent = false) {
    try {
      const url = selectedClientId
        ? `/api/trainer/messages?clientId=${selectedClientId}`
        : `/api/trainer/messages`

      const res = await fetch(url)
      const data = await res.json()

      if (res.ok) {
        if (data.clients) setClients(data.clients)
        if (data.messages) {
          setMessages((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(data.messages)) {
              return data.messages
            }
            return prev
          })
        }

        // Default select first client if none selected
        if (!selectedClientId && data.clients && data.clients.length > 0) {
          setSelectedClientId(data.clients[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      if (!isSilent) {
        setLoadingClients(false)
        setLoadingMessages(false)
      }
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputContent.trim() || !selectedClientId) return

    setSending(true)
    try {
      const res = await fetch("/api/trainer/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          content: inputContent,
        }),
      })

      if (res.ok) {
        setInputContent("")
        fetchClientsAndMessages(true)
      } else {
        const data = await res.json()
        toast.error(data.error || "خطا در ارسال پیام.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  )

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
          <MessageSquare className="h-7 w-7 text-emerald-600" />
          مرکز گفتگو با شاگردان
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          ارسال و دریافت پیام‌های مشاوره ورزشی، تغذیه و پاسخ به سوالات شاگردان
        </p>
      </div>

      {/* Main Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[70vh]">
        {/* Left Sidebar: Clients List */}
        <div className="border-b md:border-b-0 md:border-l border-slate-200 bg-slate-50/50 flex flex-col h-full">
          <div className="p-3.5 border-b border-slate-200">
            <div className="relative">
              <Search className="h-4 w-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام یا تلفن شاگرد..."
                className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingClients ? (
              <div className="p-6 text-center">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600 mx-auto" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                شاگردی یافت نشد.
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = client.id === selectedClientId
                return (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id)
                      setLoadingMessages(true)
                    }}
                    className={`w-full text-right p-3.5 flex items-center gap-3 transition-colors ${
                      isSelected
                        ? "bg-emerald-50/80 border-r-4 border-emerald-600"
                        : "hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0 border border-emerald-200">
                      {client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {client.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block mt-0.5 font-mono dir-ltr text-right">
                        {client.phone || client.email || "بدون مشخصات"}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div className="col-span-2 flex flex-col h-full bg-white">
          {!selectedClient ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <User className="h-10 w-10 text-slate-300" />
              <p className="text-xs font-bold">برای شروع گفتگو، یک شاگرد را از لیست انتخاب کنید.</p>
            </div>
          ) : (
            <>
              {/* Active Client Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 font-heading">
                      {selectedClient.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {selectedClient.phone || selectedClient.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/30">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <MessageSquare className="h-10 w-10 text-slate-300" />
                    <p className="text-xs">پیامی با این شاگرد ثبت نشده است.</p>
                    <p className="text-[11px] text-slate-400">اولین پیام خود را ارسال نمایید!</p>
                  </div>
                ) : (
                  messages.map((msg: any) => {
                    const isMine = msg.senderRole !== "CLIENT"
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? "items-start" : "items-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-1.5 ${
                            isMine
                              ? "bg-emerald-600 text-white rounded-tr-none shadow-xs"
                              : "bg-white text-slate-900 border border-slate-200 rounded-tl-none shadow-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <div
                            className={`flex items-center gap-1 text-[10px] ${
                              isMine ? "text-emerald-100" : "text-slate-400"
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString("fa-IR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMine && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder="پاسخ خود به شاگرد را بنویسید..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 transition-colors"
                />
                <button
                  type="submit"
                  disabled={sending || !inputContent.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-3 rounded-2xl transition-all shadow-xs shrink-0 flex items-center justify-center"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 rotate-180" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TrainerMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" /></div>}>
      <TrainerMessagesContent />
    </Suspense>
  )
}

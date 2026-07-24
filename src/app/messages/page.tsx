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
  }, [selectedClientId])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function fetchClientsAndMessages() {
    try {
      const url = selectedClientId
        ? `/api/trainer/messages?clientId=${selectedClientId}`
        : `/api/trainer/messages`

      const res = await fetch(url)
      const data = await res.json()

      if (res.ok) {
        if (data.clients) setClients(data.clients)
        if (data.messages) setMessages(data.messages)

        // Default select first client if none selected
        if (!selectedClientId && data.clients && data.clients.length > 0) {
          setSelectedClientId(data.clients[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingClients(false)
      setLoadingMessages(false)
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
        fetchClientsAndMessages()
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
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {client.name}
                      </h4>
                      {client.phone && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          {client.phone}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Chat Area */}
        <div className="md:col-span-2 flex flex-col h-full bg-white">
          {selectedClient ? (
            <>
              {/* Selected Client Header */}
              <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/30">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    گفتگو با {selectedClient.name}
                  </h3>
                  <span className="text-[10px] text-slate-400">شاگرد فعال شما</span>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <MessageSquare className="h-8 w-8 text-slate-300" />
                    <p className="text-xs">هنوز پیامی رد و بدل نشده است.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isTrainer = msg.senderRole !== "CLIENT"
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isTrainer ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3.5 rounded-2xl text-xs space-y-1 shadow-xs ${
                            isTrainer
                              ? "bg-slate-900 text-white rounded-tr-none"
                              : "bg-white border border-slate-200 text-slate-900 rounded-tl-none"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] ${
                              isTrainer ? "text-slate-400" : "text-slate-400"
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString("fa-IR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isTrainer && <CheckCheck className="h-3 w-3 text-emerald-400" />}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder="پاسخ خود را برای شاگرد بنویسید..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  disabled={sending || !inputContent.trim()}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all shadow-md disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rotate-180" />}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              یک شاگرد را برای شروع گفتگو انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TrainerMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <TrainerMessagesContent />
    </Suspense>
  )
}

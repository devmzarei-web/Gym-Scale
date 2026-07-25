"use client"

import { useEffect } from "react"
import { Timer, Pause, Play, RotateCcw, Plus } from "lucide-react"

interface RestTimerProps {
  timerSeconds: number
  setTimerSeconds: React.Dispatch<React.SetStateAction<number>>
  timerActive: boolean
  setTimerActive: React.Dispatch<React.SetStateAction<boolean>>
  timerPreset: number
  handleStartTimer: (seconds: number) => void
}

export function playBeepAndVibrate() {
  try {
    // 1. Audio Beep via Web Audio API
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // First tone (high)
    const osc1 = audioCtx.createOscillator()
    const gain1 = audioCtx.createGain()
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 note
    gain1.gain.setValueAtTime(0.3, audioCtx.currentTime)
    osc1.connect(gain1)
    gain1.connect(audioCtx.destination)
    osc1.start()
    osc1.stop(audioCtx.currentTime + 0.3)

    // Second double beep tone
    setTimeout(() => {
      try {
        const osc2 = audioCtx.createOscillator()
        const gain2 = audioCtx.createGain()
        osc2.type = "sine"
        osc2.frequency.setValueAtTime(1046.5, audioCtx.currentTime) // C6 note
        gain2.gain.setValueAtTime(0.4, audioCtx.currentTime)
        osc2.connect(gain2)
        gain2.connect(audioCtx.destination)
        osc2.start()
        osc2.stop(audioCtx.currentTime + 0.4)
      } catch (e) {
        console.error(e)
      }
    }, 350)
  } catch (e) {
    console.error(e)
  }

  // 2. Mobile Haptic Vibration Pattern
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([200, 100, 200, 100, 400])
    } catch (e) {
      console.error("Vibration error:", e)
    }
  }
}

export default function RestTimer({
  timerSeconds,
  setTimerSeconds,
  timerActive,
  setTimerActive,
  timerPreset,
  handleStartTimer,
}: RestTimerProps) {
  // Add +30 seconds extension
  const addThirtySeconds = () => {
    setTimerSeconds((prev) => prev + 30)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40 bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-3xl border border-slate-700/80 shadow-2xl flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-2xl border transition-all ${
          timerActive 
            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 animate-pulse" 
            : "bg-slate-800 border-slate-700 text-slate-400"
        }`}>
          <Timer className="h-6 w-6" />
        </div>
        <div>
          <span className="block text-[10px] text-slate-400 font-bold">تایمر استراحت بین ست‌ها</span>
          <span className={`text-2xl font-black font-mono tracking-wider transition-colors ${
            timerSeconds <= 5 && timerSeconds > 0 
              ? "text-rose-400 animate-ping-short" 
              : "text-emerald-400"
          }`}>
            {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Timer Control Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setTimerActive(!timerActive)}
          className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95"
          title={timerActive ? "توقف" : "شروع"}
        >
          {timerActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setTimerSeconds(timerPreset)
            setTimerActive(false)
          }}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all active:scale-95"
          title="بازنشانی"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={addThirtySeconds}
          className="px-2.5 py-2.5 rounded-2xl bg-emerald-950 border border-emerald-700/60 hover:bg-emerald-900 text-emerald-300 font-extrabold text-xs transition-all flex items-center gap-0.5 active:scale-95"
          title="افزایش ۳۰ ثانیه"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>۳۰s</span>
        </button>

        {/* Quick Presets */}
        <div className="hidden sm:flex items-center gap-1 border-r border-slate-700 pr-2 mr-1 text-[11px] font-bold">
          {[45, 60, 90, 120].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStartTimer(s)}
              className={`px-2 py-1 rounded-lg transition-all ${
                timerPreset === s ? "bg-emerald-500 text-slate-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {s}s
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

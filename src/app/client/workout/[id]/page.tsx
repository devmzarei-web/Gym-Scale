"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Dumbbell,
  Timer,
  Video,
  X,
  Sparkles,
  ArrowRight,
  Loader2,
  Volume2,
  Award,
} from "lucide-react"

import RestTimer, { playBeepAndVibrate } from "../rest-timer"

export default function LiveWorkoutModePage() {
  const params = useParams()
  const router = useRouter()
  const initialRoutineId = (params?.id as string) || ""
  const [allRoutines, setAllRoutines] = useState<any[]>([])
  const [activeRoutineId, setActiveRoutineId] = useState<string>(initialRoutineId)

  const [routine, setRoutine] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  
  // Track completed sets state: { [exerciseId_setIndex]: boolean }
  const [completedSets, setCompletedSets] = useState<{ [key: string]: boolean }>({})
  // Track set-by-set weight & reps: { [exerciseId_setIndex]: { weight: string; reps: string } }
  const [setMetrics, setSetMetrics] = useState<{ [key: string]: { weight: string; reps: string } }>({})

  // Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [timerActive, setTimerActive] = useState(false)
  const [timerPreset, setTimerPreset] = useState(60)

  // Media Preview Modal State
  const [activeMedia, setActiveMedia] = useState<{ name: string; url: string; isGif?: boolean } | null>(null)

  // Workout Finish State
  const [submitting, setSubmitting] = useState(false)
  const [finishSuccess, setFinishSuccess] = useState(false)
  const [startTime] = useState<number>(Date.now())

  useEffect(() => {
    fetchProfileAndRoutines()
  }, [activeRoutineId])

  // Timer Interval Effect
  useEffect(() => {
    let interval: any = null
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1)
      }, 1000)
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false)
      // Play audio beep and trigger haptic vibration when timer finishes
      playBeepAndVibrate()
    }
    return () => clearInterval(interval)
  }, [timerActive, timerSeconds])

  function parseRestTimeSeconds(restTimeStr?: string): number {
    if (!restTimeStr) return 60
    const match = restTimeStr.match(/\d+/)
    if (match) {
      const num = parseInt(match[0], 10)
      return num > 0 ? num : 60
    }
    return 60
  }

  function playBeepSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      osc.type = "sine"
      osc.frequency.setValueAtTime(800, audioCtx.currentTime)
      osc.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.5)
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchProfileAndRoutines() {
    setLoading(true)
    try {
      const res = await fetch(`/api/user/profile`)
      if (!res.ok) {
        router.push("/client")
        return
      }

      // Fetch routine details
      const rRes = await fetch(`/api/routines/${activeRoutineId}`)
      if (rRes.ok) {
        const data = await rRes.json()
        setRoutine(data.routine)
      } else {
        router.push("/client")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function toggleSet(ex: any, setNum: number) {
    const key = `${ex.id}_${setNum}`
    const willBeDone = !completedSets[key]
    setCompletedSets((prev) => ({
      ...prev,
      [key]: willBeDone,
    }))

    // Auto trigger rest timer using exercise's custom rest time
    if (willBeDone) {
      const restSec = parseRestTimeSeconds(ex.restTime)
      setTimerPreset(restSec)
      setTimerSeconds(restSec)
      setTimerActive(true)
    }
  }

  function handleStartTimer(seconds: number) {
    setTimerPreset(seconds)
    setTimerSeconds(seconds)
    setTimerActive(true)
  }

  async function handleFinishWorkout() {
    if (!routine) return
    setSubmitting(true)

    const currentDay = routine.workoutDays[selectedDayIndex]
    const exercises = currentDay?.exercises || []
    
    // Count how many exercises have at least 1 completed set
    const completedCount = exercises.filter((ex: any) => {
      for (let s = 1; s <= ex.sets; s++) {
        if (completedSets[`${ex.id}_${s}`]) return true
      }
      return false
    }).length

    const elapsedMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000))

    try {
      const res = await fetch("/api/client/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routineId: routine.id,
          dayLabel: currentDay?.label || `روز ${selectedDayIndex + 1}`,
          durationMinutes: elapsedMinutes,
          completedExercises: completedCount,
          totalExercises: exercises.length,
          setDetails: {
            completedSets,
            setMetrics,
          },
        }),
      })

      if (res.ok) {
        setFinishSuccess(true)
        setTimeout(() => {
          router.push("/client")
        }, 3000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!routine || !routine.workoutDays || routine.workoutDays.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center space-y-4">
        <p className="text-xs text-slate-500">برنامه تمرینی یافت نشد.</p>
        <Link href="/client" className="text-xs font-bold text-emerald-600 hover:underline">
          بازگشت به داشبورد
        </Link>
      </div>
    )
  }

  const currentDay = routine.workoutDays[selectedDayIndex]
  const exercises = currentDay?.exercises || []

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8 pb-32">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 mb-1">
            <Sparkles className="h-4 w-4" />
            حالت زنده اجرا و ثبت تمرین
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading">
            {routine.title}
          </h1>
        </div>

        <Link
          href="/client"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all w-fit"
        >
          <ArrowRight className="h-4 w-4" />
          خروج از تمرین
        </Link>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {routine.workoutDays.map((dayObj: any, idx: number) => (
          <button
            key={dayObj.id || idx}
            onClick={() => setSelectedDayIndex(idx)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedDayIndex === idx
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {dayObj.label || `روز ${idx + 1}`} ({dayObj.exercises?.length || 0} حرکت)
          </button>
        ))}
      </div>

      {/* Exercise List for Selected Day */}
      <div className="space-y-4">
        {exercises.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            برای این روز حرکتی تعریف نشده است.
          </div>
        ) : (
          exercises.map((ex: any, exIdx: number) => {
            const mediaUrl = ex.gifUrl || ex.videoUrl
            return (
              <div
                key={ex.id || exIdx}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 transition-all"
              >
                {/* Exercise Title & Muscle Group */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
                        {exIdx + 1}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 font-heading">
                        {ex.name}
                      </h3>
                    </div>
                    {ex.muscleGroup && (
                      <span className="inline-block text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        عضله هدف: {ex.muscleGroup}
                      </span>
                    )}
                  </div>

                  {/* In-App GIF/Video Preview Button */}
                  {mediaUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMedia({
                          name: ex.name,
                          url: mediaUrl,
                          isGif: Boolean(ex.gifUrl),
                        })
                      }
                      className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Video className="h-3.5 w-3.5 text-emerald-600" />
                      مشاهده حرکت (GIF/ویدیو)
                    </button>
                  )}
                </div>

                {/* Target Specs: Sets, Reps, Weight, Rest */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">تعداد ست:</span>
                    <span className="font-bold text-slate-800">{ex.sets} ست</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">تکرار:</span>
                    <span className="font-bold text-slate-800">{ex.repetitions}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">وزن یا وزنه پیشنهادی:</span>
                    <span className="font-bold text-slate-800">{ex.weight || "بر اساس آمادگی"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">استراحت بین ست‌ها:</span>
                    <span className="font-bold text-emerald-700">{ex.restTime || "۶۰ ثانیه"}</span>
                  </div>
                </div>

                {ex.customDescription && (
                  <p className="text-xs text-slate-600 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
                    💡 نکته مربی: {ex.customDescription}
                  </p>
                )}

                {/* Interactive Set Logger (Weight & Reps per Set) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 font-heading">
                      ثبت وزن و تکرار انجام‌شده در هر ست:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      بر روی کلید تایید کلیک کنید تا تایمر استراحت فعال شود
                    </span>
                  </div>

                  <div className="space-y-2">
                    {Array.from({ length: ex.sets }).map((_, setIdx) => {
                      const setNum = setIdx + 1
                      const key = `${ex.id}_${setNum}`
                      const isDone = Boolean(completedSets[key])
                      const currentMetrics = setMetrics[key] || {
                        weight: ex.weight ? ex.weight.replace(/[^0-9.]/g, "") : "",
                        reps: ex.repetitions ? ex.repetitions.replace(/[^0-9.]/g, "") : "10",
                      }

                      const updateMetrics = (field: "weight" | "reps", val: string) => {
                        setSetMetrics((prev) => ({
                          ...prev,
                          [key]: {
                            ...currentMetrics,
                            [field]: val,
                          },
                        }))
                      }

                      const adjustVal = (field: "weight" | "reps", delta: number) => {
                        const current = parseFloat(currentMetrics[field] || "0") || 0
                        const updated = Math.max(0, current + delta)
                        updateMetrics(field, String(updated))
                      }

                      return (
                        <div
                          key={setNum}
                          className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isDone
                              ? "bg-emerald-50/70 border-emerald-300"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          {/* Set Badge */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-7 w-7 rounded-xl font-black text-xs flex items-center justify-center ${
                                isDone
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {setNum}
                            </span>
                            <span className="text-xs font-bold text-slate-900">ست {setNum}</span>
                          </div>

                          {/* Weight & Rep Inputs */}
                          <div className="flex items-center gap-3 text-xs flex-1 justify-end">
                            {/* Weight Field */}
                            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                              <span className="text-[10px] text-slate-400 px-1 font-semibold">وزن (kg):</span>
                              <button
                                type="button"
                                onClick={() => adjustVal("weight", -2.5)}
                                className="h-6 w-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                              <input
                                type="text"
                                value={currentMetrics.weight}
                                onChange={(e) => updateMetrics("weight", e.target.value)}
                                placeholder="80"
                                className="w-12 text-center text-xs font-extrabold text-slate-900 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => adjustVal("weight", 2.5)}
                                className="h-6 w-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center text-xs"
                              >
                                +
                              </button>
                            </div>

                            {/* Reps Field */}
                            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                              <span className="text-[10px] text-slate-400 px-1 font-semibold">تکرار:</span>
                              <button
                                type="button"
                                onClick={() => adjustVal("reps", -1)}
                                className="h-6 w-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                              <input
                                type="text"
                                value={currentMetrics.reps}
                                onChange={(e) => updateMetrics("reps", e.target.value)}
                                placeholder="10"
                                className="w-10 text-center text-xs font-extrabold text-slate-900 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => adjustVal("reps", 1)}
                                className="h-6 w-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center text-xs"
                              >
                                +
                              </button>
                            </div>

                            {/* Completion Check Button */}
                            <button
                              type="button"
                              onClick={() => toggleSet(ex, setNum)}
                              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                                isDone
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "bg-slate-900 hover:bg-slate-800 text-white"
                              }`}
                            >
                              <CheckCircle2 className={`h-4 w-4 ${isDone ? "text-white" : "text-emerald-400"}`} />
                              {isDone ? "انجام شد" : "تایید ست"}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            )
          })
        )}
      </div>

      {/* Floating Rest Countdown Timer Widget (Sticky Bottom) */}
      <RestTimer
        timerSeconds={timerSeconds}
        setTimerSeconds={setTimerSeconds}
        timerActive={timerActive}
        setTimerActive={setTimerActive}
        timerPreset={timerPreset}
        handleStartTimer={handleStartTimer}
      />

      {/* Finish Workout CTA Button */}
      <div className="pt-4 flex justify-center">
        <button
          type="button"
          onClick={handleFinishWorkout}
          disabled={submitting}
          className="w-full max-w-md flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-extrabold py-4 px-6 rounded-2xl shadow-xl transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "🏁 تکمیل و ثبت تمرین امروز"}
        </button>
      </div>

      {/* Media Modal (GIF Preview or Video Player) */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl space-y-4 p-5 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                راهنمای حرکت: {activeMedia.name}
              </h3>
              <button
                onClick={() => setActiveMedia(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
              {activeMedia.url.endsWith(".gif") || activeMedia.isGif ? (
                <img
                  src={activeMedia.url}
                  alt={activeMedia.name}
                  className="w-full h-full object-contain"
                />
              ) : activeMedia.url.includes("youtube.com") || activeMedia.url.includes("youtu.be") ? (
                <iframe
                  src={activeMedia.url.replace("watch?v=", "embed/")}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeMedia.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Finish Success Celebration Modal */}
      {finishSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-2 border-emerald-300">
              <Award className="h-10 w-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
                خسته نباشید! تمرین با موفقیت ثبت شد 🎉
              </h2>
              <p className="text-xs text-slate-500">
                اطلاعات تمرین امروز شما ثبت گردید. در حال انتقال به داشبورد...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

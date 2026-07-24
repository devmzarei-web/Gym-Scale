"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dumbbell,
  Plus,
  Trash2,
  Save,
  ArrowRight,
  Loader2,
  Edit3,
  ListFilter,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
} from "lucide-react"
import { createRoutine, updateRoutine } from "@/app/actions/routine"
import { GifUploadInput } from "@/components/gif-upload-input"
import { toast } from "sonner"

const DAYS_OF_WEEK = [
  { id: "SATURDAY", label: "شنبه" },
  { id: "SUNDAY", label: "یکشنبه" },
  { id: "MONDAY", label: "دوشنبه" },
  { id: "TUESDAY", label: "سه‌شنبه" },
  { id: "WEDNESDAY", label: "چهارشنبه" },
  { id: "THURSDAY", label: "پنجشنبه" },
  { id: "FRIDAY", label: "جمعه" },
] as const

const MUSCLE_GROUPS = [
  "سینه",
  "پشت",
  "سرشانه",
  "بازو",
  "پا",
  "ساق پا",
  "شکم و پهلو",
  "سایر",
]

type DayKey = typeof DAYS_OF_WEEK[number]["id"]
type GroupTypeKey = "NORMAL" | "SUPERSET" | "TRISET" | "CIRCUIT" | "DROPSET" | "REST_PAUSE" | "TEMPO"

interface ExerciseItem {
  id: string
  name: string
  muscleGroup: string
  isCustom: boolean
  sets: number
  repetitions: string
  restTime: string
  weight: string
  customDescription: string
  gifUrl?: string | null
  groupType: GroupTypeKey
  groupId?: string | null
  // Paired dropdown exercise fields for SUPERSET & TRISET
  pairedMuscleGroup?: string
  pairedExerciseName?: string
  triMuscleGroup2?: string
  triExerciseName2?: string
}

interface DayItem {
  id: string
  day: DayKey
  label: string
  exercises: ExerciseItem[]
}

interface RoutineBuilderProps {
  exerciseDictionary: Array<{ id: string; name: string; muscleGroup: string; gifUrl?: string | null }>
  clients: Array<{ id: string; name: string }>
  initialClientId?: string
  existingRoutine?: any
}

export function RoutineBuilderForm({
  exerciseDictionary,
  clients,
  initialClientId,
  existingRoutine,
}: RoutineBuilderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(existingRoutine?.title || "")
  const [description, setDescription] = useState(existingRoutine?.description || "")
  const [clientId, setClientId] = useState(initialClientId || "")
  const [isTemplate, setIsTemplate] = useState(existingRoutine ? existingRoutine.isTemplate : !initialClientId)

  // Track collapsed state per day ID
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({})

  // Track last selected muscle group across the form
  const [lastMuscleGroup, setLastMuscleGroup] = useState<string>("سینه")

  const [days, setDays] = useState<DayItem[]>(
    existingRoutine
      ? existingRoutine.workoutDays.map((d: any) => ({
          id: d.id,
          day: d.day,
          label: d.label,
          exercises: d.exercises.map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            muscleGroup: ex.muscleGroup || "سینه",
            isCustom: !exerciseDictionary.some((dict) => dict.name === ex.name),
            sets: ex.sets,
            repetitions: ex.repetitions,
            restTime: ex.restTime || "",
            weight: ex.weight || "",
            customDescription: ex.customDescription || "",
            gifUrl: ex.gifUrl || "",
            groupType: (ex.groupType as GroupTypeKey) || "NORMAL",
            groupId: ex.groupId || null,
          })),
        }))
      : [
          {
            id: "day-1",
            day: "SATURDAY",
            label: "روز اول - سینه و بازو",
            exercises: [
              {
                id: "ex-1",
                name: "پرس سینه هالتر",
                muscleGroup: "سینه",
                isCustom: false,
                sets: 4,
                repetitions: "10-12",
                restTime: "90 ثانیه",
                weight: "",
                customDescription: "",
                gifUrl: "",
                groupType: "NORMAL",
                groupId: null,
              },
            ],
          },
        ]
  )

  function toggleDayCollapse(dayId: string) {
    setCollapsedDays((prev) => ({
      ...prev,
      [dayId]: !prev[dayId],
    }))
  }

  function handleAddDay() {
    const nextDayIndex = days.length % DAYS_OF_WEEK.length
    const nextDayObj = DAYS_OF_WEEK[nextDayIndex]
    const newDayId = `day-${Date.now()}`
    setDays((prev) => [
      ...prev,
      {
        id: newDayId,
        day: nextDayObj.id,
        label: `روز ${prev.length + 1}`,
        exercises: [],
      },
    ])
  }

  function handleRemoveDay(dayId: string) {
    if (days.length <= 1) {
      toast.error("حداقل یک روز تمرینی باید وجود داشته باشد.")
      return
    }
    setDays((prev) => prev.filter((d) => d.id !== dayId))
  }

  function handleAddExercise(dayId: string) {
    const newExId = `ex-${Date.now()}`
    const availableEx = exerciseDictionary.filter((dict) => dict.muscleGroup === lastMuscleGroup)
    const firstDictItem = availableEx.length > 0 ? availableEx[0] : null

    setDays((prev) =>
      prev.map((d) => {
        if (d.id === dayId) {
          return {
            ...d,
            exercises: [
              ...d.exercises,
              {
                id: newExId,
                name: firstDictItem ? firstDictItem.name : "",
                muscleGroup: lastMuscleGroup,
                isCustom: !firstDictItem,
                sets: 3,
                repetitions: "12",
                restTime: "60 ثانیه",
                weight: "",
                customDescription: "",
                gifUrl: firstDictItem?.gifUrl || "",
                groupType: "NORMAL",
                groupId: null,
              },
            ],
          }
        }
        return d
      })
    )

    // Uncollapse if collapsed
    if (collapsedDays[dayId]) {
      setCollapsedDays((prev) => ({ ...prev, [dayId]: false }))
    }
  }

  function handleMoveExercise(dayId: string, index: number, direction: "up" | "down") {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id === dayId) {
          const newExercises = [...d.exercises]
          const targetIndex = direction === "up" ? index - 1 : index + 1
          if (targetIndex < 0 || targetIndex >= newExercises.length) return d

          const temp = newExercises[index]
          newExercises[index] = newExercises[targetIndex]
          newExercises[targetIndex] = temp

          return { ...d, exercises: newExercises }
        }
        return d
      })
    )
  }

  function handleRemoveExercise(dayId: string, exId: string) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id === dayId) {
          return {
            ...d,
            exercises: d.exercises.filter((ex) => ex.id !== exId),
          }
        }
        return d
      })
    )
  }

  function handleUpdateExercise(dayId: string, exId: string, field: keyof ExerciseItem, value: any) {
    if (field === "muscleGroup") {
      setLastMuscleGroup(value)
    }

    setDays((prev) =>
      prev.map((d) => {
        if (d.id === dayId) {
          return {
            ...d,
            exercises: d.exercises.map((ex) => {
              if (ex.id === exId) {
                const updated = { ...ex, [field]: value }
                if (field === "name" && !ex.isCustom) {
                  const match = exerciseDictionary.find((dict) => dict.name === value)
                  if (match && match.gifUrl) {
                    updated.gifUrl = match.gifUrl
                  }
                }
                return updated
              }
              return ex
            }),
          }
        }
        return d
      })
    )
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("لطفا عنوان برنامه تمرینی را وارد کنید.")
      return
    }

    setLoading(true)
    try {
      const payload = {
        title,
        description,
        isTemplate,
        clientId: clientId || undefined,
        workoutDays: days.map((d) => {
          const formattedExercises: any[] = []

          d.exercises.forEach((ex) => {
            if (ex.groupType === "SUPERSET" && ex.pairedExerciseName) {
              const pairedGif = exerciseDictionary.find((item) => item.name === ex.pairedExerciseName)?.gifUrl || null
              const sharedGroupId = ex.groupId || `superset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`

              // Exercise 1 (Primary)
              formattedExercises.push({
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                sets: Number(ex.sets) || 1,
                repetitions: ex.repetitions || "10-12",
                restTime: "بلافاصله",
                weight: ex.weight || null,
                customDescription: ex.customDescription || null,
                gifUrl: ex.gifUrl || null,
                groupType: "SUPERSET",
                groupId: sharedGroupId,
              })

              // Exercise 2 (Paired exercise from dropdown)
              formattedExercises.push({
                name: ex.pairedExerciseName,
                muscleGroup: ex.pairedMuscleGroup || ex.muscleGroup,
                sets: Number(ex.sets) || 1,
                repetitions: ex.repetitions || "10-12",
                restTime: ex.restTime || "60 ثانیه",
                weight: ex.weight || null,
                customDescription: "زوج سوپرست (حرکت دوم)",
                gifUrl: pairedGif,
                groupType: "SUPERSET",
                groupId: sharedGroupId,
              })
            } else if (ex.groupType === "TRISET" && ex.pairedExerciseName) {
              const pairedGif1 = exerciseDictionary.find((item) => item.name === ex.pairedExerciseName)?.gifUrl || null
              const pairedGif2 = ex.triExerciseName2 ? exerciseDictionary.find((item) => item.name === ex.triExerciseName2)?.gifUrl || null : null
              const sharedGroupId = ex.groupId || `triset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`

              // Exercise 1
              formattedExercises.push({
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                sets: Number(ex.sets) || 1,
                repetitions: ex.repetitions || "10-12",
                restTime: "بلافاصله",
                weight: ex.weight || null,
                customDescription: ex.customDescription || null,
                gifUrl: ex.gifUrl || null,
                groupType: "TRISET",
                groupId: sharedGroupId,
              })

              // Exercise 2
              formattedExercises.push({
                name: ex.pairedExerciseName,
                muscleGroup: ex.pairedMuscleGroup || ex.muscleGroup,
                sets: Number(ex.sets) || 1,
                repetitions: ex.repetitions || "10-12",
                restTime: ex.triExerciseName2 ? "بلافاصله" : (ex.restTime || "90 ثانیه"),
                weight: ex.weight || null,
                customDescription: "حرکت دوم تری‌ست",
                gifUrl: pairedGif1,
                groupType: "TRISET",
                groupId: sharedGroupId,
              })

              // Exercise 3 if selected
              if (ex.triExerciseName2) {
                formattedExercises.push({
                  name: ex.triExerciseName2,
                  muscleGroup: ex.triMuscleGroup2 || ex.muscleGroup,
                  sets: Number(ex.sets) || 1,
                  repetitions: ex.repetitions || "10-12",
                  restTime: ex.restTime || "90 ثانیه",
                  weight: ex.weight || null,
                  customDescription: "حرکت سوم تری‌ست",
                  gifUrl: pairedGif2,
                  groupType: "TRISET",
                  groupId: sharedGroupId,
                })
              }
            } else {
              formattedExercises.push({
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                sets: Number(ex.sets) || 1,
                repetitions: ex.repetitions || "10",
                restTime: ex.restTime || null,
                weight: ex.weight || null,
                customDescription: ex.customDescription || null,
                gifUrl: ex.gifUrl || null,
                groupType: ex.groupType || "NORMAL",
                groupId: ex.groupId || null,
              })
            }
          })

          return {
            day: d.day,
            label: d.label,
            exercises: formattedExercises,
          }
        }),
      }

      if (existingRoutine) {
        await updateRoutine(existingRoutine.id, payload)
        toast.success("برنامه تمرینی با موفقیت به‌روزرسانی شد.")
        router.push(`/routines/${existingRoutine.id}`)
      } else {
        const res = await createRoutine(payload)
        toast.success("برنامه تمرینی جدید با موفقیت ذخیره شد.")
        if (clientId) {
          router.push(`/clients/${clientId}`)
        } else {
          router.push("/routines")
        }
      }
    } catch (err: any) {
      console.error("Save Routine Error:", err)
      toast.error(err.message || "خطا در ثبت برنامه تمرینی")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-emerald-600" />
              {existingRoutine ? "ویرایش برنامه تمرینی" : "طراحی برنامه تمرینی جدید"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              پشتیبانی از سوپرست، تری‌ست، دراپ‌ست، تمپو و انتخاب حرکات مکمل از کشوی حرکات
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {existingRoutine ? "به‌روزرسانی برنامه" : "ذخیره برنامه تمرینی"}
        </button>
      </div>

      {/* Basic Meta Form */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان برنامه تمرینی <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: برنامه ۴ روزه هیپرتروفی / افزایش حجم"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تخصیص به شاگرد (اختیاری)</label>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value)
                if (e.target.value) setIsTemplate(false)
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 transition-colors"
            >
              <option value="">بدون تخصیص (ذخیره به عنوان قالب آماده)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و دستورالعمل کلی برنامه</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="مثال: رعایت سیستم گرم کردن پیش از شروع، تنفس صحیح و استراحت کافی..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Workout Days Builder */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 font-heading">روزهای تمرینی برنامه</h2>
          <button
            onClick={handleAddDay}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-emerald-50 text-emerald-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
            افزودن روز جدید
          </button>
        </div>

        {days.map((dayItem, dayIdx) => {
          const isCollapsed = Boolean(collapsedDays[dayItem.id])

          return (
            <div
              key={dayItem.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-xs transition-all"
            >
              {/* Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDayCollapse(dayItem.id)}
                    className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    title={isCollapsed ? "باز کردن لیست حرکات" : "جمع کردن این روز"}
                  >
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </button>

                  <span className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-extrabold text-xs">
                    {dayIdx + 1}
                  </span>

                  <input
                    type="text"
                    value={dayItem.label}
                    onChange={(e) =>
                      setDays((prev) =>
                        prev.map((d) => (d.id === dayItem.id ? { ...d, label: e.target.value } : d))
                      )
                    }
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600"
                  />

                  {isCollapsed && (
                    <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {dayItem.exercises.length} حرکت
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={dayItem.day}
                    onChange={(e) =>
                      setDays((prev) =>
                        prev.map((d) =>
                          d.id === dayItem.id ? { ...d, day: e.target.value as DayKey } : d
                        )
                      )
                    }
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>

                  {days.length > 1 && (
                    <button
                      onClick={() => handleRemoveDay(dayItem.id)}
                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                      title="حذف این روز"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Exercises List for this Day */}
              {!isCollapsed && (
                <div className="space-y-4">
                  {dayItem.exercises.map((ex, exIdx) => {
                    const filteredExercises = exerciseDictionary.filter(
                      (d) => d.muscleGroup === ex.muscleGroup
                    )

                    const groupBadgeStyles: Record<GroupTypeKey, string> = {
                      NORMAL: "bg-slate-100 text-slate-600 border-slate-200",
                      SUPERSET: "bg-amber-50 text-amber-800 border-amber-300 font-bold",
                      TRISET: "bg-purple-50 text-purple-800 border-purple-300 font-bold",
                      CIRCUIT: "bg-cyan-50 text-cyan-800 border-cyan-300 font-bold",
                      DROPSET: "bg-rose-50 text-rose-800 border-rose-300 font-bold",
                      REST_PAUSE: "bg-blue-50 text-blue-800 border-blue-300 font-bold",
                      TEMPO: "bg-teal-50 text-teal-800 border-teal-300 font-bold",
                    }

                    return (
                      <div
                        key={ex.id}
                        className={`p-4 rounded-2xl border space-y-3 transition-all ${
                          ex.groupType !== "NORMAL"
                            ? "bg-amber-50/30 border-amber-200 shadow-2xs"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            {/* Move Up / Down Buttons for Mobile */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveExercise(dayItem.id, exIdx, "up")}
                                disabled={exIdx === 0}
                                className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveExercise(dayItem.id, exIdx, "down")}
                                disabled={exIdx === dayItem.exercises.length - 1}
                                className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            </div>

                            <span className="text-xs font-bold text-slate-400 w-4">{exIdx + 1}.</span>

                            {/* Grouping / Training Technique Selector */}
                            <div className="flex items-center gap-1">
                              <select
                                value={ex.groupType}
                                onChange={(e) =>
                                  handleUpdateExercise(
                                    dayItem.id,
                                    ex.id,
                                    "groupType",
                                    e.target.value as GroupTypeKey
                                  )
                                }
                                className={`text-[11px] border rounded-xl px-2 py-1 transition-colors ${
                                  groupBadgeStyles[ex.groupType]
                                }`}
                              >
                                <option value="NORMAL">تک‌حرکت عادی</option>
                                <option value="SUPERSET">سوپرست (Superset)</option>
                                <option value="TRISET">تری‌ست (Tri-Set)</option>
                                <option value="CIRCUIT">سیرکت (Circuit)</option>
                                <option value="DROPSET">دراپ‌ست (Drop Set)</option>
                                <option value="REST_PAUSE">رست-پاز (Rest-Pause)</option>
                                <option value="TEMPO">تمپو و کنترل ریتم (Tempo)</option>
                              </select>
                            </div>

                            {/* Muscle Group Selector */}
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                              <ListFilter className="h-3.5 w-3.5 text-emerald-600" />
                              <select
                                value={ex.muscleGroup}
                                onChange={(e) => {
                                  handleUpdateExercise(dayItem.id, ex.id, "muscleGroup", e.target.value)
                                  handleUpdateExercise(dayItem.id, ex.id, "name", "")
                                }}
                                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden"
                              >
                                {MUSCLE_GROUPS.map((g) => (
                                  <option key={g} value={g}>
                                    {g}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Exercise Dropdown OR Custom Text Field */}
                            {!ex.isCustom ? (
                              <select
                                value={ex.name}
                                onChange={(e) =>
                                  handleUpdateExercise(dayItem.id, ex.id, "name", e.target.value)
                                }
                                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600 flex-1"
                              >
                                <option value="">-- انتخاب حرکت ({ex.muscleGroup}) --</option>
                                {filteredExercises.map((dictItem) => (
                                  <option key={dictItem.id} value={dictItem.name}>
                                    {dictItem.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={ex.name}
                                onChange={(e) =>
                                  handleUpdateExercise(dayItem.id, ex.id, "name", e.target.value)
                                }
                                placeholder="نام حرکت جدید..."
                                className="bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600 flex-1 placeholder-slate-400"
                              />
                            )}

                            {/* Toggle Custom Exercise mode */}
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateExercise(dayItem.id, ex.id, "isCustom", !ex.isCustom)
                              }
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors flex items-center gap-1 whitespace-nowrap ${
                                ex.isCustom
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                              title="سوئیچ بین انتخاب از بانک داده یا تایپ حرکت جدید"
                            >
                              <Edit3 className="h-3 w-3" />
                              {ex.isCustom ? "بانک" : "+ جدید"}
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveExercise(dayItem.id, ex.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors self-end md:self-center"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* DYNAMIC EXTRA FIELDS FOR SUPERSET & TRISET (DROPDOWN BASED) */}
                        {ex.groupType === "SUPERSET" && (
                          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-xs">
                            <span className="font-bold text-amber-900 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                              انتخاب حرکت دوم سوپرست (اجرا بلافاصله بدون استراحت):
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-amber-800 mb-1">
                                  گروه عضله حرکت دوم
                                </label>
                                <select
                                  value={ex.pairedMuscleGroup || ex.muscleGroup}
                                  onChange={(e) =>
                                    handleUpdateExercise(dayItem.id, ex.id, "pairedMuscleGroup", e.target.value)
                                  }
                                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                                >
                                  {MUSCLE_GROUPS.map((g) => (
                                    <option key={g} value={g}>
                                      {g}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-amber-800 mb-1">
                                  انتخاب حرکت دوم از بانک حرکات
                                </label>
                                <select
                                  value={ex.pairedExerciseName || ""}
                                  onChange={(e) =>
                                    handleUpdateExercise(dayItem.id, ex.id, "pairedExerciseName", e.target.value)
                                  }
                                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900"
                                >
                                  <option value="">-- انتخاب حرکت دوم سوپرست --</option>
                                  {exerciseDictionary
                                    .filter((d) => d.muscleGroup === (ex.pairedMuscleGroup || ex.muscleGroup))
                                    .map((dictItem) => (
                                      <option key={dictItem.id} value={dictItem.name}>
                                        {dictItem.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {ex.groupType === "TRISET" && (
                          <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl space-y-3 text-xs">
                            <span className="font-bold text-purple-900 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                              انتخاب حرکت دوم و سوم تری‌ست (اجرا پشت‌سرهم بدون استراحت):
                            </span>

                            {/* Exercise 2 */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-purple-800 mb-1">
                                  گروه عضله حرکت دوم
                                </label>
                                <select
                                  value={ex.pairedMuscleGroup || ex.muscleGroup}
                                  onChange={(e) =>
                                    handleUpdateExercise(dayItem.id, ex.id, "pairedMuscleGroup", e.target.value)
                                  }
                                  className="w-full bg-white border border-purple-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                                >
                                  {MUSCLE_GROUPS.map((g) => (
                                    <option key={g} value={g}>
                                      {g}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-purple-800 mb-1">
                                  انتخاب حرکت دوم تری‌ست
                                </label>
                                <select
                                  value={ex.pairedExerciseName || ""}
                                  onChange={(e) =>
                                    handleUpdateExercise(dayItem.id, ex.id, "pairedExerciseName", e.target.value)
                                  }
                                  className="w-full bg-white border border-purple-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900"
                                >
                                  <option value="">-- انتخاب حرکت دوم --</option>
                                  {exerciseDictionary
                                    .filter((d) => d.muscleGroup === (ex.pairedMuscleGroup || ex.muscleGroup))
                                    .map((dictItem) => (
                                      <option key={dictItem.id} value={dictItem.name}>
                                        {dictItem.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>

                            {/* Exercise 3 */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-200/60">
                              <div>
                                <label className="block text-[10px] font-bold text-purple-800 mb-1">
                                  گروه عضله حرکت سوم
                                </label>
                                <select
                                  value={ex.triMuscleGroup2 || ex.muscleGroup}
                                  onChange={(e) =>
                                    handleUpdateExercise(dayItem.id, ex.id, "triMuscleGroup2", e.target.value)
                                  }
                                  className="w-full bg-white border border-purple-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                                >
                                  {MUSCLE_GROUPS.map((g) => (
                                    <option key={g} value={g}>
                                      {g}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-purple-800 mb-1">
                                  انتخاب حرکت سوم تری‌ست
                                </label>
                                <select
                                  value={ex.triExerciseName2 || ""}
                                  onChange={(e) =>
                                    handleUpdateExercise(dayItem.id, ex.id, "triExerciseName2", e.target.value)
                                  }
                                  className="w-full bg-white border border-purple-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900"
                                >
                                  <option value="">-- انتخاب حرکت سوم --</option>
                                  {exerciseDictionary
                                    .filter((d) => d.muscleGroup === (ex.triMuscleGroup2 || ex.muscleGroup))
                                    .map((dictItem) => (
                                      <option key={dictItem.id} value={dictItem.name}>
                                        {dictItem.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Exercise Parameters Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-200/60">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">ست‌ها</label>
                            <input
                              type="number"
                              value={ex.sets}
                              onChange={(e) =>
                                handleUpdateExercise(
                                  dayItem.id,
                                  ex.id,
                                  "sets",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">تکرارها</label>
                            <input
                              type="text"
                              value={ex.repetitions}
                              onChange={(e) =>
                                handleUpdateExercise(dayItem.id, ex.id, "repetitions", e.target.value)
                              }
                              placeholder="10-12"
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">
                              {ex.groupType === "SUPERSET" || ex.groupType === "TRISET"
                                ? "استراحت بعد از اتمام ست"
                                : "استراحت بین ست‌ها"}
                            </label>
                            <input
                              type="text"
                              value={ex.restTime}
                              onChange={(e) =>
                                handleUpdateExercise(dayItem.id, ex.id, "restTime", e.target.value)
                              }
                              placeholder="60 ثانیه"
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">توضیحات و ملاحظات مربی</label>
                            <input
                              type="text"
                              value={ex.customDescription}
                              onChange={(e) =>
                                handleUpdateExercise(dayItem.id, ex.id, "customDescription", e.target.value)
                              }
                              placeholder="نکات اجرای حرکت، مکث..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-4">
                            <GifUploadInput
                              compact
                              value={ex.gifUrl || ""}
                              onChange={(url) =>
                                handleUpdateExercise(dayItem.id, ex.id, "gifUrl", url)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <button
                    onClick={() => handleAddExercise(dayItem.id)}
                    className="w-full py-2.5 rounded-2xl border border-dashed border-slate-300 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    افزودن حرکت به {dayItem.label}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  Dumbbell,
  Scale,
  Ruler,
  Target,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"

const SECURITY_QUESTIONS = [
  "نام اولین حیوان خانگی شما چیست؟",
  "نام مدرسه ابتدایی شما چه بود؟",
  "شهر محل تولد مادر شما کدام است؟",
  "نام کتاب یا فیلم مورد علاقه شما چیست؟",
  "نام اولین مربی ورزشی شما چیست؟",
]

export default function ProfilePage() {
  const { data: session } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Profile Form States
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("")

  // Trainer specific
  const [bio, setBio] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Client specific
  const [age, setAge] = useState<number | "">("")
  const [weight, setWeight] = useState<number | "">("")
  const [height, setHeight] = useState<number | "">("")
  const [goals, setGoals] = useState("")
  const [assignedTrainer, setAssignedTrainer] = useState<any>(null)

  // Security Question
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0])
  const [securityAnswer, setSecurityAnswer] = useState("")

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setLoading(true)
    try {
      const res = await fetch("/api/user/profile")
      const data = await res.json()

      if (res.ok && data.user) {
        const u = data.user
        setName(u.name || "")
        setEmail(u.email || "")
        setPhone(u.phone || "")
        setRole(u.role || "")
        setBio(u.bio || "")
        setLogoUrl(u.logoUrl || "")
        setAge(u.age || "")
        setWeight(u.weight || "")
        setHeight(u.height || "")
        setGoals(u.goals || "")
        if (u.securityQuestion) {
          setSecurityQuestion(u.securityQuestion)
        }
        if (u.trainer) {
          setAssignedTrainer(u.trainer)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "logos")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "خطا در آپلود لوگو")
      setLogoUrl(data.url)
      toast.success("لوگو با موفقیت بارگذاری شد. جهت ثبت دائم، دکمه ذخیره تغییرات را بزنید.")
    } catch (err: any) {
      toast.error(err.message || "خطا در آپلود لوگو")
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          bio,
          logoUrl,
          age: age !== "" ? Number(age) : undefined,
          weight: weight !== "" ? Number(weight) : undefined,
          height: height !== "" ? Number(height) : undefined,
          goals,
          securityQuestion,
          securityAnswer: securityAnswer ? securityAnswer : undefined,
          currentPassword: currentPassword ? currentPassword : undefined,
          newPassword: newPassword ? newPassword : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "خطا در بروزرسانی اطلاعات." })
      } else {
        setMessage({ type: "success", text: data.message || "اطلاعات با موفقیت ذخیره شد." })
        setCurrentPassword("")
        setNewPassword("")
        setSecurityAnswer("")
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "خطا در ارتباط با سرور." })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold font-heading">{name || "پروفایل کاربر"}</h1>
              <p className="text-xs text-emerald-100">{email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-xs font-bold">
          <Dumbbell className="h-4 w-4" />
          <span>
            {role === "SUPER_ADMIN"
              ? "مدیر ارشد سیستم"
              : role === "TRAINER"
              ? "مربی تخصصی"
              : "شاگرد فیتنس"}
          </span>
        </div>
      </div>

      {/* Message Feedback Alert */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 transition-all ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        
        {/* Section 1: Basic Information */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" />
            اطلاعات پایه حساب کاربری
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">نام و نام خانوادگی</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">آدرس ایمیل (غیرقابل تغییر)</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3.5 py-2.5 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">شماره همراه</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09123456789"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {role === "TRAINER" && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">بیوگرافی و سوابق مربیگری</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="درباره سوابق، مدرک مربیگری و تخصص خود بنویسید..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-slate-900">
                        لوگوی اختصاصی مربی یا باشگاه (درج در سربرگ PDF برنامه‌ها)
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        این تصویر با وضوح بالا در سربرگ تمام فایل‌های PDF تمرین و تغذیه تولیدی قرار می‌گیرد.
                      </p>
                    </div>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors"
                      >
                        حذف لوگو
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-20 w-36 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-2 overflow-hidden shadow-2xs shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="لوگوی مربی" className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 text-center">
                          <ImageIcon className="h-6 w-6 stroke-1 mb-1 text-slate-300" />
                          <span className="text-[10px]">لوگوی پیش‌فرض</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-300 shadow-2xs transition-all">
                        {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <Upload className="h-4 w-4 text-emerald-600" />}
                        <span>{uploadingLogo ? "در حال آپلود..." : "انتخاب و آپلود تصویر لوگو"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-500">
                        فرمت‌های مجاز: PNG، JPG، WEBP یا SVG (پیشنهاد: تصویر با پس‌زمینه شفاف Transparent).
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Physical Metrics (If Client) */}
        {role === "CLIENT" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-600" />
              اطلاعات بدنی و تناسب اندام
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">سن (سال)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="25"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">وزن (کیلوگرم)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="75.5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">قد (سانتی‌متر)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="180"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اهداف ورزشی و توضیحات</label>
                <textarea
                  rows={3}
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="مثال: کاهش وزن، افزایش حجم عضلانی، آماده‌سازی برای مسابقات..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {assignedTrainer && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-5 w-5 text-emerald-700" />
                  <div>
                    <span className="font-bold text-emerald-900 block">مربی اختصاصی شما:</span>
                    <span className="text-slate-700 font-semibold">{assignedTrainer.name}</span> ({assignedTrainer.email})
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Security Question & Password Change */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            تنظیمات امنیت و بازیابی حساب
          </h2>

          <div className="space-y-4">
            {/* Security Question Update */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سوال امنیتی حساب شما</label>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 mb-2"
              >
                {SECURITY_QUESTIONS.map((q, idx) => (
                  <option key={idx} value={q}>
                    {q}
                  </option>
                ))}
              </select>

              <label className="block text-xs font-bold text-slate-700 mb-1">
                پاسخ سوال امنیتی (جهت تغییر، پاسخ جدید را وارد کنید)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="پاسخ جدید..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
                <HelpCircle className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Change Password Block */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-slate-500" />
                تغییر کلمه عبور (اختیاری)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">کلمه عبور فعلی</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-3.5 pl-9 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">کلمه عبور جدید</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-3.5 pl-9 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ذخیره تغییرات پروفایل"}
          </button>
        </div>
      </form>
    </div>
  )
}

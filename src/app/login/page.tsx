"use client"

import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import {
  Lock,
  Mail,
  User,
  Phone,
  HelpCircle,
  KeyRound,
  Loader2,
  Dumbbell,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react"

const SECURITY_QUESTIONS = [
  "نام اولین حیوان خانگی شما چیست؟",
  "نام مدرسه ابتدایی شما چه بود؟",
  "شهر محل تولد مادر شما کدام است؟",
  "نام کتاب یا فیلم مورد علاقه شما چیست؟",
  "نام اولین مربی ورزشی شما چیست؟",
]

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">("login")

  // Login State
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Register State
  const [regRole, setRegRole] = useState<"CLIENT" | "TRAINER">("CLIENT")
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [regSecurityQuestion, setRegSecurityQuestion] = useState(SECURITY_QUESTIONS[0])
  const [regSecurityAnswer, setRegSecurityAnswer] = useState("")
  const [selectedTrainerId, setSelectedTrainerId] = useState("")
  const [trainers, setTrainers] = useState<any[]>([])
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState("")
  const [regSuccess, setRegSuccess] = useState("")

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<1 | 2>(1)
  const [forgotEmail, setForgotEmail] = useState("")
  const [retrievedQuestion, setRetrievedQuestion] = useState("")
  const [forgotAnswer, setForgotAnswer] = useState("")
  const [forgotNewPassword, setForgotNewPassword] = useState("")
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState("")
  const [forgotSuccess, setForgotSuccess] = useState("")

  useEffect(() => {
    // Fetch public list of trainers for Client registration
    fetch("/api/trainers/public")
      .then((res) => res.json())
      .then((data) => {
        if (data.trainers) {
          setTrainers(data.trainers)
        }
      })
      .catch((err) => console.error(err))
  }, [])

  // Handle Login Submit
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError("")

    try {
      const res = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      })

      if (res?.error) {
        setLoginError("ایمیل یا کلمه عبور اشتباه است.")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err: any) {
      setLoginError("خطا در برقراری ارتباط با سرور.")
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle Registration Submit
  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    setRegLoading(true)
    setRegError("")
    setRegSuccess("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          role: regRole,
          securityQuestion: regSecurityQuestion,
          securityAnswer: regSecurityAnswer,
          trainerId: regRole === "CLIENT" ? selectedTrainerId : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setRegError(data.error || "خطا در ثبت نام.")
      } else {
        setRegSuccess("ثبت‌نام با موفقیت انجام شد! در حال انتقال به ورود...")
        setTimeout(async () => {
          // Auto login
          await signIn("credentials", {
            email: regEmail,
            password: regPassword,
            redirect: false,
          })
          router.push("/")
          router.refresh()
        }, 1500)
      }
    } catch (err: any) {
      setRegError("خطا در ارسال اطلاعات ثبت نام.")
    } finally {
      setRegLoading(false)
    }
  }

  // Handle Forgot Password - Step 1 (Get Security Question)
  async function handleFetchSecurityQuestion(e: React.FormEvent) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError("")
    setForgotSuccess("")

    try {
      const res = await fetch("/api/auth/security-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GET_QUESTION",
          email: forgotEmail,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setForgotError(data.error || "آدرس ایمیل وارد شده یافت نشد.")
      } else {
        setRetrievedQuestion(data.securityQuestion)
        setForgotStep(2)
      }
    } catch (err: any) {
      setForgotError("خطا در برقراری ارتباط با سرور.")
    } finally {
      setForgotLoading(false)
    }
  }

  // Handle Forgot Password - Step 2 (Validate & Reset)
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError("")
    setForgotSuccess("")

    try {
      const res = await fetch("/api/auth/security-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_PASSWORD",
          email: forgotEmail,
          securityAnswer: forgotAnswer,
          newPassword: forgotNewPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setForgotError(data.error || "خطا در تغییر کلمه عبور.")
      } else {
        setForgotSuccess("کلمه عبور شما با موفقیت تغییر یافت. می‌توانید وارد شوید.")
        setTimeout(() => {
          setLoginEmail(forgotEmail)
          setActiveTab("login")
          setForgotStep(1)
          setForgotEmail("")
          setForgotAnswer("")
          setForgotNewPassword("")
          setForgotSuccess("")
        }, 2000)
      }
    } catch (err: any) {
      setForgotError("خطا در برقراری ارتباط.")
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6 bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xl transition-all">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative mx-auto h-16 w-52">
            <Image
              src="/NutriTrain.png"
              alt="NutriTrain Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
            پلتفرم هوشمند فیتنس و تغذیه NutriTrain
          </h2>
          <p className="text-xs text-slate-500">
            مدیریت کامل برنامه‌های تمرینی، رژیم غذایی و شاگردان
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`py-2 rounded-xl transition-all ${
              activeTab === "login"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ورود به حساب
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={`py-2 rounded-xl transition-all ${
              activeTab === "register"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ثبت‌نام جدید
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("forgot")}
            className={`py-2 rounded-xl transition-all ${
              activeTab === "forgot"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            بازیابی کلمه عبور
          </button>
        </div>

        {/* ================= TAB 1: LOGIN ================= */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">آدرس ایمیل</label>
              <div className="relative">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="ایمیل خود را وارد کنید..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-colors"
                />
                <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">رمز عبور</label>
                <button
                  type="button"
                  onClick={() => setActiveTab("forgot")}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  رمز عبور را فراموش کرده‌اید؟
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-colors"
                />
                <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
            >
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ورود به حساب کاربری"}
            </button>
          </form>
        )}

        {/* ================= TAB 2: REGISTER ================= */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {regError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                {regError}
              </div>
            )}
            {regSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold text-center">
                {regSuccess}
              </div>
            )}

            {/* Role Selection Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع حساب کاربری</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole("CLIENT")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    regRole === "CLIENT"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  ثبت‌نام به‌عنوان شاگرد
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole("TRAINER")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    regRole === "TRAINER"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Dumbbell className="h-4 w-4" />
                  ثبت‌نام به‌عنوان مربی
                </button>
              </div>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام و نام خانوادگی</label>
                <div className="relative">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="علی محمدی"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                  <User className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">شماره تماس (اختیاری)</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                  <Phone className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">آدرس ایمیل</label>
                <div className="relative">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="example@domain.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                  <Mail className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">کلمه عبور</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                  <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* If registering as CLIENT, select Trainer option */}
            {regRole === "CLIENT" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مربی خود را انتخاب کنید (اختیاری)
                </label>
                <select
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">بدون مربی (اشتراک خودکار / عمومی)</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Security Question Selection & Answer */}
            <div className="space-y-2 border-t border-slate-200/60 pt-3">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                سوال امنیتی جهت بازیابی رمز عبور
              </label>

              <select
                value={regSecurityQuestion}
                onChange={(e) => setRegSecurityQuestion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                {SECURITY_QUESTIONS.map((q, idx) => (
                  <option key={idx} value={q}>
                    {q}
                  </option>
                ))}
              </select>

              <div className="relative">
                <input
                  type="text"
                  value={regSecurityAnswer}
                  onChange={(e) => setRegSecurityAnswer(e.target.value)}
                  required
                  placeholder="پاسخ سوال امنیتی را وارد کنید..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
                <HelpCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
            >
              {regLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تکمیل ثبت‌نام"}
            </button>
          </form>
        )}

        {/* ================= TAB 3: FORGOT PASSWORD ================= */}
        {activeTab === "forgot" && (
          <div className="space-y-4">
            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold text-center">
                {forgotSuccess}
              </div>
            )}

            {/* STEP 1: Enter Email to fetch Question */}
            {forgotStep === 1 && (
              <form onSubmit={handleFetchSecurityQuestion} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  آدرس ایمیل حساب کاربری خود را وارد کنید تا سوال امنیتی شما نمایش داده شود.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">آدرس ایمیل</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder="ایمیل حساب کاربری..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "دریافت سوال امنیتی"}
                  {!forgotLoading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            )}

            {/* STEP 2: Answer Question & Set New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <span className="font-bold text-emerald-800 block mb-0.5">سوال امنیتی حساب شما:</span>
                  <span className="text-slate-800 font-semibold">{retrievedQuestion}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">پاسخ سوال امنیتی</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={forgotAnswer}
                      onChange={(e) => setForgotAnswer(e.target.value)}
                      required
                      placeholder="پاسخ را وارد کنید..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                    <HelpCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">کلمه عبور جدید</label>
                  <div className="relative">
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                      placeholder="کلمه عبور جدید (حداقل ۶ کاراکتر)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                    <KeyRound className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showForgotNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-1/3 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  >
                    بازگشت
                  </button>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-2/3 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50"
                  >
                    {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تغییر کلمه عبور"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

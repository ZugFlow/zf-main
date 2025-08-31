"use client"

import React, { useState, useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { registerAction } from "../action"
import Link from "next/link"
import { FaSeedling, FaCheckCircle, FaLock, FaFacebookF, FaTwitter, FaGoogle, FaQuestionCircle, FaRocket } from "react-icons/fa"
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const pianoDetails = {
  starter: {
    nome: "Starter",
    mensile: "€12/mese",
    annuale: "€115,20/anno",
    prezzoMensile: 12,
    prezzoAnnuale: 115.2,
  },
  pro: {
    nome: "PRO",
    mensile: "€18/mese",
    annuale: "€172,80/anno",
    prezzoMensile: 18,
    prezzoAnnuale: 172.8,
  }
}

const planInfos = {
  starter: (
    <span>
      <span className="font-semibold underline underline-offset-2 text-orange-600">Starter</span> include:<br />
      <span className="block mt-1">
        <span className="font-medium text-gray-800">• Gestione appuntamenti base</span><br />
        <span className="font-medium text-gray-800">• Clienti illimitati</span><br />
        <span className="font-medium text-gray-800">• Reportistica essenziale</span>
      </span>
      <span className="block mt-2 text-gray-500">Ideale per piccoli saloni o chi inizia.</span>
    </span>
  ),
  pro: (
    <span>
      <span className="font-semibold underline underline-offset-2 text-orange-600">PRO</span> include:<br />
      <span className="block mt-1">
        <span className="font-medium text-gray-800">• Tutte le funzioni Starter</span><br />
        <span className="font-medium text-gray-800">• Statistiche avanzate</span><br />
        <span className="font-medium text-gray-800">• Gestione staff e servizi</span>
      </span>
      <span className="block mt-2 text-gray-500">Perfetto per saloni strutturati e team.</span>
    </span>
  )
}

const allPlanFeatures = {
  starter: [
    "Gestione appuntamenti base",
    "Clienti illimitati",
    "Reportistica essenziale",
    "Supporto base via email",
    "Accesso da dispositivi multipli",
    "Backup automatici",
  ],
  pro: [
    "Tutte le funzioni Starter",
    "Statistiche avanzate",
    "Gestione staff e servizi",
    "Gestione magazzino",
    "Supporto prioritario",
    "Integrazione con Google Calendar",
  ],
}

// GhostDayCalendar: simula esattamente il calendario day.tsx
function GhostTableLoading() {
  const members = [
    { name: "Mario", role: "Manager" },
    { name: "Anna", role: "Stylist" },
    { name: "Luca", role: "Colorist" },
    { name: "Sara", role: "Reception" }
  ];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00
  const hourHeight = 180; // Stesso hourHeight di day.tsx

  // Colori ghost, con viola come principale
  const ghostColors = [
    '#8b5cf6', // viola principale
    '#a78bfa', // viola chiaro
    '#7c3aed', // viola scuro
    '#3b82f6', // blu
    '#10b981', // verde
    '#f59e0b', // arancione
    '#ef4444', // rosso
    '#c026d3', // magenta/viola
  ];

  // Simula appuntamenti ghost più dettagliati
  const generateGhostAppointments = (memberIndex: number, hour: number) => {
    const random = Math.random();
    if (random > 0.5) {
      const duration = [30, 45, 60, 90][Math.floor(Math.random() * 4)];
      const color = ghostColors[(memberIndex + hour) % ghostColors.length];
      return {
        height: (duration / 60) * hourHeight * (0.7 + Math.random() * 0.2),
        color,
        opacity: 0.75 + Math.random() * 0.2,
        service: [
          "Taglio Donna",
          "Colore",
          "Piega",
          "Barba",
          "Trattamento",
          "Consulenza",
          "Shampoo",
          "Ritocco"
        ][Math.floor(Math.random() * 8)],
        client: [
          "Giulia B.",
          "Marco R.",
          "Elena S.",
          "Davide P.",
          "Francesca T.",
          "Lorenzo G.",
          "Martina L.",
          "Alessio V."
        ][Math.floor(Math.random() * 8)],
        note: Math.random() > 0.7 ? "Richiesta colore viola" : null
      };
    }
    return null;
  };
  return (
    <div className="w-full h-full max-w-5xl mx-auto bg-white overflow-hidden">
      {/* Navbar ghost - simula la navbar del calendario */}
      <div className="h-16 bg-gradient-to-r from-violet-100 via-white to-violet-50 border-b border-violet-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Date navigation ghost */}
          <div className="flex items-center bg-violet-50 rounded-lg p-2 gap-2">
            <div className="w-6 h-6 bg-violet-200 rounded animate-pulse" />
            <div className="w-32 h-4 bg-violet-200 rounded animate-pulse" />
            <div className="w-6 h-6 bg-violet-200 rounded animate-pulse" />
          </div>
          {/* Filter button ghost */}
          <div className="w-20 h-8 bg-violet-100 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          {/* Action buttons ghost */}
          <div className="w-8 h-8 bg-violet-100 rounded animate-pulse" />
          <div className="w-8 h-8 bg-violet-200 rounded animate-pulse" />
          <div className="w-8 h-8 bg-violet-300 rounded animate-pulse" />
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-hidden">
        {/* Table structure like day.tsx */}
        <table className="w-full border-collapse">
          {/* Header con membri */}
          <thead>
            <tr>
              <th className="w-16 p-2 border-r border-violet-100"></th>
              {members.map((member, i) => (
                <th key={i} className="p-4 border-r border-violet-100 bg-violet-50/50">
                  <div className="flex flex-col items-center">
                    {/* Avatar ghost */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-300 via-violet-100 to-white animate-pulse mb-2 border-2 border-violet-200 shadow-md" 
                         style={{
                           backgroundSize: '200% 100%',
                           animation: 'ghost-shimmer 1.5s ease-in-out infinite'
                         }} />
                    {/* Nome ghost */}
                    <div className="w-16 h-3 bg-violet-200 rounded animate-pulse mb-1" />
                    {/* Ruolo ghost */}
                    <div className="w-14 h-2 bg-violet-100 rounded animate-pulse mb-1" />
                    {/* Status ghost */}
                    <div className="w-12 h-2 bg-violet-50 rounded animate-pulse" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body con ore e celle */}
          <tbody>
            {hours.map((hour, i) => (
              <tr key={hour} className="border-b border-violet-50">
                {/* Colonna ore */}
                <td className="w-16 p-2 text-xs text-violet-400 border-r border-violet-100 bg-violet-50/30 text-center font-medium">
                  {hour.toString().padStart(2, '0')}:00
                </td>
                
                {/* Celle per ogni membro */}
                {members.map((member, memberIndex) => {
                  const ghostAppointment = generateGhostAppointments(memberIndex, hour);
                  return (
                    <td 
                      key={`${member.name}-${hour}`} 
                      className="relative border-r border-violet-100 p-1"
                      style={{ height: `${hourHeight}px` }}
                    >
                      {/* Background ghost effect */}
                      <div className="absolute inset-1 bg-gradient-to-br from-violet-50 via-white to-violet-100 rounded-lg animate-pulse"
                           style={{
                             backgroundSize: '200% 100%',
                             animation: 'ghost-shimmer 2s ease-in-out infinite',
                             animationDelay: `${memberIndex * 0.2}s`
                           }} />
                      {/* Ghost appointment card */}
                      {ghostAppointment && (
                        <div 
                          className="absolute left-2 right-2 rounded-xl shadow-lg border border-violet-200 animate-pulse"
                          style={{
                            top: `${10 + Math.random() * 40}px`,
                            height: `${ghostAppointment.height}px`,
                            backgroundColor: ghostAppointment.color,
                            opacity: ghostAppointment.opacity,
                            animation: 'ghost-appointment 2.5s ease-in-out infinite',
                            animationDelay: `${i * 0.3 + memberIndex * 0.1}s`,
                            boxShadow: '0 2px 8px 0 rgba(139,92,246,0.10)'
                          }}
                        >
                          {/* Contenuto ghost appointment dettagliato */}
                          <div className="p-2 h-full flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-white/60 border border-violet-200 animate-pulse" />
                                <div className="h-2 w-16 bg-white/40 rounded animate-pulse" />
                              </div>
                              <div className="h-2 bg-white/30 rounded animate-pulse w-3/4" />
                              <div className="h-2 bg-white/20 rounded animate-pulse w-1/2" />
                            </div>
                            <div className="mt-2 text-xs text-white/90 font-semibold flex flex-col gap-0.5">
                              <span className="truncate">
                                {ghostAppointment.service}
                              </span>
                              <span className="text-white/70 text-[11px]">
                                {ghostAppointment.client}
                              </span>
                              {ghostAppointment.note && (
                                <span className="text-violet-100 text-[10px] italic">{ghostAppointment.note}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CSS inline per le animazioni custom */}
      <style jsx>{`
        @keyframes ghost-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes ghost-appointment {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.04); opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}

const RegisterPage = () => {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTrialMode, setIsTrialMode] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter();
  const supabase = createClient();
  // Google Register Handler
  const handleGoogleRegister = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/crm/dashboard`,
        },
      });
      if (error) {
        setError(t('register.error.google'));
        setIsLoading(false);
      }
    } catch {
      setError(t('register.error.google'));
      setIsLoading(false);
    }
  };

  type PianoKey = keyof typeof pianoDetails
  const [selectedPlan, setSelectedPlan] = useState<PianoKey>("starter")
  const [selectedDurata, setSelectedDurata] = useState<"mensile" | "annuale">("mensile")

  // Real-time validation state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  // Correzioni comuni per provider email
  const emailCorrections: { [wrong: string]: string } = {
    "gnail.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gmaill.com": "gmail.com",
    "hotnail.com": "hotmail.com",
    "hotmai.com": "hotmail.com",
    "hotmal.com": "hotmail.com",
    "yaho.com": "yahoo.com",
    "yahho.com": "yahoo.com",
    "libero.it.com": "libero.it",
    "outlok.com": "outlook.com",
    "outllok.com": "outlook.com",
    "icloud.co": "icloud.com",
    "icloud.con": "icloud.com",
    "gmail.it": "gmail.com"
  }

  // Real-time validation handlers
  useEffect(() => {
    if (email.length === 0) {
      setEmailError(null)
    } else if (!emailRegex.test(email)) {
      setEmailError(t('register.error.emailInvalid'))
    } else {
      // Correzione provider
      const domain = email.split("@")[1]?.toLowerCase() || ""
      const wrong = Object.keys(emailCorrections).find(w => domain.endsWith(w))
      if (wrong) {
        const correctedEmail = email.replace(wrong, emailCorrections[wrong])
        setEmailError(
          t('register.error.emailCorrection').replace('{email}', correctedEmail)
        )
      } else {
        setEmailError(null)
      }
    }
  }, [email, t])

  useEffect(() => {
    if (confirmPassword.length === 0 && password.length === 0) {
      setPasswordError(null)
    } else if (password !== confirmPassword) {
      setPasswordError(t('register.error.passwordMismatch'))
    } else {
      setPasswordError(null)
    }
  }, [password, confirmPassword, t])

  useEffect(() => {
    const trial = localStorage.getItem("trial")
    if (trial === "true") {
      setIsTrialMode(true)
    }

    const saved = localStorage.getItem("piano_scelto")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.plan && typeof parsed.plan === "string" && parsed.plan.includes("_")) {
          const [piano, durata] = parsed.plan.split("_")
          if (
            ["starter", "pro", "business"].includes(piano) &&
            ["mensile", "annuale"].includes(durata)
          ) {
            setSelectedPlan(piano as PianoKey)
            setSelectedDurata(durata as "mensile" | "annuale")
          }
        }
      } catch (e) {
        console.error("Errore parsing piano_scelto:", e)
      }
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Final validation before submit
    if (!emailRegex.test(email)) {
      setEmailError(t('register.error.emailInvalid'))
      return
    }
    if (password !== confirmPassword) {
      setPasswordError(t('register.error.passwordMismatch'))
      return
    }

    setIsLoading(true)
    const formData = new FormData(event.currentTarget)
    const pianoCompleto = isTrialMode ? "trial" : `${selectedPlan}_${selectedDurata}`
    formData.set("plan", pianoCompleto)

    try {
      const response = await registerAction(formData)

      if (response?.error) {
        setError(response.error)
      } else if (response?.message) {
        setSuccessMessage(response.message)
        if (response.redirectTo) {
          router.push(response.redirectTo);
        }
      }
    } catch (err) {
      console.error("Errore:", err)
      setError(t('register.error.unexpected'))
    } finally {
      setIsLoading(false)
    }
  }

  const prezzoMensile = pianoDetails[selectedPlan].prezzoMensile
  const prezzoAnnuale = pianoDetails[selectedPlan].prezzoAnnuale

  // Tooltip state
  const [showTooltip, setShowTooltip] = useState<"starter" | "pro" | null>(null)
  const starterRef = useRef<HTMLButtonElement>(null)
  const proRef = useRef<HTMLButtonElement>(null)

  // Close tooltip on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        showTooltip === "starter" &&
        starterRef.current &&
        !starterRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(null)
      }
      if (
        showTooltip === "pro" &&
        proRef.current &&
        !proRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(null)
      }
    }
    if (showTooltip) {
      document.addEventListener("mousedown", handleClick)
    }
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showTooltip])

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center bg-gradient-to-br from-[#8b5cf6] via-violet-200 to-pink-200 p-0 register-root-container">
      <LanguageSwitcher />
      {/* Left: Static image with overlay and badge - Hidden on mobile, visible on tablet+ */}
      <div className="hidden lg:flex w-full lg:w-1/2 items-center justify-center relative overflow-hidden h-full px-6 xl:px-12">
        <Image
          src="/register_salone_photo.png"
          alt="Salone"
          width={700}
          height={900}
          className="object-cover max-h-[92vh] shadow-2xl border-2 border-violet-200 rounded-3xl"
          priority
        />
        {/* Badge/logo trasparente */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-8 lg:left-8 flex items-center gap-2 bg-white/70 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl shadow-md backdrop-blur-md">
          <Image src="/logo.png" alt="Logo" width={28} height={28} className="sm:w-9 sm:h-9 object-contain" />
          <span className="font-bold text-violet-700 text-sm sm:text-base lg:text-lg tracking-wide drop-shadow">ZugFlow</span>
        </div>
      </div>
      {/* Right: Register form - Responsive per tutti i dispositivi */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-2 min-h-full bg-gradient-to-br from-gray-100 via-orange-100 to-pink-200 animate-fade-in register-form-bg">
        <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto register-form-container">
          {/* Logo mobile - Visibile solo su mobile */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-4 sm:mb-6 logo-mobile-lower">
            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="object-contain drop-shadow"
              priority
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-wide drop-shadow">ZugFlow</h1>
          </div>
        <div className="register-card bg-white/95 rounded-2xl sm:rounded-3xl shadow-2xl w-full p-0 border border-gray-100 flex flex-col justify-center mx-auto animate-slide-up register-card-mobile-full" style={{marginTop: 0, marginBottom: '2rem'}}>
            <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-2 flex flex-col items-center mobile-header-content">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="hidden sm:block w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 object-contain drop-shadow"
                  priority
                />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{t('register.title')}</h3>
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-500 mb-2 text-center">{t('register.subtitle')}</p>
            </div>
            <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 overflow-y-auto flex-1 mobile-form-content">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-5" noValidate>
                {/* Credenziali Section */}
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xs font-semibold text-gray-700 flex items-center">
                    <FaLock className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-400" />
                    {t('register.credentials')}
                  </h3>
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{t('register.email')}</label>
                      <input
                        type="email"
                        name="email"
                        placeholder={t('register.email.placeholder')}
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full rounded-lg border px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 bg-white border-gray-200 transition-all shadow-sm mobile-input"
                      />
                      {emailError && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{emailError}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 mt-0 password-label-mobile">{t('register.password')}</label>
                      <input
                        type="password"
                        name="password"
                        placeholder={t('register.password.placeholder')}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full rounded-lg border px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 bg-white border-gray-200 transition-all shadow-sm mobile-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{t('register.confirmPassword')}</label>
                      <input
                        type="password"
                        name="confirm-password"
                        placeholder={t('register.confirmPassword.placeholder')}
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 bg-white border-gray-200 transition-all shadow-sm mobile-input"
                      />
                      {passwordError && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{passwordError}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-1 sm:pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !!emailError || !!passwordError}
                    className={`register-btn rounded-full px-4 sm:px-6 py-3 sm:py-4 text-white font-bold transition-all shadow-lg text-base sm:text-lg lg:text-base ${
                      isLoading || !!emailError || !!passwordError
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-violet-600 hover:bg-violet-700 hover:scale-105"
                    }`}
                  >
                    {isLoading ? t('register.submitting') : t('register.submit')}
                  </button>
                </div>
              </form>
              <div className="relative my-4 sm:my-6 lg:my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 sm:px-3 text-gray-500 font-semibold tracking-wide">{t('register.or')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2 sm:py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-semibold transition-all shadow-sm hover:scale-105 text-sm sm:text-base"
              >
                <FaGoogle className="text-red-500 text-sm sm:text-base" />
                {t('register.google')}
              </button>
              {/* Errors and Success */}
              {error && (
                <div className="mt-3 sm:mt-4 lg:mt-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                  </svg>
                  <p className="text-red-600 text-xs sm:text-sm font-semibold">{error}</p>
                </div>
              )}
              {successMessage && (
                <div className="mt-3 sm:mt-4 lg:mt-5 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-700 text-xs sm:text-sm font-semibold">{successMessage}</p>
                </div>
              )}
              <p className="text-center text-sm sm:text-base lg:text-sm text-gray-700 font-bold mt-4 sm:mt-6 lg:mt-7">
                {t('register.hasAccount')}
                <Link href="/login" className="text-violet-600 font-extrabold ml-2 text-base sm:text-lg lg:text-base hover:underline">
                  {t('register.login')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Animazioni Tailwind custom e mobile override */}
      <style jsx global>{`
        /* Spazio extra sopra password solo su mobile */
        @media (max-width: 640px) {
          .password-label-mobile {
            margin-top: 1.2rem !important;
          }
        }
        /* Importa Manrope da Google Fonts (font moderno, elegante, simile a Canva) */
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

        html, body, .register-root-container, .register-form-bg, .register-card, .register-form-container, .register-card-mobile-full, * {
          font-family: 'Manrope', Arial, Helvetica, sans-serif !important;
          letter-spacing: -0.01em;
        }
        
        /* Prevenire scroll orizzontale */
        html, body {
          overflow-x: hidden !important;
        }
        
        .register-root-container {
          overflow-x: hidden !important;
        }
        
        /* Assicura che il body permetta lo scroll su mobile */
        @media (max-width: 640px) {
          html, body {
            overflow-x: hidden !important;
            overflow-y: auto !important;
            height: auto !important;
            min-height: 100vh !important;
            position: static !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .register-root-container {
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .register-form-bg {
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .register-form-container {
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .register-card-mobile-full {
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            -webkit-overflow-scrolling: touch !important;
          }
          /* Forza lo scroll su tutti gli elementi */
          * {
            -webkit-overflow-scrolling: touch !important;
          }
        }

        /* Stile Canva mobile */
        @media (max-width: 640px) {
          .register-root-container {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
          }
          .register-card-mobile-full {
            background: rgba(255,255,255,0.98) !important;
            box-shadow: 0 8px 32px 0 rgba(80,80,120,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.04);
            border-radius: 2.2rem !important;
            border: none !important;
            padding: 1.5rem 0.5rem 2.5rem 0.5rem !important;
            margin: 0.5rem !important;
          }
          .logo-mobile-lower h1 {
            font-family: 'Manrope', Arial, Helvetica, sans-serif !important;
            font-weight: 800 !important;
            font-size: 2.6rem !important;
            letter-spacing: -0.02em;
            color: #222 !important;
            text-shadow: 0 2px 8px rgba(80,80,120,0.08);
          }
          .register-btn {
            background: linear-gradient(90deg, #7f5af0 0%, #2cb67d 100%) !important;
            font-family: 'Manrope', Arial, Helvetica, sans-serif !important;
            font-weight: 700 !important;
            font-size: 1.3rem !important;
            letter-spacing: 0.01em;
            border: none !important;
            box-shadow: 0 8px 32px 0 rgba(127,90,240,0.18), 0 1.5px 8px 0 rgba(44,182,125,0.10);
            color: #fff !important;
            text-shadow: 0 1px 4px rgba(80,80,120,0.08);
          }
          .register-card input, .register-card label {
            font-family: 'Manrope', Arial, Helvetica, sans-serif !important;
          }
          .register-card input {
            background: #f8fafc !important;
            border-radius: 1.1rem !important;
            border: 1.5px solid #e0e7ef !important;
            font-size: 1.13rem !important;
            padding-top: 1.1rem !important;
            padding-bottom: 1.1rem !important;
            color: #222 !important;
            box-shadow: 0 2px 8px 0 rgba(80,80,120,0.04);
            transition: border 0.2s, box-shadow 0.2s;
          }
          .register-card input:focus {
            border-color: #7f5af0 !important;
            box-shadow: 0 0 0 2px #7f5af033;
          }
          .register-card label {
            font-weight: 600 !important;
            color: #222 !important;
            font-size: 1.01rem !important;
            margin-bottom: 0.2rem !important;
          }
          .register-card .text-gray-500 {
            color: #6c6f7b !important;
            font-size: 1.08rem !important;
            font-weight: 500 !important;
          }
        }

        /* Stile Canva desktop - NO SCROLL VERTICALE */
        @media (min-width: 641px) {
          html, body {
            overflow-y: hidden !important;
            height: 100vh !important;
            max-height: 100vh !important;
          }
          .register-root-container {
            background: linear-gradient(120deg, #f1f5f9 0%, #d1d5db 100%) !important;
            align-items: center !important;
            justify-content: center !important;
            height: 100vh !important;
            max-height: 100vh !important;
            overflow: hidden !important;
          }
          .register-form-bg {
            background: linear-gradient(120deg, #f9fafb 60%, #e5e7eb 100%) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 100vh !important;
            max-height: 100vh !important;
            overflow: hidden !important;
          }
          .register-form-container {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 100vh !important;
            max-height: 100vh !important;
            overflow: hidden !important;
          }
          .register-card {
            background: rgba(255,255,255,0.98) !important;
            box-shadow: 0 8px 32px 0 rgba(80,80,120,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.04);
            border-radius: 2.5rem !important;
            border: none !important;
            padding: 2rem 2.5rem 2rem 2.5rem !important;
            margin: 0 auto !important;
            max-height: 85vh !important;
            height: auto !important;
            overflow: hidden !important;
          }
          .register-card input, .register-card label {
            font-family: 'Manrope', Arial, Helvetica, sans-serif !important;
          }
          .register-card input {
            background: #f8fafc !important;
            border-radius: 1.1rem !important;
            border: 1.5px solid #e0e7ef !important;
            font-size: 1.05rem !important;
            padding-top: 0.85rem !important;
            padding-bottom: 0.85rem !important;
            color: #222 !important;
            box-shadow: 0 2px 8px 0 rgba(80,80,120,0.04);
            transition: border 0.2s, box-shadow 0.2s;
          }
          .register-card input:focus {
            border-color: #7f5af0 !important;
            box-shadow: 0 0 0 2px #7f5af033;
          }
          .register-card label {
            font-weight: 600 !important;
            color: #222 !important;
            font-size: 1.01rem !important;
            margin-bottom: 0.2rem !important;
          }
          .register-card .text-gray-500 {
            color: #6c6f7b !important;
            font-size: 1.08rem !important;
            font-weight: 500 !important;
          }
          .register-btn {
            background: linear-gradient(90deg, #7f5af0 0%, #2cb67d 100%) !important;
            font-family: 'Manrope', Arial, Helvetica, sans-serif !important;
            font-weight: 700 !important;
            font-size: 1.1rem !important;
            letter-spacing: 0.01em;
            border: none !important;
            box-shadow: 0 8px 32px 0 rgba(127,90,240,0.18), 0 1.5px 8px 0 rgba(44,182,125,0.10);
            color: #fff !important;
            text-shadow: 0 1px 4px rgba(80,80,120,0.08);
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            max-width: 100%;
            padding-top: 0.85rem !important;
            padding-bottom: 0.85rem !important;
            border-radius: 2rem !important;
          }
          /* Compatta spazi form per desktop - no scroll */
          .register-card form .space-y-3,
          .register-card form .space-y-4,
          .register-card form .space-y-5 {
            gap: 0.75rem !important;
          }
          .register-card .space-y-2,
          .register-card .space-y-3 {
            gap: 0.5rem !important;
          }
        }
                  /* Abbassa logo e ZugFlow su mobile */
          @media (max-width: 640px) {
            .logo-mobile-lower {
              margin-top: 1rem !important;
              margin-bottom: 1rem !important;
              position: relative !important;
              z-index: 10 !important;
            }
            .logo-mobile-lower img {
              width: 48px !important;
              height: 48px !important;
            }
            .logo-mobile-lower h1 {
              font-size: 2rem !important;
            }
          }
                  /* Bottone Registrati mobile: grande, bombato, scorre con il contenuto */
          @media (max-width: 640px) {
            .register-btn {
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              border-radius: 9999px !important;
              font-size: 1.1rem !important;
              padding-top: 0.9rem !important;
              padding-bottom: 0.9rem !important;
              margin: 0.5rem 0 !important;
              box-shadow: 0 8px 32px 0 rgba(139,92,246,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.08);
              display: block;
              background: linear-gradient(90deg, #7f5af0 0%, #2cb67d 100%) !important;
            }
          }
        /* Mobile: struttura completamente semplice */
        @media (max-width: 640px) {
          .register-root-container {
            background: #f3f4f6 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 100vh !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            position: relative !important;
            padding: 1rem 0.5rem !important;
          }
          .register-form-bg {
            background: #f3f4f6 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
            position: relative !important;
            padding: 1rem 0.5rem 2rem 0.5rem !important;
            flex: 1 !important;
          }
          .register-form-container {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
            position: relative !important;
            margin: 0 !important;
            padding: 0 0.5rem !important;
          }
          .register-card-mobile-full {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
            position: relative !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .mobile-header-content {
            display: block !important;
            padding: 0.5rem 0 1rem 0 !important;
            margin: 0 !important;
          }
          .mobile-form-content {
            display: block !important;
            padding: 0.5rem 0 2rem 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.4,0,0.2,1);
        }
        .animate-slide-up {
          animation: slideUp 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive breakpoints personalizzati */
        @media (max-width: 640px) {
          .animate-slide-up {
            animation: slideUpMobile 0.7s cubic-bezier(0.4,0,0.2,1);
          }
          @keyframes slideUpMobile {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .register-form-container {
            max-width: 100vw !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            display: block !important;
            position: static !important;
          }
          .register-card {
            background: rgba(255,255,255,0.85) !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0.5rem 0.5rem 1rem 0.5rem !important;
            max-width: 100vw !important;
            width: 100vw !important;
            margin: 0 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            display: block !important;
            position: static !important;
          }
          /* Input più grandi su mobile */
          .mobile-input {
            font-size: 0.95rem !important;
            padding-top: 0.7rem !important;
            padding-bottom: 0.7rem !important;
          }
          /* Contenuto del form adattato per mobile con scroll */
          .mobile-form-content {
            padding-bottom: 2rem !important;
            display: block !important;
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }
        }

        /* Tablet ottimizzazione */
        @media (min-width: 641px) and (max-width: 1023px) {
          .tablet-optimized {
            max-width: 420px;
          }
        }

        /* Mobile landscape */
        @media (max-height: 500px) and (orientation: landscape) {
          .register-container {
            max-height: 90vh;
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  );
}

export default RegisterPage
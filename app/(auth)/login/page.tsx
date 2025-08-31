
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./action";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { FaLock, FaGoogle } from "react-icons/fa";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const LoginPage = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingBanner, setShowLoadingBanner] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    try {
      const response = await loginAction(formData);
      if (response?.error) setError(response.error);
      else if (typeof response?.redirectTo === "string") {
        setShowLoadingBanner(true);
        setTimeout(() => {
          router.push(response.redirectTo!);
        }, 1200);
      }
    } catch {
      setError(t('login.error.unexpected'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
        setError(t('login.error.google'));
        setIsLoading(false);
      }
    } catch {
      setError(t('login.error.google'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-stretch bg-white p-0 login-root-container">
      <LanguageSwitcher />

      
      {/* Right: Login form - Completamente adattivo alle dimensioni */}
      <div className="w-full flex items-center justify-center p-2 sm:p-6 lg:p-8 min-h-full bg-white animate-fade-in login-form-bg">
        <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto login-form-container">
          {/* Logo mobile - Visibile solo su mobile */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-4 logo-mobile-lower">
            <Image
              src="/logo.png"
              alt="Logo"
              width={28}
              height={28}
              className="object-contain drop-shadow"
              priority
            />
            <h1 className="text-xl font-bold text-black tracking-wide drop-shadow">ZugFlow</h1>
          </div>
          
                      <div className="login-card bg-white/95 rounded-2xl sm:rounded-3xl shadow-2xl w-full p-0 border border-gray-100 flex flex-col justify-center mx-auto animate-slide-up login-card-mobile-full">
            <div className="px-4 sm:px-6 lg:px-8 pt-3 sm:pt-8 pb-1 flex flex-col items-center">
              <div className="flex items-center gap-2 sm:gap-3 mb-1">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={24}
                  height={24}
                  className="hidden sm:block w-6 h-6 sm:w-9 sm:h-9 lg:w-10 lg:h-10 object-contain drop-shadow"
                  priority
                />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{t('login.title')}</h3>
              </div>
              <p className="text-sm sm:text-lg text-gray-500 mb-1 text-center">{t('login.subtitle')}</p>
            </div>
            <div className="px-4 sm:px-6 lg:px-8 pb-3 sm:pb-8 overflow-y-auto flex-1 mobile-form-content">
              <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-5" noValidate>
                {/* Credenziali Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-700 flex items-center">
                    <FaLock className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-400" />
                    {t('login.credentials')}
                  </h3>
          <div className="space-y-2 sm:space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('login.email')}</label>
              <input
                type="email"
                name="email"
                placeholder={t('login.email.placeholder')}
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 bg-white border-gray-200 transition-all shadow-sm mobile-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('login.password')}</label>
              <input
                type="password"
                name="password"
                placeholder={t('login.password.placeholder')}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 bg-white border-gray-200 transition-all shadow-sm mobile-input"
              />
            </div>
          </div>
                </div>

                {/* Footer Actions */}
                {/* Bottone Accedi mobile: compatto */}
                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`login-accedi-btn rounded-full px-6 py-3 text-white font-bold transition-all shadow-lg text-base sm:text-base ${
                      isLoading
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-violet-600 hover:bg-violet-700 hover:scale-105"
                    }`}
                  >
                    {isLoading ? t('login.submitting') : t('login.submit')}
                  </button>
                </div>
              </form>
              <div className="relative my-3 sm:my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 sm:px-3 text-gray-500 font-semibold tracking-wide">{t('login.or')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2 sm:py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-semibold transition-all shadow-sm hover:scale-105 text-sm sm:text-base google-btn-mobile"
              >
                <FaGoogle className="text-red-500 text-sm sm:text-base" />
                {t('login.google')}
              </button>
              {/* Errors and Success */}
              {/* Loading Banner - Nuovo design elegante */}
              {showLoadingBanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                  <div className="loading-banner bg-white rounded-2xl p-8 mx-4 max-w-sm w-full shadow-2xl border border-gray-100 animate-slide-up-banner">
                    <div className="flex flex-col items-center text-center space-y-4">
                      {/* Spinner elegante */}
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-violet-600"></div>
                        <div className="absolute inset-2 w-12 h-12 border-4 border-transparent rounded-full animate-spin border-t-green-500" style={{animationDirection: 'reverse', animationDuration: '0.8s'}}></div>
                      </div>
                      
                      {/* Testo con gradiente */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-green-600 bg-clip-text text-transparent">
                          {t('login.accessSuccess')}
                        </h3>
                        <p className="text-gray-600 font-medium">
                          {t('login.redirecting')}
                        </p>
                      </div>
                      
                      {/* Barra di progresso */}
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-600 to-green-600 rounded-full animate-progress"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {error && (
                <div className="mt-2 sm:mt-5 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                  </svg>
                  <p className="text-red-600 text-xs sm:text-sm font-semibold">{error}</p>
                </div>
              )}
              {/* Success Message - Removed as per new_code */}
              <p className="text-center text-sm sm:text-sm text-gray-700 font-bold mt-4 sm:mt-7">
                {t('login.noAccount')}
                <Link href="/register" className="text-violet-600 font-extrabold ml-2 text-lg sm:text-base hover:underline">
                  {t('login.register')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Animazioni Tailwind custom e mobile override */}
      <style jsx global>{`
        /* Importa Manrope da Google Fonts (font moderno, elegante, simile a Canva) */
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

        html, body, .login-root-container, .login-form-bg, .login-card, .login-form-container, .login-card-mobile-full, * {
          font-family: 'Manrope', Arial, Helvetica, sans-serif !important;
          letter-spacing: -0.01em;
        }

        /* Animazioni per il banner di caricamento */
        .animate-slide-up-banner {
          animation: slideUpBanner 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        
        @keyframes slideUpBanner {
          from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        .animate-progress {
          animation: progress 1.2s ease-in-out infinite;
        }
        
        @keyframes progress {
          0% { 
            width: 0%; 
            transform: translateX(-100%); 
          }
          50% { 
            width: 100%; 
            transform: translateX(0%); 
          }
          100% { 
            width: 100%; 
            transform: translateX(100%); 
          }
        }
        
        /* Stili per il banner di caricamento */
        .loading-banner {
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 60px 0 rgba(0, 0, 0, 0.1), 0 8px 25px 0 rgba(0, 0, 0, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.8) !important;
        }
        
        @media (max-width: 640px) {
          .loading-banner {
            margin: 1rem !important;
            padding: 2rem 1.5rem !important;
            border-radius: 1.5rem !important;
          }
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
            width: 100% !important;
            max-width: 100% !important;
          }
          .login-root-container {
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .login-form-bg {
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .login-form-container {
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .login-card-mobile-full {
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
          .login-root-container {
            background: #ffffff !important;
          }
          .login-card-mobile-full {
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
          .login-accedi-btn {
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
          .login-card input, .login-card label {
            font-family: 'Manrope', Arial, Helvetica, sans-serif !important;
          }
          .login-card input {
            background: #f8fafc !important;
            border-radius: 0.8rem !important;
            border: 1.5px solid #e0e7ef !important;
            font-size: 4vw !important;
            min-font-size: 0.9rem !important;
            max-font-size: 1.1rem !important;
            padding-top: 1.5vh !important;
            padding-bottom: 1.5vh !important;
            padding-left: 3vw !important;
            padding-right: 3vw !important;
            color: #222 !important;
            box-shadow: 0 2px 8px 0 rgba(80,80,120,0.04);
            transition: border 0.2s, box-shadow 0.2s;
          }
          .login-card input:focus {
            border-color: #7f5af0 !important;
            box-shadow: 0 0 0 2px #7f5af033;
          }
          .login-card label {
            font-weight: 600 !important;
            color: #222 !important;
            font-size: 1.01rem !important;
            margin-bottom: 0.2rem !important;
          }
          .login-card .text-gray-500 {
            color: #6c6f7b !important;
            font-size: 1.08rem !important;
            font-weight: 500 !important;
          }
        }

        /* Stile Canva desktop */
        @media (min-width: 641px) {
          .login-root-container {
            background: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 100vh !important;
          }
          .login-form-bg {
            background: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 100vh !important;
            width: 100% !important;
          }
          .login-form-container {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            max-width: 500px !important;
          }
          .login-card {
            background: rgba(255,255,255,0.98) !important;
            box-shadow: 0 8px 32px 0 rgba(80,80,120,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.04);
            border-radius: 2.5rem !important;
            border: none !important;
            padding: 2.5rem 2.5rem 2.5rem 2.5rem !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .login-card input, .login-card label {
            font-family: 'Manrope', Arial, Helvetica, sans-serif !important;
          }
          .login-card input {
            background: #f8fafc !important;
            border-radius: 1.1rem !important;
            border: 1.5px solid #e0e7ef !important;
            font-size: 1.08rem !important;
            padding-top: 1.05rem !important;
            padding-bottom: 1.05rem !important;
            color: #222 !important;
            box-shadow: 0 2px 8px 0 rgba(80,80,120,0.04);
            transition: border 0.2s, box-shadow 0.2s;
          }
          .login-card input:focus {
            border-color: #7f5af0 !important;
            box-shadow: 0 0 0 2px #7f5af033;
          }
          .login-card label {
            font-weight: 600 !important;
            color: #222 !important;
            font-size: 1.01rem !important;
            margin-bottom: 0.2rem !important;
          }
          .login-card .text-gray-500 {
            color: #6c6f7b !important;
            font-size: 1.08rem !important;
            font-weight: 500 !important;
          }
          .login-accedi-btn {
            background: linear-gradient(90deg, #7f5af0 0%, #2cb67d 100%) !important;
            font-family: 'Manrope', Arial, Helvetica, sans-serif !important;
            font-weight: 700 !important;
            font-size: 1.15rem !important;
            letter-spacing: 0.01em;
            border: none !important;
            box-shadow: 0 8px 32px 0 rgba(127,90,240,0.18), 0 1.5px 8px 0 rgba(44,182,125,0.10);
            color: #fff !important;
            text-shadow: 0 1px 4px rgba(80,80,120,0.08);
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            max-width: 100%;
            padding-top: 1.1rem !important;
            padding-bottom: 1.1rem !important;
            border-radius: 2rem !important;
          }
        }
        /* Logo adattivo alle dimensioni */
        @media (max-width: 640px) {
          .logo-mobile-lower {
            margin-top: 1vh !important;
            margin-bottom: 1vh !important;
            position: relative !important;
            z-index: 10 !important;
          }
          .logo-mobile-lower img {
            width: 8vw !important;
            height: 8vw !important;
            min-width: 28px !important;
            min-height: 28px !important;
            max-width: 40px !important;
            max-height: 40px !important;
          }
          .logo-mobile-lower h1 {
            font-size: 6vw !important;
            min-font-size: 1.2rem !important;
            max-font-size: 1.8rem !important;
          }
        }
        
        /* Dispositivi mobili molto piccoli */
        @media (max-width: 360px) {
          .logo-mobile-lower img {
            width: 24px !important;
            height: 24px !important;
          }
          .logo-mobile-lower h1 {
            font-size: 1.2rem !important;
          }
        }
        
        /* Dispositivi mobili grandi */
        @media (min-width: 481px) and (max-width: 640px) {
          .logo-mobile-lower img {
            width: 36px !important;
            height: 36px !important;
          }
          .logo-mobile-lower h1 {
            font-size: 1.6rem !important;
          }
        }
        /* Bottone Accedi adattivo */
        @media (max-width: 640px) {
          .login-accedi-btn {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 9999px !important;
            font-size: 4.5vw !important;
            min-font-size: 1rem !important;
            max-font-size: 1.3rem !important;
            padding-top: 2vh !important;
            padding-bottom: 2vh !important;
            margin: 1vh 0 !important;
            box-shadow: 0 8px 32px 0 rgba(139,92,246,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.08);
            display: block;
            background: linear-gradient(90deg, #7f5af0 0%, #2cb67d 100%) !important;
          }
        }
        
        /* Bottone per dispositivi piccoli */
        @media (max-width: 360px) {
          .login-accedi-btn {
            font-size: 0.95rem !important;
            padding-top: 0.9rem !important;
            padding-bottom: 0.9rem !important;
          }
        }
        
        /* Bottone per dispositivi medi */
        @media (min-width: 361px) and (max-width: 480px) {
          .login-accedi-btn {
            font-size: 1.1rem !important;
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
          }
        }
        
        /* Bottone per dispositivi grandi */
        @media (min-width: 481px) and (max-width: 640px) {
          .login-accedi-btn {
            font-size: 1.2rem !important;
            padding-top: 1.1rem !important;
            padding-bottom: 1.1rem !important;
          }
        }
        /* Mobile: struttura adattiva alle dimensioni */
        @media (max-width: 640px) {
          .login-root-container {
            background: #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            height: 100vh !important;
            min-height: 100vh !important;
            max-height: 100vh !important;
            overflow-x: hidden !important;
            overflow-y: hidden !important;
            position: static !important;
            width: 100vw !important;
            max-width: 100vw !important;
          }
          .login-form-bg {
            background: #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            height: 100% !important;
            min-height: 100% !important;
            max-height: 100% !important;
            overflow-x: hidden !important;
            overflow-y: hidden !important;
            position: static !important;
            padding: 1vh 2vw !important;
            flex: 1 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .login-form-container {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            height: 100% !important;
            min-height: 100% !important;
            max-height: 100% !important;
            overflow-x: hidden !important;
            overflow-y: hidden !important;
            position: static !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            flex: 1 !important;
          }
          .login-card-mobile-full {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            height: auto !important;
            min-height: 90vh !important;
            max-height: 95vh !important;
            overflow-x: hidden !important;
            overflow-y: hidden !important;
            position: static !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 2vh 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            flex: 1 !important;
          }
          .mobile-form-content {
            display: block !important;
            padding: 0.25rem 0 0.25rem 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            flex: 1 !important;
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
          .login-form-container {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
          }
          .login-card {
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0.5rem 0.5rem 1.5rem 0.5rem !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            height: auto !important;
            min-height: auto !important;
            overflow-y: visible !important;
          }
          /* Input adattivi alle dimensioni */
          .mobile-input {
            font-size: 4vw !important;
            padding-top: 1.5vh !important;
            padding-bottom: 1.5vh !important;
            padding-left: 3vw !important;
            padding-right: 3vw !important;
          }
        }
        
        /* Input per dispositivi piccoli */
        @media (max-width: 360px) {
          .login-card input, .mobile-input {
            font-size: 0.9rem !important;
            padding-top: 0.8rem !important;
            padding-bottom: 0.8rem !important;
            padding-left: 0.8rem !important;
            padding-right: 0.8rem !important;
          }
        }
        
        /* Input per dispositivi medi */
        @media (min-width: 361px) and (max-width: 480px) {
          .login-card input, .mobile-input {
            font-size: 1rem !important;
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
        
        /* Input per dispositivi grandi */
        @media (min-width: 481px) and (max-width: 640px) {
          .login-card input, .mobile-input {
            font-size: 1.1rem !important;
            padding-top: 1.1rem !important;
            padding-bottom: 1.1rem !important;
            padding-left: 1.2rem !important;
            padding-right: 1.2rem !important;
          }
          /* Contenuto del form scrollabile su mobile */
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

        /* Testi adattivi alle dimensioni */
        @media (max-width: 640px) {
          .login-card label {
            font-size: 3.5vw !important;
            min-font-size: 0.8rem !important;
            max-font-size: 1rem !important;
          }
          .login-card .text-gray-500 {
            font-size: 3.8vw !important;
            min-font-size: 0.9rem !important;
            max-font-size: 1.1rem !important;
          }
          .login-card h3 {
            font-size: 5.5vw !important;
            min-font-size: 1.1rem !important;
            max-font-size: 1.5rem !important;
          }
        }
        
        /* Mobile landscape - layout più compatto */
        @media (max-height: 500px) and (orientation: landscape) and (max-width: 640px) {
          .login-root-container {
            height: 100vh !important;
          }
          .login-card-mobile-full {
            min-height: 95vh !important;
            padding: 0.5vh 0 !important;
          }
          .logo-mobile-lower {
            margin-top: 0.5vh !important;
            margin-bottom: 0.5vh !important;
          }
          .logo-mobile-lower h1 {
            font-size: 1.1rem !important;
          }
          .logo-mobile-lower img {
            width: 24px !important;
            height: 24px !important;
          }
          .mobile-form-content {
            padding: 0.2vh 0 !important;
          }
          .login-card input, .mobile-input {
            padding-top: 0.6rem !important;
            padding-bottom: 0.6rem !important;
            font-size: 0.9rem !important;
          }
          .login-accedi-btn {
            padding-top: 0.7rem !important;
            padding-bottom: 0.7rem !important;
            font-size: 0.95rem !important;
          }
        }
        
        /* Schermi molto piccoli (altezza) */
        @media (max-height: 600px) and (max-width: 640px) {
          .login-card-mobile-full {
            min-height: 92vh !important;
            padding: 1vh 0 !important;
          }
          .mobile-form-content {
            padding: 0.5vh 0 !important;
          }
        }
        
        /* Supporto per notch e safe areas */
        @media (max-width: 640px) {
          .login-root-container {
            padding-top: env(safe-area-inset-top) !important;
            padding-bottom: env(safe-area-inset-bottom) !important;
            padding-left: env(safe-area-inset-left) !important;
            padding-right: env(safe-area-inset-right) !important;
          }
        }
        
        /* Viewport molto stretti */
        @media (max-width: 320px) {
          .login-form-bg {
            padding: 0.5vh 1vw !important;
          }
          .logo-mobile-lower img {
            width: 20px !important;
            height: 20px !important;
          }
          .logo-mobile-lower h1 {
            font-size: 1rem !important;
          }
          .login-card input, .mobile-input {
            font-size: 0.85rem !important;
            padding: 0.7rem !important;
          }
                     .login-accedi-btn {
             font-size: 0.9rem !important;
             padding: 0.8rem !important;
           }
           .google-btn-mobile {
             font-size: 0.85rem !important;
             padding: 0.7rem !important;
           }
         }
         
         /* Bottone Google adattivo */
         @media (max-width: 640px) {
           .google-btn-mobile {
             font-size: 3.8vw !important;
             min-font-size: 0.9rem !important;
             max-font-size: 1.1rem !important;
             padding: 1.5vh 3vw !important;
           }
         }
      `}</style>
    </div>
  );
};

export default LoginPage;

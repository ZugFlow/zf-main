"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'it' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys for authentication
type TranslationKey = 
  // Login page
  | 'login.title' | 'login.subtitle' | 'login.credentials' | 'login.email' | 'login.email.placeholder'
  | 'login.password' | 'login.password.placeholder' | 'login.submit' | 'login.submitting' | 'login.or'
  | 'login.google' | 'login.noAccount' | 'login.register' | 'login.accessSuccess' | 'login.redirecting'
  | 'login.error.unexpected' | 'login.error.google' | 'login.error.invalidCredentials'
  // Register page
  | 'register.title' | 'register.subtitle' | 'register.credentials' | 'register.email' | 'register.email.placeholder'
  | 'register.password' | 'register.password.placeholder' | 'register.confirmPassword' | 'register.confirmPassword.placeholder'
  | 'register.submit' | 'register.submitting' | 'register.or' | 'register.google' | 'register.hasAccount'
  | 'register.login' | 'register.error.unexpected' | 'register.error.google' | 'register.error.emailInvalid'
  | 'register.error.emailCorrection' | 'register.error.passwordMismatch' | 'register.success'
  // Common
  | 'common.loading' | 'common.error' | 'common.success' | 'common.cancel' | 'common.confirm'
  | 'common.save' | 'common.edit' | 'common.delete' | 'common.close' | 'common.back'
  | 'common.next' | 'common.previous' | 'common.search' | 'common.filter' | 'common.sort'
  | 'common.refresh' | 'common.export' | 'common.import' | 'common.download' | 'common.upload'
  | 'common.view' | 'common.details' | 'common.summary' | 'common.overview' | 'common.settings'
  | 'common.profile' | 'common.logout' | 'common.language' | 'common.italian' | 'common.english';

type Translations = Record<Language, Record<TranslationKey, string>>;

const translations: Translations = {
  it: {
    // Login page
    'login.title': 'Accedi',
    'login.subtitle': 'Accedi al tuo account per continuare',
    'login.credentials': 'Credenziali',
    'login.email': 'Email',
    'login.email.placeholder': 'mario.rossi@esempio.it',
    'login.password': 'Password',
    'login.password.placeholder': '············',
    'login.submit': 'Accedi',
    'login.submitting': 'Accesso...',
    'login.or': 'oppure',
    'login.google': 'Accedi con Google',
    'login.noAccount': 'Non hai ancora un account?',
    'login.register': 'Registrati',
    'login.accessSuccess': 'Accesso effettuato!',
    'login.redirecting': 'Ti stiamo portando al gestionale...',
    'login.error.unexpected': 'Errore imprevisto. Riprova.',
    'login.error.google': 'Errore accesso con Google. Riprova.',
    'login.error.invalidCredentials': 'Credenziali non valide. Riprova.',
    
    // Register page
    'register.title': 'Registrati',
    'register.subtitle': 'Crea il tuo account per iniziare',
    'register.credentials': 'Credenziali',
    'register.email': 'Email',
    'register.email.placeholder': 'mario.rossi@esempio.it',
    'register.password': 'Password',
    'register.password.placeholder': '············',
    'register.confirmPassword': 'Conferma Password',
    'register.confirmPassword.placeholder': 'Conferma Password',
    'register.submit': 'Registrati',
    'register.submitting': 'Registrazione...',
    'register.or': 'oppure',
    'register.google': 'Registrati con Google',
    'register.hasAccount': 'Hai già un account?',
    'register.login': 'Accedi',
    'register.error.unexpected': 'Si è verificato un errore. Riprova.',
    'register.error.google': 'Errore accesso con Google. Riprova.',
    'register.error.emailInvalid': 'Inserisci un\'email valida',
    'register.error.emailCorrection': 'Forse intendevi {email}?',
    'register.error.passwordMismatch': 'Le password non coincidono',
    'register.success': 'Registrazione completata con successo!',
    
    // Common
    'common.loading': 'Caricamento...',
    'common.error': 'Errore',
    'common.success': 'Successo',
    'common.cancel': 'Annulla',
    'common.confirm': 'Conferma',
    'common.save': 'Salva',
    'common.edit': 'Modifica',
    'common.delete': 'Elimina',
    'common.close': 'Chiudi',
    'common.back': 'Indietro',
    'common.next': 'Avanti',
    'common.previous': 'Precedente',
    'common.search': 'Cerca',
    'common.filter': 'Filtra',
    'common.sort': 'Ordina',
    'common.refresh': 'Aggiorna',
    'common.export': 'Esporta',
    'common.import': 'Importa',
    'common.download': 'Scarica',
    'common.upload': 'Carica',
    'common.view': 'Visualizza',
    'common.details': 'Dettagli',
    'common.summary': 'Riepilogo',
    'common.overview': 'Panoramica',
    'common.settings': 'Impostazioni',
    'common.profile': 'Profilo',
    'common.logout': 'Esci',
    'common.language': 'Lingua',
    'common.italian': 'Italiano',
    'common.english': 'English',
  },
  en: {
    // Login page
    'login.title': 'Sign In',
    'login.subtitle': 'Sign in to your account to continue',
    'login.credentials': 'Credentials',
    'login.email': 'Email',
    'login.email.placeholder': 'john.doe@example.com',
    'login.password': 'Password',
    'login.password.placeholder': '············',
    'login.submit': 'Sign In',
    'login.submitting': 'Signing in...',
    'login.or': 'or',
    'login.google': 'Sign in with Google',
    'login.noAccount': 'Don\'t have an account yet?',
    'login.register': 'Sign Up',
    'login.accessSuccess': 'Successfully signed in!',
    'login.redirecting': 'Taking you to the dashboard...',
    'login.error.unexpected': 'Unexpected error. Please try again.',
    'login.error.google': 'Google sign-in error. Please try again.',
    'login.error.invalidCredentials': 'Invalid credentials. Please try again.',
    
    // Register page
    'register.title': 'Sign Up',
    'register.subtitle': 'Create your account to get started',
    'register.credentials': 'Credentials',
    'register.email': 'Email',
    'register.email.placeholder': 'john.doe@example.com',
    'register.password': 'Password',
    'register.password.placeholder': '············',
    'register.confirmPassword': 'Confirm Password',
    'register.confirmPassword.placeholder': 'Confirm Password',
    'register.submit': 'Sign Up',
    'register.submitting': 'Signing up...',
    'register.or': 'or',
    'register.google': 'Sign up with Google',
    'register.hasAccount': 'Already have an account?',
    'register.login': 'Sign In',
    'register.error.unexpected': 'An error occurred. Please try again.',
    'register.error.google': 'Google sign-up error. Please try again.',
    'register.error.emailInvalid': 'Please enter a valid email',
    'register.error.emailCorrection': 'Did you mean {email}?',
    'register.error.passwordMismatch': 'Passwords do not match',
    'register.success': 'Registration completed successfully!',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.refresh': 'Refresh',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.download': 'Download',
    'common.upload': 'Upload',
    'common.view': 'View',
    'common.details': 'Details',
    'common.summary': 'Summary',
    'common.overview': 'Overview',
    'common.settings': 'Settings',
    'common.profile': 'Profile',
    'common.logout': 'Logout',
    'common.language': 'Language',
    'common.italian': 'Italiano',
    'common.english': 'English',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('it');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window !== 'undefined') {
      // Check for saved language preference
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'it' || savedLanguage === 'en')) {
        setLanguage(savedLanguage);
      } else {
        // Default to Italian (primary language for this app)
        setLanguage('it');
        localStorage.setItem('language', 'it');
      }
    }
    setIsInitialized(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const t = (key: TranslationKey): string => {
    // Ensure we have a valid language
    const currentLang = language || 'it';
    
    // Try to get translation in current language
    let value = translations[currentLang]?.[key];
    
    // If not found, try Italian fallback
    if (!value) {
      value = translations.it?.[key];
    }
    
    // Return translation if found, otherwise return the key
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

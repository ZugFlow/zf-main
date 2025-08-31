"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface PasswordStrength {
  score: number;
  feedback: string;
  color: string;
}

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: "", color: "" });
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  // Verifica autenticazione all'avvio
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setIsAuthenticated(true);
    };
    
    checkAuth();
  }, [router, supabase.auth]);

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    let score = 0;
    let feedback = "";
    
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    
    if (score === 0) {
      feedback = "Inserisci una password";
      return { score, feedback, color: "bg-gray-200" };
    } else if (score <= 2) {
      feedback = "Password debole";
      return { score, feedback, color: "bg-red-500" };
    } else if (score <= 4) {
      feedback = "Password media";
      return { score, feedback, color: "bg-yellow-500" };
    } else {
      feedback = "Password forte";
      return { score, feedback, color: "bg-green-500" };
    }
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  const getValidationErrors = () => {
    const errors = [];
    if (touched.password && password.length < 8) {
      errors.push("La password deve essere di almeno 8 caratteri");
    }
    if (touched.confirm && password !== confirm && confirm.length > 0) {
      errors.push("Le password non coincidono");
    }
    return errors;
  };

  const validationErrors = getValidationErrors();
  const isFormValid = password.length >= 8 && password === confirm && passwordStrength.score >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!isFormValid) {
      setError("Completa tutti i campi correttamente");
      return;
    }
    
    setLoading(true);
    try {
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) throw new Error(pwError.message);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ mustChangePassword: false })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);
      
      if (updateError) throw new Error(updateError.message);
        setSuccess(true);
      
      // Attendi un momento per mostrare il messaggio di successo, poi reindirizza
      setTimeout(() => {
        router.push('/crm');
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>          <h3 className="text-xl font-semibold text-gray-900 mb-2">Password cambiata con successo!</h3>
          <p className="text-gray-600">La tua password è stata aggiornata. Verrai reindirizzato alla dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-8">
        <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cambia Password</h2>
        <p className="text-gray-600">Crea una nuova password sicura per il tuo account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nuova Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Inserisci la nuova password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched({ ...touched, password: true })}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          
          {password && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Forza password:</span>
                <span className={`text-sm font-medium ${passwordStrength.score <= 2 ? 'text-red-600' : passwordStrength.score <= 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {passwordStrength.feedback}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>La password deve contenere:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>Almeno 8 caratteri</li>
                  <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>Una lettera maiuscola</li>
                  <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>Una lettera minuscola</li>
                  <li className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>Un numero</li>
                  <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>Un carattere speciale</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conferma Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Conferma la nuova password"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                touched.confirm && password !== confirm && confirm.length > 0 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched({ ...touched, confirm: true })}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {touched.confirm && password !== confirm && confirm.length > 0 && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Le password non coincidono
            </p>
          )}
          {touched.confirm && password === confirm && confirm.length > 0 && (
            <p className="mt-1 text-sm text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Le password coincidono
            </p>
          )}
        </div>

        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Correggi i seguenti errori:</h3>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {validationErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isFormValid && !loading
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Aggiornamento in corso...
            </div>
          ) : (
            'Cambia Password'
          )}
        </button>
      </form>
    </div>
  );
}

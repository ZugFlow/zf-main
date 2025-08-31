"use client"

import Link from "next/link"

const RegistrazioneCompletata = () => {
  return (
    <div className="flex min-h-screen">
      {/* Main content */}
      <div className="flex flex-col justify-center p-8 w-full bg-white">
        <div className="max-w-md mx-auto w-full text-center">
          <div className="mb-8">
            <span className="text-green-500 text-6xl">✓</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Registrazione Completata!</h1>
          
          <div className="mb-6 p-6 border rounded-lg bg-green-50 shadow-sm">
            <h2 className="text-xl font-semibold text-green-800 mb-3">
              🎉 Benvenuto in ZugFlow!
            </h2>
            <p className="text-green-700 mb-4">
              Complimenti! Il tuo account è stato creato con successo.
            </p>
            <div className="bg-white p-4 rounded-md">
              <p className="text-gray-700 font-medium">
                I tuoi 14 giorni di prova gratuita sono ora attivi
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Hai accesso completo a tutte le funzionalità PRO
              </p>
            </div>
          </div>

          <Link 
            href="/crm/dashboard" 
            className="inline-block py-3 px-6 bg-[rgb(122,153,203)] text-white rounded-md hover:opacity-90 transition"
          >
            Vai alla Dashboard
          </Link>
          
          <p className="text-sm text-gray-600 mt-6">
            Hai bisogno di aiuto?{" "}
            <Link href="/support" className="text-[rgb(122,153,203)] hover:underline">
              Contattaci
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegistrazioneCompletata

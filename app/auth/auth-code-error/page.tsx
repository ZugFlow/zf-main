import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Errore di autenticazione
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Si è verificato un errore durante l'accesso con Google.
          </p>
        </div>
        <div className="text-center">
          <Link
            href="/login"
            className="text-orange-600 hover:text-orange-500 font-medium"
          >
            Torna al login
          </Link>
        </div>
      </div>
    </div>
  );
}

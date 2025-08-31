'use client'

import { useParams } from 'next/navigation'
import DynamicSalonPage from './components/DynamicSalonPage'

export default function SalonPage() {
  const params = useParams()
  const subdomain = params?.subdomain as string

  if (!subdomain) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Subdomain non trovato</h1>
          <p className="text-gray-600">Impossibile caricare la pagina del salone.</p>
        </div>
      </div>
    )
  }

  return <DynamicSalonPage subdomain={subdomain} />
}

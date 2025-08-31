import React from 'react';
import OnlineBookingForm from '@/app/salon/[subdomain]/booking/OnlineBookingForm';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    subdomain: string;
  };
}

export default async function BookingPage({ params }: PageProps) {
  const supabase = createClient();
  
  // Trova il salone basato sul subdomain
  const { data: salon } = await supabase
    .from('salon_web_settings')
    .select('salon_id, web_title, web_logo_url')
    .eq('web_subdomain', params.subdomain)
    .single();

  if (!salon) {
    notFound();
  }

  // Verifica se le prenotazioni online sono abilitate
  const { data: settings } = await supabase
    .from('online_booking_settings')
    .select('enabled')
    .eq('salon_id', salon.salon_id)
    .single();

  if (!settings?.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Prenotazioni Online Non Disponibili
            </h1>
            <p className="text-gray-600">
              Le prenotazioni online non sono attualmente abilitate per questo salone.
              <br />
              Contatta direttamente il salone per prenotare il tuo appuntamento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {salon.web_logo_url && (
                <img 
                  src={salon.web_logo_url} 
                  alt={salon.web_title || 'Salon Logo'} 
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {salon.web_title || 'Salon'}
                </h1>
                <p className="text-gray-600">Prenotazione Online</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Prenotazione Sicura</div>
              <div className="text-xs text-gray-400">SSL Crittografato</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <OnlineBookingForm salonId={salon.salon_id} />
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              © 2024 {salon.web_title || 'Salon'}. Tutti i diritti riservati.
            </p>
            <p className="mt-2">
              Le prenotazioni sono gestite in modo sicuro e i tuoi dati sono protetti.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
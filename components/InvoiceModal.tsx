import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from "@/utils/supabase/client";

interface CompanyData {
  user_id: string;
  name: string;
  address: string;
  city: string;
  cap: string;
  province: string;
  vatNumber: string;
  fiscalCode: string;
  logo?: string;
  percentualeTassa: number;
  tassaInclusa: boolean;
  regimeFiscale: string;
  nazione: string;
  tasseServizi: boolean;
  tasseProdotti: boolean;
  tasseSconti: boolean;
  codiceCategoriaIva: string;
  noteFiscali: string;
}

interface Invoice {
  id?: string;
  numero: string;
  cliente_nome: string;
  data_emissione: string;
  scadenza: string;
  imponibile: number;
  iva: number;
  totale: number;
  note: string;
  indirizzo_cliente?: string;
  citta_cliente?: string;
  cap_cliente?: string;
  provincia_cliente?: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Partial<Invoice> | null;
  companyData?: CompanyData;
}

const InvoiceModal = ({ isOpen, onClose, invoice, companyData: initialCompanyData }: InvoiceModalProps) => {
  const [companyData, setCompanyData] = useState(initialCompanyData);
  
  useEffect(() => {
    const fetchCompanyData = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('dati_azienda')
        .select('*')
        .single();

      if (data && !error) {
        setCompanyData(data);
      }
    };

    if (isOpen && !initialCompanyData) {
      fetchCompanyData();
    }
  }, [isOpen, initialCompanyData]);

  if (!isOpen || !invoice) return null;

  // Ensure numeric values are valid numbers, defaulting to 0 if undefined or invalid
  const imponibile = typeof invoice.imponibile === 'number' ? invoice.imponibile : 0;
  const iva = typeof invoice.iva === 'number' ? invoice.iva : 0;
  const totale = typeof invoice.totale === 'number' ? invoice.totale : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 p-12 shadow-2xl relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Invoice Content */}
        <div className="space-y-10">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              {companyData?.logo ? (
                <img src={companyData.logo} alt="Logo aziendale" className="h-16 w-auto" />
              ) : (
                <div className="h-16 w-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
                  Logo aziendale
                </div>
              )}
              <div className="text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800 text-lg">{companyData?.name || 'Azienda'}</p>
                <p>{companyData?.address || ''}</p>
                <p>{`${companyData?.cap || ''} ${companyData?.city || ''} ${companyData?.province ? `(${companyData.province})` : ''}`}</p>
                <p>P.IVA: {companyData?.vatNumber || ''}</p>
                {companyData?.fiscalCode && <p>C.F.: {companyData.fiscalCode}</p>}
                {companyData?.regimeFiscale && <p>Regime fiscale: {companyData.regimeFiscale}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block border-2 border-gray-800 rounded-lg px-6 py-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-1">FATTURA</h1>
                <p className="text-2xl font-semibold text-gray-800">#{invoice.numero}</p>
              </div>
            </div>
          </div>

          {/* Client & Dates */}
          <div className="grid grid-cols-2 gap-12 bg-gray-50 rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 uppercase text-sm tracking-wider">Destinatario:</h3>
                <div className="text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-800 text-lg">{invoice.cliente_nome}</p>
                  <p>{invoice.indirizzo_cliente || 'Indirizzo cliente'}</p>
                  <p>{`${invoice.cap_cliente || 'CAP'} ${invoice.citta_cliente || 'Città'} ${invoice.provincia_cliente ? `(${invoice.provincia_cliente})` : ''}`}</p>
                </div>
              </div>
            </div>
            <div className="space-y-6 text-right">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 uppercase text-sm tracking-wider">Data emissione:</h3>
                <p className="text-gray-800 font-medium">
                  {invoice.data_emissione ? format(new Date(invoice.data_emissione), 'dd/MM/yyyy') : 'N/D'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 uppercase text-sm tracking-wider">Scadenza:</h3>
                <p className="text-gray-800 font-medium">
                  {invoice.scadenza ? format(new Date(invoice.scadenza), 'dd/MM/yyyy') : 'N/D'}
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Descrizione</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Imponibile</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">IVA</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Totale</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5">{invoice.note || 'Nessuna descrizione'}</td>
                  <td className="px-6 py-5 text-right">€{imponibile.toFixed(2)}</td>
                  <td className="px-6 py-5 text-right">€{iva.toFixed(2)}</td>
                  <td className="px-6 py-5 text-right font-medium">€{totale.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-4">
            <div className="w-80 space-y-3 bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between py-2 text-gray-600">
                <span className="font-medium">Imponibile</span>
                <span className="font-semibold">€{imponibile.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-600">
                <span className="font-medium">IVA ({companyData?.percentualeTassa || 22}%)</span>
                <span className="font-semibold">€{iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 text-lg font-bold border-t border-gray-300">
                <span>Totale</span>
                <span>€{totale.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-8 text-sm text-gray-600">
            <p className="text-center italic">{companyData?.noteFiscali || 'Grazie per aver scelto i nostri servizi'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;

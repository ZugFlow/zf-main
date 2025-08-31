import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useLocalization } from "@/hooks/useLocalization";

export function ServiceSection({
  services,
  selectedServices,
  onServiceAdd,
  onServiceRemove,
  selectContentClassName = "",
  isMobile = false,
  modalSettings
}: {
  services: { id: string; name: string; price: number; duration: number }[];
  selectedServices: { id: string; name: string; price: number; duration: number }[];
  onServiceAdd: (serviceId: string) => void;
  onServiceRemove: (serviceId: string) => void;
  selectContentClassName?: string;
  isMobile?: boolean;
  modalSettings?: any;
}) {
  const { t } = useLocalization();

  // Use modal settings for labels and visibility
  const sectionTitle = modalSettings?.service_section_title || t('servicesection.services', 'Servizi');
  const selectPlaceholder = modalSettings?.service_label || t('servicesection.select_service', 'Seleziona servizio');
  const serviceLabel = modalSettings?.service_label || t('servicesection.service', 'Servizio');
  const durationLabel = modalSettings?.duration_label || t('servicesection.duration', 'Durata');
  const priceLabel = modalSettings?.price_label || t('servicesection.price', 'Prezzo');
  const totalDurationLabel = modalSettings?.total_duration_label || t('servicesection.total_duration', 'Durata totale:');
  const removeServiceText = modalSettings?.remove_service_button_text || t('servicesection.remove_service', 'Rimuovi servizio');

  // Check if service section should be visible
  if (modalSettings && (modalSettings.show_service_section === false || modalSettings.show_service_section === "false")) {
    return null;
  }

  // Check if service selection is enabled
  if (modalSettings && !modalSettings.enable_service_selection) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{sectionTitle}</h3>
      <Select onValueChange={(value) => onServiceAdd(value)}>
        <SelectTrigger className={`rounded-xl border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
          isMobile ? 'h-14 text-base' : 'h-10'
        }`}>
          <SelectValue placeholder={selectPlaceholder} />
        </SelectTrigger>
        <SelectContent className={selectContentClassName}>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id} className={`${
              isMobile ? 'py-3 text-base' : ''
            }`}>
              {service.name} - €{service.price.toFixed(2)} ({service.duration}min)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Mobile-optimized table for selected services */}
      {selectedServices.length > 0 && (
        <div className={`mt-4 border border-gray-200 overflow-hidden shadow-sm ${
          isMobile ? 'rounded-2xl' : 'rounded-lg'
        }`}>
          <div className={`bg-gray-50 px-4 border-b border-gray-200 flex items-center ${
            isMobile ? 'py-4' : 'py-2'
          }`}>
            <span className={`font-semibold text-gray-700 uppercase tracking-wide flex-1 ${
              isMobile ? 'text-sm' : 'text-xs'
            }`}>{serviceLabel}</span>
            <span className={`font-semibold text-gray-700 uppercase tracking-wide text-center ${
              isMobile ? 'text-sm w-20' : 'text-xs w-16'
            }`}>{durationLabel}</span>
            <span className={`font-semibold text-gray-700 uppercase tracking-wide text-right ${
              isMobile ? 'text-sm w-24' : 'text-xs w-20'
            }`}>{priceLabel}</span>
            <span className={`${
              isMobile ? 'w-12' : 'w-10'
            }`}></span>
          </div>
          <div className="divide-y divide-gray-200">
            {selectedServices.map((service) => (
              <div key={service.id} className={`flex items-center px-4 group hover:bg-gray-50 transition ${
                isMobile ? 'py-4' : 'py-3'
              }`}>
                <span className={`flex-1 text-gray-900 ${
                  isMobile ? 'text-base' : 'text-sm'
                }`}>{service.name}</span>
                <span className={`font-medium text-gray-600 text-center ${
                  isMobile ? 'text-base w-20' : 'text-sm w-16'
                }`}>{service.duration}min</span>
                <span className={`font-medium text-gray-900 text-right ${
                  isMobile ? 'text-base w-24' : 'text-sm w-20'
                }`}>€{service.price.toFixed(2)}</span>
                {modalSettings?.enable_multiple_services && (
                  <button
                    type="button"
                    onClick={() => onServiceRemove(service.id)}
                    className={`flex items-center justify-center text-gray-400 hover:text-red-500 opacity-70 hover:opacity-100 ml-2 transition-all duration-200 rounded-lg hover:bg-red-50 active:scale-95 ${
                      isMobile ? 'w-10 h-10' : 'w-8 h-8'
                    }`}
                    title={removeServiceText}
                  >
                    <Trash2 className={`${
                      isMobile ? 'w-5 h-5' : 'w-4 h-4'
                    }`} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {/* Totale durata */}
          <div className={`bg-gray-100 px-4 py-2 border-t border-gray-200 ${
            isMobile ? 'py-3' : 'py-2'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-medium text-gray-700 ${
                isMobile ? 'text-base' : 'text-sm'
              }`}>{totalDurationLabel}</span>
              <span className={`font-semibold text-gray-900 ${
                isMobile ? 'text-base' : 'text-sm'
              }`}>
                {selectedServices.reduce((total, service) => total + service.duration, 0)} min
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

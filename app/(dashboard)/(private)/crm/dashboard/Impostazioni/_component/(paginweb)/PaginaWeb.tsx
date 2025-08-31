'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  ExternalLink,
  Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '../../usePermission';
import SalonPageBuilder from '@/app/salon/[subdomain]/components/SalonPageBuilder';
import { getSalonId } from '@/utils/getSalonId';
import { Database } from '@/types/database.types';

const supabase = createClient();

type SalonWebSettings = Database['public']['Tables']['salon_web_settings']['Row'];

export default function PaginaWeb() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [salonData, setSalonData] = useState<SalonWebSettings | null>(null);
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('builder');

  // Get permissions
  const { hasPermission, loading: permissionsLoading } = usePermissions(session);

  useEffect(() => {
    // Get current session for permissions
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    setLoading(true);
    fetchSalonData();
  }, []);

  const fetchSalonData = async () => {
    try {
      // Use the getSalonId utility function which handles both managers and collaborators
      const salonId = await getSalonId();
      
      if (!salonId) {
        console.error('No salon_id found for current user');
        toast({
          title: "Salone non associato",
          description: "Il tuo profilo non è associato a nessun salone. Contatta l'amministratore.",
          variant: "destructive",
        });
        return;
      }

      // Get salon web settings using the salon_id
      const { data: webSettings, error: webSettingsError } = await supabase
        .from('salon_web_settings')
        .select('*')
        .eq('salon_id', salonId)
        .single();

      if (webSettingsError && webSettingsError.code !== 'PGRST116') {
        console.error('Error fetching web settings:', webSettingsError);
        toast({
          title: "Errore delle impostazioni web",
          description: "Impossibile recuperare le impostazioni web. Verifica la connessione.",
          variant: "destructive",
        });
        return;
      }

      // If no web settings exist, create default settings
      if (!webSettings) {
        // Create default web settings with all required fields
        const { data: newWebSettings, error: createError } = await supabase
          .from('salon_web_settings')
          .insert({
            salon_id: salonId,
            web_enabled: false,
            web_title: 'Il Mio Salone',
            web_description: 'Trasformiamo la tua bellezza in arte. Prenota il tuo appuntamento online per un\'esperienza di bellezza straordinaria.',
            web_primary_color: '#6366f1',
            web_secondary_color: '#8b5cf6',
            web_theme: 'default',
            web_booking_enabled: true,
            web_services_visible: true,
            web_team_visible: true,
            web_gallery_visible: true,
            web_testimonials_visible: true,
            web_contact_form_enabled: true,
            web_animation_enabled: true,
            web_parallax_enabled: false,
            web_dark_mode_enabled: false,
            web_show_search: true,
            web_show_breadcrumbs: true,
            web_show_social_share: true,
            web_show_back_to_top: true,
            web_show_loading_animation: true,
            web_layout_type: 'sidebar',
            web_subtitle: 'La tua bellezza, la nostra passione',
            web_title_color: '#000000',
            web_subtitle_color: '#666666',
            web_text_color: '#333333',
            web_salon_name_color: '#000000',
            web_right_section_enabled: false,
            web_studio_text: 'Studio di bellezza professionale',
            web_salon_name_font_size: '24px',
            web_subtitle_font_size: '16px',
            web_title_font_family: 'Inter',
            web_subtitle_font_family: 'Inter',
            web_description_color: '#666666',
            web_description_font_family: 'Inter',
            web_button_size: 'medium',
            web_button_border_radius: '8px',
            web_button_color: '#6366f1',
            web_button_border_color: '#6366f1',
            web_button_border_width: '1px',
            web_button_type: 'filled',
            web_button_quantity: 2,
            web_button_primary_text: 'Prenota Ora',
            web_button_secondary_text: 'Contattaci',
            web_studio_text_font_size: '14px',
            web_description_font_size: '16px',
            web_carousel_enabled: false,
            web_carousel_autoplay: true,
            web_carousel_speed: 5000,
            web_carousel_display_mode: 'single',
            web_gallery_enabled: true,
            web_gallery_title: 'Galleria',
            web_gallery_title_enabled: true,
            web_gallery_full_width: false,
            web_carousel_visible: true,
            web_map_visible: true,
            web_opening_hours_visible: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating web settings:', createError);
          toast({
            title: "Errore creazione impostazioni",
            description: "Impossibile creare le impostazioni web. Verifica la connessione.",
            variant: "destructive",
          });
          return;
        }

        setSalonData(newWebSettings);
      } else {
        setSalonData(webSettings);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Errore inaspettato",
        description: "Si è verificato un errore imprevisto. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };





  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center p-4 sm:p-8 min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  // Controllo autorizzazione - Solo chi ha canEditSystemSettings può accedere
  if (!hasPermission('canEditSystemSettings')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Accesso Negato</h3>
            <p className="text-gray-600 mb-4">
              Non hai i permessi per gestire la pagina web del salone.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-red-700">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Permesso Richiesto</span>
              </div>
              <p className="text-sm text-red-600 mt-2">
                canEditSystemSettings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!salonData) {
    return (
      <div className="text-center p-4 sm:p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
              <Globe className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Salone non trovato
            </h3>
            <p className="text-yellow-700 mb-4 text-sm sm:text-base">
              Non è stato possibile trovare un salone associato al tuo account. 
              Verifica che il tuo profilo sia correttamente configurato.
            </p>
            <Button 
              onClick={fetchSalonData}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 w-full sm:w-auto"
            >
              Riprova
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 p-6">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    Pagina Web del Salone
                  </h1>
                  <p className="text-rose-100 text-sm">
                    Crea la tua presenza online professionale
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {salonData.web_enabled ? (
                <>
                  <Badge className="bg-green-500 text-white">
                    Pagina Attiva
                  </Badge>
                  {salonData.web_subdomain && (
                    <Button
                      onClick={() => window.open(`https://${salonData.web_subdomain}.zugflow.com`, '_blank')}
                      className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Visualizza Sito
                    </Button>
                  )}
                </>
              ) : (
                <Badge className="bg-white/20 text-white">
                  Pagina Inattiva
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'builder'
              ? 'bg-white text-violet-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Builder Pagina
        </button>
      </div>

      {/* Content based on active tab */}

      {activeTab === 'builder' && salonData && (
        <SalonPageBuilder salonData={salonData as SalonWebSettings} />
      )}
    </div>
  );
} 
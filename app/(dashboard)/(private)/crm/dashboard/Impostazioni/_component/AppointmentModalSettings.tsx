'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { getSalonId } from "@/utils/getSalonId";
import { Loader2, Save, Palette, Settings, Eye, EyeOff, CheckCircle, AlertCircle, Type, Users, Clock, FileText, Zap, Shield, MessageSquare } from "lucide-react";
import { useAppointmentModalSettings, AppointmentModalSettings as SettingsType } from "@/hooks/useAppointmentModalSettings";
import { useLocalization } from "@/hooks/useLocalization";

type SectionType = 'testi' | 'titoli' | 'etichette' | 'funzionalita' | 'validazione' | 'colori' | 'messaggi';

const sections = [
  { id: 'testi', label: 'appointment_modal.sections.texts', icon: Type },
  { id: 'titoli', label: 'appointment_modal.sections.titles', icon: Eye },
  { id: 'etichette', label: 'appointment_modal.sections.labels', icon: FileText },
  { id: 'funzionalita', label: 'appointment_modal.sections.features', icon: Zap },
  { id: 'validazione', label: 'appointment_modal.sections.validation', icon: Shield },
  { id: 'colori', label: 'appointment_modal.sections.colors', icon: Palette },
  { id: 'messaggi', label: 'appointment_modal.sections.messages', icon: MessageSquare },
];

export function AppointmentModalSettings() {
  const { t } = useLocalization();
  const { settings, loading, error, loadSettings } = useAppointmentModalSettings();
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<SettingsType | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionType>('testi');

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const saveSettings = async () => {
    if (!localSettings) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('appointment_modal_settings')
        .upsert({
          ...localSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log('✅ Impostazioni salvate con successo');
      setSaveSuccess(true);
      
      // Reload settings to get the updated data
      await loadSettings();
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('❌ Errore nel salvataggio:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SettingsType, value: any) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, [key]: value });
  };

  const resetToDefaults = async () => {
    if (!localSettings) return;
    
    setSaving(true);
    try {
      const supabase = createClient();
      const salonId = await getSalonId();
      
      if (!salonId) throw new Error('Impossibile determinare il salone');

      // Delete existing settings
      await supabase
        .from('appointment_modal_settings')
        .delete()
        .eq('salon_id', salonId);

      // Reload settings (this will create new default settings)
      await loadSettings();
    } catch (error) {
      console.error('Errore nel reset delle impostazioni:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderSectionContent = () => {
    if (!localSettings) return null;

    switch (activeSection) {
      case 'testi':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                {t('appointment_modal.sections.texts')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modal_title">{t('appointment_modal.texts.modal_title')}</Label>
                  <Input
                    id="modal_title"
                    value={localSettings.modal_title}
                    onChange={(e) => updateSetting('modal_title', e.target.value)}
                    placeholder={t('appointment_modal.texts.modal_title_placeholder')}
                  />
                  <p className="text-xs text-gray-500">
                    {t('appointment_modal.texts.modal_title_desc')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal_subtitle">{t('appointment_modal.texts.modal_subtitle')}</Label>
                  <Input
                    id="modal_subtitle"
                    value={localSettings.modal_subtitle || ''}
                    onChange={(e) => updateSetting('modal_subtitle', e.target.value)}
                    placeholder={t('appointment_modal.texts.modal_subtitle_placeholder')}
                  />
                  <p className="text-xs text-gray-500">
                    {t('appointment_modal.texts.modal_subtitle_desc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'titoli':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t('appointment_modal.sections.titles')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_section_title">{t('appointment_modal.titles.client_section')}</Label>
                  <Input
                    id="client_section_title"
                    value={localSettings.client_section_title}
                    onChange={(e) => updateSetting('client_section_title', e.target.value)}
                    placeholder={t('appointment_modal.titles.client_section_placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_section_title">{t('appointment_modal.titles.service_section')}</Label>
                  <Input
                    id="service_section_title"
                    value={localSettings.service_section_title}
                    onChange={(e) => updateSetting('service_section_title', e.target.value)}
                    placeholder={t('appointment_modal.titles.service_section_placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time_section_title">{t('appointment_modal.titles.time_section')}</Label>
                  <Input
                    id="time_section_title"
                    value={localSettings.time_section_title}
                    onChange={(e) => updateSetting('time_section_title', e.target.value)}
                    placeholder={t('appointment_modal.titles.time_section_placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes_section_title">{t('appointment_modal.titles.notes_section')}</Label>
                  <Input
                    id="notes_section_title"
                    value={localSettings.notes_section_title}
                    onChange={(e) => updateSetting('notes_section_title', e.target.value)}
                    placeholder={t('appointment_modal.titles.notes_section_placeholder')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'etichette':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('appointment_modal.sections.labels')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name_label">{t('appointment_modal.labels.client_name')}</Label>
                  <Input
                    id="client_name_label"
                    value={localSettings.client_name_label}
                    onChange={(e) => updateSetting('client_name_label', e.target.value)}
                    placeholder={t('appointment_modal.labels.client_name_placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone_label">{t('appointment_modal.labels.client_phone')}</Label>
                  <Input
                    id="client_phone_label"
                    value={localSettings.client_phone_label}
                    onChange={(e) => updateSetting('client_phone_label', e.target.value)}
                    placeholder={t('appointment_modal.labels.client_phone_placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email_label">{t('appointment_modal.labels.client_email')}</Label>
                  <Input
                    id="client_email_label"
                    value={localSettings.client_email_label}
                    onChange={(e) => updateSetting('client_email_label', e.target.value)}
                    placeholder={t('appointment_modal.labels.client_email_placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_label">{t('appointment_modal.labels.service')}</Label>
                  <Input
                    id="service_label"
                    value={localSettings.service_label}
                    onChange={(e) => updateSetting('service_label', e.target.value)}
                    placeholder={t('appointment_modal.labels.service_placeholder')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'funzionalita':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {t('appointment_modal.sections.features')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.show_client_section')}</Label>
                <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.show_client_section_desc')}
                </p>
              </div>
              <Switch
                checked={localSettings.show_client_section !== false}
                onCheckedChange={(checked) => updateSetting('show_client_section', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.client_search')}</Label>
                <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.client_search_desc')}
                </p>
              </div>
              <Switch
                checked={localSettings.enable_client_search}
                onCheckedChange={(checked) => updateSetting('enable_client_search', checked)}
              />
            </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.new_client')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.new_client_desc')}
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.enable_new_client_creation}
                    onCheckedChange={(checked) => updateSetting('enable_new_client_creation', checked)}
                  />
                </div>
                            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.service_selection')}</Label>
                <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.service_selection_desc')}
                </p>
              </div>
              <Switch
                checked={localSettings.enable_service_selection}
                onCheckedChange={(checked) => updateSetting('enable_service_selection', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.show_service_section')}</Label>
                <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.show_service_section_desc')}
                </p>
              </div>
              <Switch
                checked={localSettings.show_service_section !== false}
                onCheckedChange={(checked) => updateSetting('show_service_section', checked)}
              />
            </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.multiple_services')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.multiple_services_desc')}
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.enable_multiple_services}
                    onCheckedChange={(checked) => updateSetting('enable_multiple_services', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.price_editing')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.price_editing_desc')}
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.enable_price_editing}
                    onCheckedChange={(checked) => updateSetting('enable_price_editing', checked)}
                  />
                </div>
                            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.show_time_section')}</Label>
                <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.show_time_section_desc')}
                </p>
              </div>
              <Switch
                checked={localSettings.show_time_section !== false}
                onCheckedChange={(checked) => updateSetting('show_time_section', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.show_team_section')}</Label>
                <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.show_team_section_desc')}
                </p>
              </div>
              <Switch
                checked={localSettings.show_team_section !== false}
                onCheckedChange={(checked) => updateSetting('show_team_section', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.show_notes_section')}</Label>
                <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.show_notes_section_desc')}
                </p>
              </div>
              <Switch
                checked={localSettings.show_notes_section !== false}
                onCheckedChange={(checked) => updateSetting('show_notes_section', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.show_notifications_section')}</Label>
                <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.show_notifications_section_desc')}
                </p>
              </div>
              <Switch
                checked={localSettings.show_notifications_section !== false}
                onCheckedChange={(checked) => updateSetting('show_notifications_section', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.show_color_section')}</Label>
                <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.show_color_section_desc')}
                </p>
              </div>
              <Switch
                checked={localSettings.show_color_section !== false}
                onCheckedChange={(checked) => updateSetting('show_color_section', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                    <Label>{t('appointment_modal.features.notes')}</Label>
                <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.features.notes_desc')}
                </p>
              </div>
              <Switch
                checked={localSettings.enable_notes}
                onCheckedChange={(checked) => updateSetting('enable_notes', checked)}
              />
            </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'validazione':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('appointment_modal.sections.validation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('appointment_modal.validation.client_name_required')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.validation.client_name_required_desc')}
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.require_client_name}
                    onCheckedChange={(checked) => updateSetting('require_client_name', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('appointment_modal.validation.client_phone_required')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.validation.client_phone_required_desc')}
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.require_client_phone}
                    onCheckedChange={(checked) => updateSetting('require_client_phone', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('appointment_modal.validation.client_email_required')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.validation.client_email_required_desc')}
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.require_client_email}
                    onCheckedChange={(checked) => updateSetting('require_client_email', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('appointment_modal.validation.service_required')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('appointment_modal.validation.service_required_desc')}
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.require_service_selection}
                    onCheckedChange={(checked) => updateSetting('require_service_selection', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'colori':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t('appointment_modal.sections.colors')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">{t('appointment_modal.colors.primary')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={localSettings.primary_color}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={localSettings.primary_color}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">{t('appointment_modal.colors.secondary')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={localSettings.secondary_color}
                      onChange={(e) => updateSetting('secondary_color', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={localSettings.secondary_color}
                      onChange={(e) => updateSetting('secondary_color', e.target.value)}
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="success_color">{t('appointment_modal.colors.success')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="success_color"
                      type="color"
                      value={localSettings.success_color}
                      onChange={(e) => updateSetting('success_color', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={localSettings.success_color}
                      onChange={(e) => updateSetting('success_color', e.target.value)}
                      placeholder="#10b981"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="error_color">{t('appointment_modal.colors.error')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="error_color"
                      type="color"
                      value={localSettings.error_color}
                      onChange={(e) => updateSetting('error_color', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={localSettings.error_color}
                      onChange={(e) => updateSetting('error_color', e.target.value)}
                      placeholder="#ef4444"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'messaggi':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t('appointment_modal.sections.messages')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="required_field_message">{t('appointment_modal.messages.required_field')}</Label>
                  <Input
                    id="required_field_message"
                    value={localSettings.required_field_message}
                    onChange={(e) => updateSetting('required_field_message', e.target.value)}
                    placeholder={t('appointment_modal.messages.required_field_placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invalid_email_message">{t('appointment_modal.messages.invalid_email')}</Label>
                  <Input
                    id="invalid_email_message"
                    value={localSettings.invalid_email_message}
                    onChange={(e) => updateSetting('invalid_email_message', e.target.value)}
                    placeholder={t('appointment_modal.messages.invalid_email_placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invalid_phone_message">{t('appointment_modal.messages.invalid_phone')}</Label>
                  <Input
                    id="invalid_phone_message"
                    value={localSettings.invalid_phone_message}
                    onChange={(e) => updateSetting('invalid_phone_message', e.target.value)}
                    placeholder={t('appointment_modal.messages.invalid_phone_placeholder')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>{t('appointment_modal.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-500">{t('appointment_modal.error.loading')}: {error}</p>
        <Button onClick={loadSettings} className="mt-4">
          {t('appointment_modal.retry')}
        </Button>
      </div>
    );
  }

  if (!localSettings) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{t('appointment_modal.error.general')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar a sinistra */}
      <div className="w-64 border-r bg-gray-50/50 p-4 space-y-2">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{t('appointment_modal.sections')}</h2>
          <p className="text-sm text-gray-500">{t('appointment_modal.sections_description')}</p>
        </div>
        
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as SectionType)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(section.label)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenuto principale a destra */}
      <div className="flex-1 p-6">
        {/* Header con titolo e pulsanti */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('appointment_modal.title')}</h1>
              <p className="text-gray-500 mt-1">
                {t('appointment_modal.description')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetToDefaults} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('appointment_modal.actions.reset')}
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('appointment_modal.actions.reset_default')}
                  </>
                )}
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('appointment_modal.actions.saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('appointment_modal.actions.save_settings')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Messaggio di successo */}
        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">
              {t('appointment_modal.success.saved')}
            </span>
          </div>
        )}

        {/* Contenuto della sezione attiva */}
        <div className="space-y-6">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
}

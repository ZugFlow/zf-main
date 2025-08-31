"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'it' ? 'en' : 'it');
  };

  return (
    <Button
      onClick={toggleLanguage}
      variant="ghost"
      size="sm"
      className="fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-2 shadow-lg hover:bg-white/90 transition-all duration-200 group"
      title={t('common.language')}
    >
      <Languages className="w-4 h-4 mr-2 text-gray-600 group-hover:text-violet-600 transition-colors" />
      <span className="text-sm font-medium text-gray-700 group-hover:text-violet-700 transition-colors">
        {language === 'it' ? 'EN' : 'IT'}
      </span>
    </Button>
  );
};

export default LanguageSwitcher;

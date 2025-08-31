import React from 'react';
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { ChatGroupsModal } from '@/components/chat/ChatGroupsModal';
import { UserMultiple } from '@carbon/icons-react';

export const OnboardingHelper = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isOpen, setIsOpen] = useState(true);
  const [showKeywords, setShowKeywords] = useState(false);
  const [message, setMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showChatGroups, setShowChatGroups] = useState(false);

  const keywords = [
    "Calendario", "Team", "Appuntamenti", "Clienti",
    "Orari", "Servizi", "Prenotazioni", "Gestione"
  ];

  const steps = [
    {
      title: "Benvenuto in ZugFlow! 👋",
      description: "Vediamo insieme come iniziare ad utilizzare il calendario.",
      buttonText: "Iniziamo"
    },
    {
      title: "Primo Passo: Aggiungi il tuo Team",
      description: "Clicca su 'Impostazioni' in alto a destra e poi su 'Gestisci Team' per aggiungere i membri del tuo salone.",
      buttonText: "Capito, dopo?"
    },
    {
      title: "Secondo Passo: Attiva la Visibilità",
      description: "Nelle impostazioni, attiva la visibilità per i membri del team che vuoi vedere nel calendario.",
      buttonText: "Ok, e poi?"
    },
    {
      title: "Ultimo Passo: Inizia a Pianificare!",
      description: "Ora puoi iniziare ad aggiungere appuntamenti cliccando su qualsiasi slot orario nel calendario.",
      buttonText: "Ho capito tutto!"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg z-50"
        title="Riapri guida"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12" y2="17"/>
        </svg>
      </button>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/20 z-40 flex items-end justify-end p-4"
      onClick={handleClickOutside}
    >
      <div className="flex flex-col gap-3 items-end">
        {showChat && (
          <form 
            onSubmit={handleSubmit}
            className="w-full md:w-[440px] bg-white rounded-lg shadow-lg p-3 animate-slide-up"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Fai una domanda..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              />
              <Button 
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 px-4"
              >
                Invia
              </Button>
            </div>
          </form>
        )}
        
        {showKeywords && (
          <div className="fixed bottom-[230px] right-4 bg-purple-50 rounded-lg shadow-lg p-4 z-50 border border-purple-200 animate-fade-in">
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <button
                  key={index}
                  onClick={() => {/* Aggiungi qui la logica per la parola chiave */}}
                  className="px-3 py-1 bg-white rounded-full text-sm text-purple-600 hover:bg-purple-100 border border-purple-200 transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-lg md:w-[440px] w-[90%] max-w-[440px] p-4 md:p-6 border border-gray-200 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Chiudi guida"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="mb-4">
            <h3 className="text-lg md:text-xl font-bold">
              {steps[currentStep - 1].title}
            </h3>
            <p className="mt-2 md:mt-4 text-sm md:text-base leading-6 text-gray-600">
              {steps[currentStep - 1].description}
            </p>
          </div>
          <div className="mt-4 md:mt-6 flex justify-between items-center">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 md:h-2 w-1.5 md:w-2 rounded-full ${
                    index + 1 === currentStep ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowChatGroups(true)}
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                title="Chat"
              >
                <UserMultiple className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center"
                title="Chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              )}
              <Button 
                onClick={handleNext} 
                className="bg-purple-600 hover:bg-purple-700 text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2"
              >
                {steps[currentStep - 1].buttonText}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Groups Modal */}
      <ChatGroupsModal 
        open={showChatGroups} 
        onOpenChange={setShowChatGroups} 
      />
    </div>
  );
};

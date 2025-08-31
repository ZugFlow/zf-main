import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Crown,
  UserPlus,
  Calendar,
  Clock,
  Mail,
  Tag,
  CreditCard,
  AlertCircle,
  Target,
  Users,
  FileText,
  Receipt,
  StickyNote,
  Archive,
  X
} from "lucide-react";
import { ClientTag } from "../types";

// CLIENT_TAGS definition - deve corrispondere a quello in AnagraficaClienti.tsx
const CLIENT_TAGS: Record<string, ClientTag[]> = {
  profile: [
    { id: 'vip', name: 'VIP', category: 'profile', color: 'bg-purple-100 text-purple-800' },
    { id: 'new', name: 'Nuovo Cliente', category: 'profile', color: 'bg-green-100 text-green-800' },
    { id: 'historic', name: 'Cliente Storico', category: 'profile', color: 'bg-blue-100 text-blue-800' },
    { id: 'regular', name: 'Cliente Abituale', category: 'profile', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'occasional', name: 'Cliente Saltuario', category: 'profile', color: 'bg-orange-100 text-orange-800' },
    { id: 'friend', name: 'Amico/Familiare', category: 'profile', color: 'bg-pink-100 text-pink-800' },
    { id: 'business', name: 'Cliente Aziendale', category: 'profile', color: 'bg-gray-100 text-gray-800' },
    { id: 'influencer', name: 'Influencer', category: 'profile', color: 'bg-yellow-100 text-yellow-800' },
  ],
  frequency: [
    { id: 'inactive30', name: 'Inattivo da 30 giorni', category: 'frequency', color: 'bg-amber-100 text-amber-800' },
    { id: 'inactive90', name: 'Inattivo da 90 giorni', category: 'frequency', color: 'bg-red-100 text-red-800' },
    { id: 'late', name: 'Sempre in ritardo', category: 'frequency', color: 'bg-orange-100 text-orange-800' },
    { id: 'reliable', name: 'Mai salta un appuntamento', category: 'frequency', color: 'bg-green-100 text-green-800' },
    { id: 'noshow', name: 'Ultimo appuntamento no-show', category: 'frequency', color: 'bg-red-100 text-red-800' },
    { id: 'cancels', name: 'Cancellazioni frequenti', category: 'frequency', color: 'bg-orange-100 text-orange-800' },
  ],
  preferences: [
    { id: 'newsletter', name: 'Newsletter', category: 'preferences', color: 'bg-purple-100 text-purple-800' },
    { id: 'promo', name: 'Promozioni', category: 'preferences', color: 'bg-pink-100 text-pink-800' },
  ],
  payment: [
    { id: 'paid', name: 'Pagato', category: 'payment', color: 'bg-green-100 text-green-800' },
    { id: 'unpaid', name: 'Insoluto', category: 'payment', color: 'bg-red-100 text-red-800' },
  ],
  marketing: [
    { id: 'lead', name: 'Lead', category: 'marketing', color: 'bg-orange-100 text-orange-800' },
    { id: 'customer', name: 'Cliente', category: 'marketing', color: 'bg-blue-100 text-blue-800' },
  ],
  fiscal: [
    { id: 'invoice', name: 'Fattura', category: 'fiscal', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'receipt', name: 'Ricevuta', category: 'fiscal', color: 'bg-teal-100 text-teal-800' },
  ],
  internal: [
    { id: 'note', name: 'Note', category: 'internal', color: 'bg-gray-100 text-gray-800' },
    { id: 'archive', name: 'Archivio', category: 'internal', color: 'bg-yellow-100 text-yellow-800' },
  ],
};

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: ClientTag[]; // Questa verrà da client.tag
  onTagsUpdate: (tag: ClientTag[]) => Promise<void>; // Aggiornato per corrispondere alla colonna tag
}

export const TagManager = ({
  isOpen,
  onClose,
  selectedTags,
  onTagsUpdate,
}: TagManagerProps) => {
  const [tempSelectedTags, setTempSelectedTags] = useState<ClientTag[]>([]);

  // Inizializza i tag temporanei quando si apre il modal
  useEffect(() => {
    if (isOpen) {
      setTempSelectedTags(selectedTags);
    }
  }, [isOpen, selectedTags]);

  // Permetti fino a 5 tag selezionati
  const handleTagToggle = (tag: ClientTag) => {
    const isSelected = tempSelectedTags.some(t => t.id === tag.id);
    
    if (isSelected) {
      // Rimuovi il tag se è già selezionato
      const newTags = tempSelectedTags.filter(t => t.id !== tag.id);
      setTempSelectedTags(newTags);
    } else {
      // Aggiungi il tag se non è già selezionato e non supera il limite di 5
      if (tempSelectedTags.length < 5) {
        const newTags = [...tempSelectedTags, tag];
        setTempSelectedTags(newTags);
      } else {
        // Mostra un messaggio di errore se si supera il limite
        alert("Puoi selezionare massimo 5 tag per cliente");
      }
    }
  };

  const handleTagRemove = (tagId: string) => {
    const newTags = tempSelectedTags.filter(t => t.id !== tagId);
    setTempSelectedTags(newTags);
  };

  const handleSave = async () => {
    await onTagsUpdate(tempSelectedTags);
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedTags(selectedTags); // Ripristina i tag originali
    onClose();
  };

  // Function to get icon for each tag
  const getTagIcon = (tagId: string) => {
    const iconMap: Record<string, any> = {
      // Profile icons
      'vip': Crown,
      'new': UserPlus,
      'historic': Users,
      'regular': Calendar,
      'occasional': Clock,
      'friend': Users,
      'business': Target,
      'influencer': Crown,
      // Frequency icons
      'inactive30': Clock,
      'inactive90': AlertCircle,
      'late': Clock,
      'reliable': Calendar,
      'noshow': AlertCircle,
      'cancels': AlertCircle,
      // Preferences icons
      'newsletter': Mail,
      'promo': Tag,
      // Payment icons
      'paid': CreditCard,
      'unpaid': AlertCircle,
      // Marketing icons
      'lead': Target,
      'customer': Users,
      // Fiscal icons
      'invoice': FileText,
      'receipt': Receipt,
      // Internal icons
      'note': StickyNote,
      'archive': Archive,
    };
    
    return iconMap[tagId] || Tag;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Gestisci Tag Cliente</DialogTitle>
        </DialogHeader>
        
        {/* Selected Tags Section */}
        {tempSelectedTags.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-3">Tag Selezionati ({tempSelectedTags.length}/5)</h4>
            <div className="flex flex-wrap gap-2">
              {tempSelectedTags.map((tag) => {
                const IconComponent = getTagIcon(tag.id);
                return (
                  <div
                    key={tag.id}
                    className={`${tag.color} px-3 py-2 rounded-lg border border-blue-300 flex items-center gap-2 group`}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-sm">{tag.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1 hover:bg-red-100 rounded-full opacity-70 group-hover:opacity-100"
                      onClick={() => handleTagRemove(tag.id)}
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Tabs defaultValue="profile">
          <TabsList className="grid grid-cols-7 h-12">
            <TabsTrigger value="profile">Profilo</TabsTrigger>
            <TabsTrigger value="frequency">Frequenza</TabsTrigger>
            <TabsTrigger value="preferences">Preferenze</TabsTrigger>
            <TabsTrigger value="payment">Pagamento</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="fiscal">Fiscale</TabsTrigger>
            <TabsTrigger value="internal">Interno</TabsTrigger>
          </TabsList>
          {Object.entries(CLIENT_TAGS).map(([category, tags]) => (
            <TabsContent key={category} value={category}>
              <ScrollArea className="h-[300px] p-4">
                <div className="grid grid-cols-1 gap-3">
                  {tags.map((tag) => {
                    const IconComponent = getTagIcon(tag.id);
                    const isSelected = tempSelectedTags.some(t => t.id === tag.id);
                    
                    return (
                      <div
                        key={tag.id}
                        className={`${tag.color} cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                          isSelected
                            ? 'border-blue-500 shadow-md'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                        onClick={() => handleTagToggle(tag)}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium text-sm">{tag.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Footer con pulsanti */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleCancel}>
            Annulla
          </Button>
          <Button onClick={handleSave}>
            Salva Tag
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CreateClientForm } from "@/app/(dashboard)/(private)/crm/dashboard/Clienti/_component/form";
import { PlusIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useLocalization } from "@/hooks/useLocalization";

export function ClientSection({
  form,
  clients,
  handleClientChange,
  isSheetOpen,
  setIsSheetOpen,
  fetchClients,
  setBannerMessage,
  selectContentClassName = "",
  modalSettings
}: {
  form: any;
  clients: { id: string; nome: string; telefono: string; email: string; customer_uuid: string }[];
  handleClientChange: (clientId: string) => void;
  isSheetOpen: boolean;
  setIsSheetOpen: (open: boolean) => void;
  fetchClients: () => void;
  setBannerMessage: (message: string | null) => void;
  selectContentClassName?: string;
  modalSettings?: any;
}) {
  const { t } = useLocalization();

  // Use modal settings for labels and visibility
  const sectionTitle = modalSettings?.client_section_title || t('clientsection.client', 'Cliente');
  const selectPlaceholder = modalSettings?.client_name_placeholder || t('clientsection.select_client', 'Seleziona un cliente');
  const addClientText = modalSettings?.new_client_button_text || t('clientsection.add_new_client', 'Aggiungi Nuovo Cliente');
  const addClientDesc = modalSettings?.client_section_title || t('clientsection.add_new_client_desc', 'Compila il modulo per aggiungere un nuovo cliente.');

  // Check if client section should be visible
  if (modalSettings && (modalSettings.show_client_section === false || modalSettings.show_client_section === "false")) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="customer_uuid"
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>{sectionTitle}</FormLabel>
            <FormControl>
              <div className="flex items-center space-x-2">
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleClientChange(value);
                  }}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="text-sm py-1 px-4">
                    <SelectValue placeholder={selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className={selectContentClassName}>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.customer_uuid}>
                        {client.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {modalSettings?.enable_new_client_creation && (
                  <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <PlusIcon className="h-4 w-4 mr-1" />
                        {addClientText}
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>{addClientText}</SheetTitle>
                        <SheetDescription>
                          {addClientDesc}
                        </SheetDescription>
                      </SheetHeader>
                      <CreateClientForm
                        setIsDialogOpen={() => {
                          setIsSheetOpen(false);
                          fetchClients();
                          setBannerMessage(t('clientsection.new_client_added_success', 'Nuovo cliente aggiunto con successo!'));
                        }}
                      />
                    </SheetContent>
                  </Sheet>
                )}
              </div>
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    </div>
  );
}

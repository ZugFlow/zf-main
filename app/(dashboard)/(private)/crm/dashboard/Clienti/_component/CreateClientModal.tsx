"use client";

import React from "react";
import { UserIcon } from "lucide-react";
import { CreateClientForm } from "./form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocalization } from "@/hooks/useLocalization";

export function CreateClientModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useLocalization();
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white border-0 shadow-2xl rounded-xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-6 border-b border-gray-100 flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
            {t('clientmodal.new_client', 'Nuovo Cliente')}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-6 px-8 space-y-6 overflow-y-auto flex-1">
          <CreateClientForm setIsDialogOpen={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

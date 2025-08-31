import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "components/ui/dialog";
import { Button } from "components/ui/button";
import { useState } from "react";

interface ConfirmDragDropProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function ConfirmDragDrop({
  isOpen,
  onConfirm,
  onCancel,
  title = "Conferma Azione",
  description = "Sei sicuro di voler procedere con questa azione?"
}: ConfirmDragDropProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button variant="default" onClick={onConfirm}>
            Conferma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
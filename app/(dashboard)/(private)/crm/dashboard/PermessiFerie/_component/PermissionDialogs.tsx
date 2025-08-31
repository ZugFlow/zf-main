'use client';

import React, { useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Member, FormData, Permission } from './types';

interface PermissionDialogsProps {
  isCreateDialogOpen: boolean;
  isEditDialogOpen: boolean;
  editingPermission: Permission | null;
  formData: FormData;
  members: Member[];
  isManager: boolean;
  currentUser: any;
  onCreateDialogChange: (open: boolean) => void;
  onEditDialogChange: (open: boolean) => void;
  onFormDataChange: (data: Partial<FormData>) => void;
  onEditingPermissionChange: (permission: Permission | null) => void;
  onCreatePermission: () => void;
  onUpdatePermission: () => void;
}

export default function PermissionDialogs({
  isCreateDialogOpen,
  isEditDialogOpen,
  editingPermission,
  formData,
  members,
  isManager,
  currentUser,
  onCreateDialogChange,
  onEditDialogChange,
  onFormDataChange,
  onEditingPermissionChange,
  onCreatePermission,
  onUpdatePermission
}: PermissionDialogsProps) {

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Data non disponibile';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data non valida';
      }
      return date.toLocaleDateString('it-IT');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Data non valida';
    }
  };

  // Rimuovi i manager dall'elenco selezionabile nel modal di creazione
  const selectableMembers = members.filter((m) => m.role !== 'manager');

  // Se l'ID selezionato corrisponde a un manager, resettalo quando si apre il modal
  useEffect(() => {
    if (isCreateDialogOpen && formData.member_id) {
      const selected = members.find((m) => m.id === formData.member_id);
      if (selected && selected.role === 'manager') {
        onFormDataChange({ member_id: '' });
      }
    }
  }, [isCreateDialogOpen]);

  return (
    <>
      {/* Create Permission Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={onCreateDialogChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nuovo Permesso</DialogTitle>
            <DialogDescription>
              Crea una nuova richiesta di permesso o ferie
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {isManager ? (
                <div className="space-y-2">
                  <Label htmlFor="member">Membro *</Label>
                  <Select value={formData.member_id} onValueChange={(value) => onFormDataChange({ member_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona membro" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="member">Membro</Label>
                  <Input 
                    value={members.find(m => m.user_id === currentUser?.id)?.name || 'Tu'} 
                    disabled 
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select value={formData.type} onValueChange={(value: 'ferie' | 'permesso' | 'malattia' | 'altro') => onFormDataChange({ type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ferie">Ferie</SelectItem>
                    <SelectItem value="permesso">Permesso</SelectItem>
                    <SelectItem value="malattia">Malattia</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data inizio *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => onFormDataChange({ start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data fine *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => onFormDataChange({ end_date: e.target.value })}
                />
              </div>
            </div>

            {formData.type === 'permesso' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Ora inizio</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => onFormDataChange({ start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Ora fine</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => onFormDataChange({ end_time: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo *</Label>
              <Input
                id="reason"
                placeholder="Inserisci il motivo del permesso"
                value={formData.reason}
                onChange={(e) => onFormDataChange({ reason: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                placeholder="Note aggiuntive (opzionale)"
                value={formData.notes}
                onChange={(e) => onFormDataChange({ notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onCreateDialogChange(false)}>
              Annulla
            </Button>
            <Button onClick={onCreatePermission}>
              Crea Permesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permission Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={onEditDialogChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifica Permesso</DialogTitle>
            <DialogDescription>
              Modifica i dettagli del permesso
            </DialogDescription>
          </DialogHeader>
          {editingPermission && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Membro</Label>
                  <Input value={editingPermission.member_name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Input 
                    value={
                      editingPermission.type === 'ferie' ? 'Ferie' :
                      editingPermission.type === 'permesso' ? 'Permesso' :
                      editingPermission.type === 'malattia' ? 'Malattia' : 'Altro'
                    } 
                    disabled 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data inizio</Label>
                  <Input value={formatDate(editingPermission.start_date)} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Data fine</Label>
                  <Input value={formatDate(editingPermission.end_date)} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo</Label>
                <Input value={editingPermission.reason} disabled />
              </div>

              {/* Solo i manager possono modificare lo stato dei permessi di altri */}
              {isManager && editingPermission.member_id !== members.find(m => m.user_id === currentUser?.id)?.id ? (
                <div className="space-y-2">
                  <Label>Stato</Label>
                  <Select 
                    value={editingPermission.status} 
                    onValueChange={(value: 'pending' | 'approved' | 'rejected') => 
                      onEditingPermissionChange({...editingPermission, status: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">In attesa</SelectItem>
                      <SelectItem value="approved">Approvato</SelectItem>
                      <SelectItem value="rejected">Rifiutato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Stato</Label>
                  <Input 
                    value={
                      editingPermission.status === 'pending' ? 'In attesa' :
                      editingPermission.status === 'approved' ? 'Approvato' :
                      editingPermission.status === 'rejected' ? 'Rifiutato' : editingPermission.status
                    } 
                    disabled 
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onEditDialogChange(false)}>
              Annulla
            </Button>
            <Button onClick={onUpdatePermission}>
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
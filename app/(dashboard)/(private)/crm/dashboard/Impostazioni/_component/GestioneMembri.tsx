import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createClient } from "@/utils/supabase/client";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FaUpload, FaExclamationTriangle } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import CreateMemberForm from '@/components/CreateMemberForm';
import { getSalonId } from '@/utils/getSalonId';
import { usePermissions } from '../usePermission';

const supabase = createClient();



const demoAvatars = Array.from({ length: 19 }, (_, i) => `https://gwetcekqrylofwxutuad.supabase.co/storage/v1/object/public/zugflowhub/AvatarDefault/avatar${i + 1}.png`);

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  colorMember: string;
  order_column: number;
  avatar_url?: string;
  role?: string;
  is_active?: boolean;
  user_id?: string;
}

const GestioneMembri = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isCreateCollaboratorModalOpen, setIsCreateCollaboratorModalOpen] = useState(false);
  const [isTeamMembersVisible, setIsTeamMembersVisible] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [deleteOptionsModal, setDeleteOptionsModal] = useState<{ isOpen: boolean; memberId: string | null }>({
    isOpen: false,
    memberId: null,
  });
  const [photoReplaceConfirm, setPhotoReplaceConfirm] = useState<{
    isOpen: boolean;
    file: File | null;
    memberId: string | null;
  }>({ isOpen: false, file: null, memberId: null });
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);

  // Get permissions
  const { hasPermission, loading: permissionsLoading } = usePermissions(session);

  useEffect(() => {
    // Get current session for permissions
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
        
        // Check if user is a manager (in profiles table)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();
        
        setIsManager(!!profileData);
      }
    };
    getSession();

    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError || !user) {
        console.error("User error:", userError?.message || "User not authenticated");
        setTeamMembers([]); // Reset list on error
        setIsLoading(false);
        return;
      }

      console.log("Fetching team members for user:", user.id);

      // Get salon_id using the helper function (works for both managers and collaborators)
      let salonId = await getSalonId();
      
      // Se non troviamo subito il salon_id per un collaboratore appena creato, proviamo a fare refresh della sessione
      if (!salonId) {
        console.log("🔄 No salon_id found, trying session refresh for newly created collaborator...");
        
        // Prova a fare refresh della sessione
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshData.session && !refreshError) {
          console.log("✅ Session refreshed, retrying getSalonId...");
          // Aspetta un momento e riprova
          await new Promise(resolve => setTimeout(resolve, 1000));
          salonId = await getSalonId();
        }
      }
      
      if (!salonId) {
        console.error("❌ No salon_id found for user even after refresh:", user.id);
        
        // Debug: verifica se l'utente esiste nella tabella team
        const { data: debugTeam, error: debugError } = await supabase
          .from('team')
          .select('salon_id, user_id, is_active, name, email')
          .eq('user_id', user.id);
          
        console.log("🔍 Debug team query for user:", {
          userId: user.id,
          teamRecords: debugTeam,
          error: debugError
        });
        
        setTeamMembers([]); // Reset list on error
        setIsLoading(false);
        return;
      }

      console.log("✅ Found salon_id:", salonId);

      // Fetch all active team members associated with the same salon_id
      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('id, name, email, phone_number, ColorMember, order_column, avatar_url, role, is_active, user_id')
        .eq('salon_id', salonId)
        .eq('is_active', true) // Solo membri attivi
        .order('order_column', { ascending: true });

      if (teamError) {
        console.error("Team fetch error:", teamError);
        setTeamMembers([]); // Reset list on error
        setIsLoading(false);
        return;
      }

      console.log("Team members data:", teamData);

      if (teamData && Array.isArray(teamData)) {
        const formattedMembers = teamData.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          phone_number: member.phone_number,
          colorMember: member.ColorMember, // Use the correct field
          order_column: member.order_column,
          avatar_url: member.avatar_url,
          role: member.role || "member", // Default to "member" if role is not set
          user_id: member.user_id // Add user_id to identify current user
        }));

        setTeamMembers(formattedMembers);
      } else {
        setTeamMembers([]); // Reset list if no data
      }
    } catch (err) {
      console.error("Unexpected error in fetchTeamMembers:", err);
      setTeamMembers([]); // Reset list on error
    } finally {
      setIsLoading(false);
    }
  };

  const addMember = async (name: string, email: string, phone_number: string, colorMember: string) => {
    if (!name.trim() || !email.trim() || !phone_number.trim()) {
        console.error("Nome, email e numero di telefono non possono essere vuoti.");
        return;
    }

    // Recupera l'utente autenticato
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
        console.error("Errore nel recupero dell'utente:", userError?.message || "Utente non autenticato");
        return;
    }

    try {
        // Trova l'ultimo ordine per calcolare il prossimo `order_column`
        const { data: maxOrderData } = await supabase
            .from("team")
            .select("order_column")
            .order("order_column", { ascending: false })
            .limit(1);

        const nextOrder = maxOrderData?.length ? maxOrderData[0].order_column + 1 : 0;

        // Inserisci il nuovo membro con `user_id`, `salon_id` e visible_users sempre true
        const { data, error } = await supabase
            .from("team")
            .insert([{
                user_id: user.id,
                name: name.trim(),
                email: email.trim(),
                phone_number: phone_number.trim(),
                ColorMember: colorMember.trim(),
                order_column: nextOrder,
                visible_users: true, // Always set to true
                role: "member", // Default role for new members
                is_active: true, // Membro attivo di default
            }])
            .select();

        if (error) {
            console.error("Errore durante l'aggiunta del membro:", error.message);
            return;
        }

        if (data?.length > 0) {
            console.log("Membro creato con successo:", data[0]);
            await fetchTeamMembers(); // <-- Fetch team members again to update the list in real-time
        } else {
            console.error("Errore: Nessun dato restituito dall'inserimento.");
        }
    } catch (err) {
        console.error("Errore inaspettato:", err);
    }
  };


  const deleteMember = async (id: string, deleteOrders: boolean) => {
    try {
      if (deleteOrders) {
        // Soft delete degli ordini - imposta status a 'deleted' invece di eliminarli
        const { error: deleteOrdersError } = await supabase
          .from("orders")
          .update({ status: 'deleted' })
          .eq("team_id", id);

        if (deleteOrdersError) {
          console.error("Errore durante l'archiviazione degli ordini:", deleteOrdersError.message);
          return;
        }
      }

      // Soft delete del membro - disattiva invece di eliminare
      const { error: deleteMemberError } = await supabase
        .from("team")
        .update({ is_active: false })
        .eq("id", id);

      if (deleteMemberError) {
        console.error("Errore durante la disattivazione del membro:", deleteMemberError.message);
        return;
      }

      // Rimuovi il membro dalla lista visibile (ma rimane nel database)
      setTeamMembers((prev) => prev.filter((member) => member.id !== id));
      
      toast.success("Membro disattivato con successo. Gli appuntamenti storici sono stati preservati.");
    } catch (err) {
      console.error("Errore inaspettato durante la disattivazione del membro:", err);
      toast.error("Errore durante la disattivazione del membro");
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditMember(member);
    setIsAddMemberModalOpen(true);
  };

  const handleUpdateMember = async (values: { name: string; email: string; phone_number: string }, { resetForm }: { resetForm: () => void }) => {
    if (!editMember) return;

    const { error } = await supabase
      .from("team")
      .update({ 
        name: values.name, 
        email: values.email, 
        phone_number: values.phone_number,
        role: "member" // Ensure role is always set to "member"
      })
      .eq("id", editMember.id);

    if (error) {
      console.error("Errore nell'aggiornamento del membro:", error.message);
    } else {
      resetForm();
      setIsAddMemberModalOpen(false);
      setTeamMembers((prev) =>
        prev.map((member) => (member.id === editMember.id ? { ...member, ...values } : member))
      );
      setEditMember(null);
    }
  };

  const uploadAvatar = async (file: File, memberId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${memberId}-${Date.now()}.${fileExt}`;
      const filePath = `team-avatars/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
      
        .from('zugflowhub')
        .upload(filePath, file,{ cacheControl: '3600',
          upsert: true,
          contentType: file.type, });
        

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('zugflowhub')
        .getPublicUrl(filePath);

      // Update team member record with new avatar URL
      const { error: updateError } = await supabase
        .from('team')
        .update({ avatar_url: publicUrl })
        .eq('id', memberId);

      if (updateError) {
        console.error('Error updating avatar URL:', updateError);
        return null;
      }

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      return null;
    }
  };

  const handleFileUploadClick = (memberId: string) => {
    setPhotoReplaceConfirm({
      isOpen: true,
      file: null,
      memberId,
    });
  };
  
  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>, memberId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    await processPhotoUpload(file, memberId);
  };

  const processPhotoUpload = async (file: File, memberId: string) => {
    const url = await uploadAvatar(file, memberId);
    if (url) {
      setTeamMembers(members =>
        members.map(member =>
          member.id === memberId ? { ...member, avatar_url: url } : member
        )
      );
    }
  };

  const handlePhotoReplaceConfirm = async () => {
    if (photoReplaceConfirm.memberId) {
      document.getElementById(`avatar-${photoReplaceConfirm.memberId}`)?.click();
    }
    setPhotoReplaceConfirm({ isOpen: false, file: null, memberId: null });
  };



  const handleCreateCollaborator = async (email: string, password: string, name: string) => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      return { success: false, error: "Nome, email e password non possono essere vuoti." };
    }

    try {
      const salonId = await getSalonId();
      if (!salonId) {
        return { success: false, error: "Impossibile recuperare il salon_id." };
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError || !user) {
        return { success: false, error: "Utente non autenticato. Effettua di nuovo il login." };
      }

      const res = await fetch('/api/member/create-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          name: name.trim(),
          salon_id: salonId,
        })
      });

      let result = null;
      try {
        result = await res.json();
      } catch (jsonErr) {
        console.error("Errore parsing JSON risposta:", jsonErr);
        return { success: false, error: "Risposta non valida dal server." };
      }

      if (res.ok && result && result.success) {
        console.log("Collaboratore creato con successo:", result);
        
        // Force refresh della lista membri
        await fetchTeamMembers();
        
        // Forza un refresh della pagina dopo un breve delay per assicurarsi che il collaboratore veda tutto
        setTimeout(() => {
          console.log("🔄 Refreshing page to ensure new collaborator can see all data...");
          // Non facciamo reload della pagina, ma mostriamo un messaggio di successo
        }, 1000);
        
        return { success: true };
      } else {
        console.error("Errore durante la creazione del collaboratore:", result?.error, result);
        return { success: false, error: result?.error || "Errore sconosciuto" };
      }
    } catch (error) {
      console.error("Errore durante la creazione del collaboratore:", error);
      return { success: false, error: "Errore di connessione" };
    }
  };

  if (isLoading || permissionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-4 h-4 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-4 h-4 rounded-full bg-purple-600 animate-bounce"></div>
        </div>
        <p className="mt-4 text-sm text-gray-500">Caricamento membri del team...</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 flex justify-center gap-6">
      {/* Description Section */}
      <div className="hidden md:block w-[300px]">
        <Card className="border-0 shadow-sm h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-[20px] font-semibold text-[#292d34]">
              Gestione Membri del Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-[14px] text-[#292d34]">
              <p className="leading-relaxed">
                In questa sezione puoi gestire:
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li>I membri del team del tuo salone</li>
                <li>I loro dati di contatto</li>
                <li>I colori associati a ciascun membro</li>
              </ul>
              <p className="mt-4 text-sm text-blue-600">
                Se sei un collaboratore, vedrai tutti i membri associati al tuo salone.
              </p>
              <div className="mt-6 p-4 bg-[#f8f8fa] rounded-md">
                <p className="text-[12px] text-[#666]">
                  Nota: Le modifiche ai membri del team influenzeranno la visualizzazione degli appuntamenti e la gestione degli ordini.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Section */}
      <Card className="border-0 shadow-sm w-full max-w-[600px]">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-[16px] font-medium text-[#292d34]">
              Membri del Team Salone
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddMemberModalOpen(true)} className="bg-black text-white text-sm px-3 py-2 hidden">
                Aggiungi Membro
              </Button>
              {hasPermission('canManageTeam') && (
                <Button 
                  onClick={async () => {
                    setIsCreateCollaboratorModalOpen(true);
                  }} 
                  className="bg-blue-600 text-white text-sm px-3 py-2">
                  Nuovo Collaboratore
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.length === 0 && !isLoading && (
              <div className="text-center text-gray-400 text-sm py-8">
                Nessun membro trovato. <br /> 
                Aggiungi un nuovo membro al team.
                <p className="mt-2 text-xs text-gray-500">
                  Salon ID: Non disponibile
                </p>
              </div>
            )}
            {teamMembers.map((member) => (
              <div 
                key={member.id}
                className="p-4 rounded-md border border-[#e6e8ef] space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar_url || "/default.png"} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {(hasPermission('canManageTeam') || member.user_id === currentUserId || (isManager && member.role === 'manager')) && (
                        <label 
                          onClick={() => handleFileUploadClick(member.id)}
                          className="absolute bottom-0 right-0 bg-black text-white rounded-full p-1 cursor-pointer hover:bg-gray-800"
                        >
                          <FaUpload size={10} />
                        </label>
                      )}
                      <input
                        type="file"
                        id={`avatar-${member.id}`}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileSelection(e, member.id)}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-[14px]" style={{ color: member.colorMember }}>
                        {member.name}
                      </h3>
                      <p className="text-[12px] text-gray-500">{member.email}</p>
                      <p className="text-[12px] text-gray-500">{member.phone_number}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {hasPermission('canManageTeam') && (
                      <Button 
                        onClick={() => handleEditMember(member)} 
                        className="bg-black text-white text-xs px-2 py-1"
                      >
                        Modifica
                      </Button>
                    )}
                    {hasPermission('canManageTeam') && member.role !== 'manager' && (
                      <Button 
                        onClick={() => setDeleteOptionsModal({ isOpen: true, memberId: member.id })} 
                        className="bg-orange-600 text-white text-xs px-2 py-1 hover:bg-orange-700"
                      >
                        Disattiva
                      </Button>
                    )}
                    {member.role === 'manager' && (
                      <div className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border">
                        👑 Manager
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keep existing modals */}
      {isAddMemberModalOpen && (
        <Dialog open={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen}>
          <DialogContent className="p-6 rounded-lg w-full max-w-md">
            <DialogHeader>
              <DialogTitle>{editMember ? "Modifica Membro del Team" : "Nuovo Membro del Team"}</DialogTitle>
            </DialogHeader>
            <Formik
              initialValues={editMember || { name: "", email: "", phone_number: "" }}
              enableReinitialize
              validationSchema={Yup.object({
                name: Yup.string().required("Il nome è obbligatorio"),
                email: Yup.string().email("Email non valida").required("L'email è obbligatoria"),
                phone_number: Yup.string().required("Il numero di telefono è obbligatorio"),
              })}
              onSubmit={editMember ? handleUpdateMember : async (values, { resetForm }) => {
                await addMember(values.name, values.email, values.phone_number, "#ff7da9"); // Colore di default
                resetForm();
                setIsAddMemberModalOpen(false);
              }}
            >
              {({ setFieldValue, values }) => (
                <Form className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Field name="name" as={Input} placeholder="Nome" />
                    <ErrorMessage name="name" component="div" className="text-red-500 text-xs" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Field name="email" as={Input} placeholder="Email" />
                    <ErrorMessage name="email" component="div" className="text-red-500 text-xs" />
                  </div>
                  <div>
                    <Label>Numero di Telefono</Label>
                    <Field name="phone_number" as={Input} placeholder="Numero di Telefono" />
                    <ErrorMessage name="phone_number" component="div" className="text-red-500 text-xs" />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" onClick={() => setIsAddMemberModalOpen(false)} className="bg-black text-white">
                      Annulla
                    </Button>
                    <Button type="submit" className="bg-black text-white">
                      Salva
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>
      )}

      {deleteOptionsModal.isOpen && (
        <Dialog open={deleteOptionsModal.isOpen} onOpenChange={(isOpen) => setDeleteOptionsModal({ isOpen, memberId: null })}>
          <DialogContent className="p-6 rounded-md max-w-xl mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-900">Conferma Disattivazione Membro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                <p className="text-blue-800 text-sm">
                  ℹ️ <strong>Disattivazione sicura:</strong> Il membro verrà nascosto dalle liste attive, 
                  ma tutti gli appuntamenti storici rimarranno intatti per mantenere la cronologia.
                </p>
              </div>
              <p className="text-sm text-gray-700">Vuoi archiviare anche gli appuntamenti di questo membro?</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <Button
                onClick={() => {
                  if (deleteOptionsModal.memberId) {
                    deleteMember(deleteOptionsModal.memberId, false);
                  }
                  setDeleteOptionsModal({ isOpen: false, memberId: null });
                }}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm px-4 py-2 rounded-md w-full sm:w-auto"
              >
                No, mantieni appuntamenti attivi
              </Button>
              <Button
                onClick={() => {
                  if (deleteOptionsModal.memberId) {
                    deleteMember(deleteOptionsModal.memberId, true);
                  }
                  setDeleteOptionsModal({ isOpen: false, memberId: null });
                }}
                className="bg-orange-600 text-white hover:bg-orange-700 text-sm px-4 py-2 rounded-md w-full sm:w-auto"
              >
                Sì, archivia anche appuntamenti
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {photoReplaceConfirm.isOpen && (
        <Dialog open={photoReplaceConfirm.isOpen} onOpenChange={(isOpen) => !isOpen && setPhotoReplaceConfirm({ isOpen: false, file: null, memberId: null })}>
          <DialogContent className="p-6 rounded-lg w-full max-w-md">
            <DialogHeader>
              <DialogTitle>Conferma Sostituzione Foto</DialogTitle>
            </DialogHeader>
            <div className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start space-x-3">
                <FaExclamationTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Attenzione!</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Esiste già una foto profilo per questo membro. Procedendo, la foto attuale verrà sostituita e non potrà essere recuperata.
                  </p>
                </div>
              </div>
            </div>
            <div className="my-4">
              <h4 className="font-medium text-gray-800 mb-2">Seleziona un avatar demo:</h4>
              <div className="grid grid-cols-5 gap-2">
                {demoAvatars.map((avatarUrl, index) => (
                  <img
                    key={index}
                    src={avatarUrl}
                    alt={`Avatar ${index + 1}`}
                    className="w-12 h-12 rounded-full cursor-pointer border hover:border-black"
                    onClick={async () => {
                      if (photoReplaceConfirm.memberId) {
                        const { error } = await supabase
                          .from('team')
                          .update({ avatar_url: avatarUrl })
                          .eq('id', photoReplaceConfirm.memberId);

                        if (!error) {
                          setTeamMembers((prev) =>
                            prev.map((member) =>
                              member.id === photoReplaceConfirm.memberId
                                ? { ...member, avatar_url: avatarUrl }
                                : member
                            )
                          );
                          toast.success('Avatar aggiornato con successo');
                        } else {
                          toast.error('Errore durante l\'aggiornamento dell\'avatar');
                        }
                      }
                      setPhotoReplaceConfirm({ isOpen: false, file: null, memberId: null });
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => setPhotoReplaceConfirm({ isOpen: false, file: null, memberId: null })}
                variant="outline"
                className="bg-gray-100"
              >
                Annulla
              </Button>
              <Button
                onClick={handlePhotoReplaceConfirm}
                className="bg-black text-white"
              >
                Upload Foto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* MODALE NUOVO COLLABORATORE */}
      {isCreateCollaboratorModalOpen && (
        <Dialog open={isCreateCollaboratorModalOpen} onOpenChange={setIsCreateCollaboratorModalOpen}>
          <DialogContent className="p-6 rounded-lg w-full max-w-md">
            <DialogHeader>
              <DialogTitle>Crea Nuovo Collaboratore</DialogTitle>
              <DialogDescription>
                Crea un nuovo account con accesso indipendente al sistema
              </DialogDescription>
            </DialogHeader>
            <Formik
              initialValues={{ name: "", email: "", password: "" }}
              validationSchema={Yup.object({
                name: Yup.string().required("Il nome è obbligatorio"),
                email: Yup.string().email("Email non valida").required("L'email è obbligatoria"),
                password: Yup.string().required("La password è obbligatoria").min(6, "La password deve essere di almeno 6 caratteri"),
              })}
              onSubmit={async (values, { setSubmitting, resetForm, setStatus }) => {
                setStatus(undefined);
                const result = await handleCreateCollaborator(values.email, values.password, values.name);
                setSubmitting(false);
                if (result.success) {
                  resetForm();
                  setIsCreateCollaboratorModalOpen(false);
                } else {
                  setStatus({ error: result.error || "Errore sconosciuto" });
                }
              }}
            >
              {({ isSubmitting, status }) => (
                <Form className="space-y-4">
                  {status && status.error && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                      <p className="text-red-600 text-sm">{status.error}</p>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="name">Nome Collaboratore</Label>
                    <Field name="name" as={Input} id="name" placeholder="Nome completo" />
                    <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Field name="email" as={Input} id="email" type="email" placeholder="email@esempio.com" />
                    <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="password">Password Provvisoria</Label>
                    <Field name="password" as={Input} id="password" type="password" placeholder="Almeno 6 caratteri" />
                    <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
                    <p className="text-xs text-gray-500 mt-1">
                      Il collaboratore potrà modificare la password dopo il primo accesso.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsCreateCollaboratorModalOpen(false)}
                    >
                      Annulla
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creazione..." : "Crea Collaboratore"}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GestioneMembri;

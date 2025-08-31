import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getSalonId } from '@/utils/getSalonId';

interface TeamMember {
  id: string;
  name: string;
  avatar_url?: string;
}

interface Group {
  id: string;
  name: string;
  created_at: string;
}

interface GroupMember {
  id: string;
  group_id: string;
  team_member_id: string;
  created_at: string;
}

const supabase = createClient();

const GestionGruppi = ({ teamMembers }: { teamMembers: TeamMember[] }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchGroupMembers();
  }, []);

  const fetchGroups = async () => {
    setGroupLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      // Get salon_id for the current user
      const salonId = await getSalonId();
      if (!salonId) {
        console.error("No salon_id found for user");
        return;
      }

      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("salon_id", salonId)
        .order("created_at", { ascending: true });
      if (!error && data) setGroups(data);
    } finally {
      setGroupLoading(false);
    }
  };

  const fetchGroupMembers = async () => {
    try {
      // Get salon_id for the current user
      const salonId = await getSalonId();
      if (!salonId) {
        console.error("No salon_id found for user");
        return;
      }

      const { data, error } = await supabase
        .from("chat_group_members")
        .select("*, groups!inner(salon_id)")
        .eq("groups.salon_id", salonId);
        
      if (!error && data) setGroupMembers(data);
    } catch (err) {
      console.error("Error fetching group members:", err);
    }
  };

  const handleOpenGroupModal = (group?: Group) => {
    setEditGroup(group || null);
    setGroupName(group?.name || "");
    if (group) {
      const memberIds = groupMembers.filter(gm => gm.group_id === group.id).map(gm => gm.team_member_id);
      setSelectedGroupMembers(memberIds);
    } else {
      setSelectedGroupMembers([]);
    }
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async () => {
    if (groupLoading) return;
    setGroupLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      // Get salon_id for the current user
      const salonId = await getSalonId();
      if (!salonId) {
        console.error("No salon_id found for user");
        return;
      }

      let groupId = editGroup?.id;
      if (editGroup) {
        await supabase.from("groups").update({ name: groupName }).eq("id", editGroup.id);
        setGroups(prev =>
          prev.map(g => g.id === editGroup.id ? { ...g, name: groupName } : g)
        );
      } else {
        const { data, error } = await supabase
          .from("groups")
          .insert([{ name: groupName, salon_id: salonId }])
          .select()
          .single();
        if (error) throw error;
        groupId = data.id;
        setGroups(prev => [...prev, data]);
      }
      if (groupId) {
        await supabase.from("chat_group_members").delete().eq("group_id", groupId);
        if (selectedGroupMembers.length > 0) {
          const inserts = selectedGroupMembers.map(memberId => ({
            group_id: groupId,
            team_member_id: memberId,
          }));
          const { data: insertedMembers } = await supabase.from("chat_group_members").insert(inserts).select();
          setGroupMembers(prev =>
            [
              ...prev.filter(gm => gm.group_id !== groupId),
              ...(insertedMembers || [])
            ]
          );
        }
      } else {
        setGroupMembers(prev => prev.filter(gm => gm.group_id !== groupId));
      }
      setIsGroupModalOpen(false);
      setEditGroup(null);
      setGroupName("");
      setSelectedGroupMembers([]);
    } catch (err) {
      // Gestione errori silenziosa
    } finally {
      setGroupLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setGroupLoading(true);
    try {
      await supabase.from("groups").delete().eq("id", groupId);
      await supabase.from("chat_group_members").delete().eq("group_id", groupId);
      fetchGroups();
      fetchGroupMembers();
    } finally {
      setGroupLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-6 mt-6">
      <div className="w-full max-w-[600px]">
        <Card className="border-0 shadow-sm w-full">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[16px] font-medium text-[#292d34] flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Gruppi di Lavoro
              </CardTitle>
            </div>
            <Button onClick={() => handleOpenGroupModal()} className="bg-purple-700 text-white text-sm px-3 py-2">
              Nuovo Gruppo
            </Button>
          </CardHeader>
          <CardContent>
            {groupLoading ? (
              <div className="text-gray-400 text-sm">Caricamento gruppi...</div>
            ) : groups.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">
                Nessun gruppo trovato.<br />
                <span className="text-xs text-gray-500">Crea il tuo primo gruppo di lavoro.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map(group => {
                  const membersInGroup = groupMembers
                    .filter(gm => gm.group_id === group.id)
                    .map(gm => teamMembers.find(tm => tm.id === gm.team_member_id))
                    .filter(Boolean) as TeamMember[];
                  return (
                    <div key={group.id} className="flex flex-col gap-2 p-4 rounded-md border border-[#e6e8ef] bg-purple-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-purple-900">{group.name}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({membersInGroup.length} membri)
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-purple-700 text-white text-xs px-2 py-1"
                            onClick={() => handleOpenGroupModal(group)}>
                            Modifica
                          </Button>
                          <Button size="sm" className="bg-gray-200 text-gray-700 text-xs px-2 py-1"
                            onClick={() => handleDeleteGroup(group.id)}>
                            Elimina
                          </Button>
                        </div>
                      </div>
                      {membersInGroup.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {membersInGroup.map((member) => (
                            <div key={member.id} className="flex items-center gap-2 px-2 py-1 bg-white border border-purple-200 rounded text-xs text-purple-800">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.avatar_url || "/default.png"} alt={member.name} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{member.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 mt-2">Nessun membro assegnato</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODALE GRUPPO */}
      {isGroupModalOpen && (
        <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
          <DialogContent className="p-6 rounded-lg w-full max-w-md">
            <DialogHeader>
              <DialogTitle>{editGroup ? "Modifica Gruppo" : "Nuovo Gruppo"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSaveGroup();
              }}
              className="space-y-4"
            >
              <div>
                <Label>Nome Gruppo</Label>
                <Input
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Nome del gruppo"
                  required
                />
              </div>
              <div>
                <Label>Membri del Gruppo</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {teamMembers.map(member => (
                    <label key={member.id} className="flex items-center gap-2 cursor-pointer px-2 py-1 bg-white border border-purple-100 rounded">
                      <input
                        type="checkbox"
                        checked={selectedGroupMembers.includes(member.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedGroupMembers(prev => [...prev, member.id]);
                          } else {
                            setSelectedGroupMembers(prev => prev.filter(id => id !== member.id));
                          }
                        }}
                        className="accent-purple-600"
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar_url || "/default.png"} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={() => setIsGroupModalOpen(false)} className="bg-black text-white">
                  Annulla
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-700 text-white"
                  disabled={groupLoading}
                >
                  Salva Gruppo
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GestionGruppi;

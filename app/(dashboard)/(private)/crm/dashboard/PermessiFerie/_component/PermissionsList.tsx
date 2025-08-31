'use client';

import React from 'react';
import { 
  Filter, 
  Search, 
  Settings, 
  Check, 
  X, 
  Edit, 
  Trash 
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Member } from './types';

interface Permission {
  id: string;
  member_id: string;
  member_name: string;
  type: string;
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  reason: string;
  notes?: string;
}

interface PermissionsListProps {
  permissions: Permission[];
  members: Member[];
  isManager: boolean;
  currentUser: any;
  selectedMember: string;
  selectedStatus: string;
  selectedType: string;
  searchTerm: string;
  onMemberChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onUpdateStatus: (permissionId: string, status: 'approved' | 'rejected') => void;
  onEdit: (permission: Permission) => void;
  onDelete: (permissionId: string) => void;
}

export default function PermissionsList({
  permissions,
  members,
  isManager,
  currentUser,
  selectedMember,
  selectedStatus,
  selectedType,
  searchTerm,
  onMemberChange,
  onStatusChange,
  onTypeChange,
  onSearchChange,
  onUpdateStatus,
  onEdit,
  onDelete
}: PermissionsListProps) {

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ferie': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'permesso': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'malattia': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesMember = selectedMember === 'all' || permission.member_id === selectedMember;
    const matchesStatus = selectedStatus === 'all' || permission.status === selectedStatus;
    const matchesType = selectedType === 'all' || permission.type === selectedType;
    const matchesSearch = permission.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesMember && matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Filters - Solo per i manager */}
      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Cerca</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome o motivo..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member">Membro</Label>
                <Select value={selectedMember} onValueChange={onMemberChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i membri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i membri</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Stato</Label>
                <Select value={selectedStatus} onValueChange={onStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti gli stati" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="pending">In attesa</SelectItem>
                    <SelectItem value="approved">Approvato</SelectItem>
                    <SelectItem value="rejected">Rifiutato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={selectedType} onValueChange={onTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="ferie">Ferie</SelectItem>
                    <SelectItem value="permesso">Permesso</SelectItem>
                    <SelectItem value="malattia">Malattia</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isManager ? `Permessi (${filteredPermissions.length})` : 'I Miei Permessi'}
          </CardTitle>
          {!isManager && (
            <CardDescription>
              Puoi vedere solo i tuoi permessi. I manager possono vedere e gestire tutti i permessi del team.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  {isManager && <TableHead>Membro</TableHead>}
                  <TableHead>Tipo</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    {isManager && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={members.find(m => m.id === permission.member_id)?.avatar_url} />
                            <AvatarFallback>
                              {permission.member_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{permission.member_name}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={getTypeColor(permission.type)}>
                        {permission.type === 'ferie' && 'Ferie'}
                        {permission.type === 'permesso' && 'Permesso'}
                        {permission.type === 'malattia' && 'Malattia'}
                        {permission.type === 'altro' && 'Altro'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(permission.start_date)}</div>
                        {permission.start_date !== permission.end_date && (
                          <div className="text-muted-foreground">
                            al {formatDate(permission.end_date)}
                          </div>
                        )}
                        {permission.start_time && permission.end_time && (
                          <div className="text-xs text-muted-foreground">
                            {permission.start_time} - {permission.end_time}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={permission.reason}>
                        {permission.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(permission.status)}>
                        {permission.status === 'pending' && 'In attesa'}
                        {permission.status === 'approved' && 'Approvato'}
                        {permission.status === 'rejected' && 'Rifiutato'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <span className="sr-only">Apri menu</span>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Solo i manager possono approvare/rifiutare permessi di altri (non i propri) */}
                          {isManager && permission.status === 'pending' && permission.member_id !== members.find(m => m.user_id === currentUser?.id)?.id && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onUpdateStatus(permission.id, 'approved')}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approva
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onUpdateStatus(permission.id, 'rejected')}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Rifiuta
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {/* Solo i manager possono modificare/eliminare permessi */}
                          {isManager && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onEdit(permission)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifica
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDelete(permission.id)}
                                className="text-red-600"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Elimina
                              </DropdownMenuItem>
                            </>
                          )}
                          {/* I membri possono eliminare solo i propri permessi in attesa */}
                          {!isManager && permission.member_id === members.find(m => m.user_id === currentUser?.id)?.id && permission.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => onDelete(permission.id)}
                              className="text-red-600"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
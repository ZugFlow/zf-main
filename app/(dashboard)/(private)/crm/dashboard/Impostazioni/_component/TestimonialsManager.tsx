'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Star,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  Eye,
  EyeOff,
  MessageSquare,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const supabase = createClient();

interface Testimonial {
  id: string;
  salon_id: string;
  client_name: string;
  client_email?: string;
  rating: number;
  comment: string;
  service_name?: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface TestimonialsManagerProps {
  salonId: string;
}

export default function TestimonialsManager({ salonId }: TestimonialsManagerProps) {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    rating: 5,
    comment: '',
    service_name: ''
  });

  useEffect(() => {
    fetchTestimonials();
  }, [salonId]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/salon-web/testimonials?salon_id=${salonId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nel caricamento dei testimonial');
      }

      setTestimonials(data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i testimonial.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.comment) {
      toast({
        title: "Campi obbligatori",
        description: "Nome cliente e commento sono obbligatori.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/salon-web/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salonId,
          ...formData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nel salvataggio');
      }

      toast({
        title: "Successo",
        description: "Testimonial aggiunto con successo (in attesa di approvazione).",
      });

      resetForm();
      fetchTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio del testimonial.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (testimonialId: string, isApproved: boolean, isFeatured: boolean = false) => {
    try {
      const response = await fetch('/api/salon-web/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testimonial_id: testimonialId,
          is_approved: isApproved,
          is_featured: isFeatured
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nell\'approvazione');
      }

      toast({
        title: "Successo",
        description: isApproved ? "Testimonial approvato con successo." : "Testimonial rifiutato.",
      });

      fetchTestimonials();
    } catch (error) {
      console.error('Error approving testimonial:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'approvazione del testimonial.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (testimonialId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo testimonial?')) return;

    try {
      const response = await fetch(`/api/salon-web/testimonials?testimonial_id=${testimonialId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nell\'eliminazione');
      }

      toast({
        title: "Successo",
        description: "Testimonial eliminato con successo.",
      });

      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione del testimonial.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_email: '',
      rating: 5,
      comment: '',
      service_name: ''
    });
    setEditingTestimonial(null);
    setShowForm(false);
  };

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = testimonial.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testimonial.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (testimonial.service_name && testimonial.service_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedStatus === 'approved') return matchesSearch && testimonial.is_approved;
    if (selectedStatus === 'pending') return matchesSearch && !testimonial.is_approved;
    if (selectedStatus === 'featured') return matchesSearch && testimonial.is_featured;
    return matchesSearch;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Testimonial</h2>
          <p className="text-gray-600">Gestisci le recensioni dei clienti del tuo salone</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Testimonial
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca testimonial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="all">Tutti i testimonial</option>
                <option value="approved">Approvati</option>
                <option value="pending">In attesa</option>
                <option value="featured">In evidenza</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Aggiungi Testimonial</CardTitle>
                <CardDescription>
                  Aggiungi una nuova recensione per il tuo salone
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome Cliente *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="Nome del cliente"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email Cliente</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Valutazione</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${star <= formData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">{formData.rating}/5</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_name">Servizio</Label>
                <Input
                  id="service_name"
                  value={formData.service_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                  placeholder="Servizio ricevuto (opzionale)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Commento *</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="La recensione del cliente..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Aggiungi Testimonial'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Testimonials List */}
      {filteredTestimonials.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun testimonial trovato</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Aggiungi il primo testimonial per il tuo salone'
                }
              </p>
              {!searchTerm && selectedStatus === 'all' && (
                <Button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Testimonial
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTestimonials.map((testimonial) => (
            <Card key={testimonial.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{testimonial.client_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              {renderStars(testimonial.rating)}
                            </div>
                            <span>•</span>
                            <span>{testimonial.rating}/5</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {testimonial.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            In evidenza
                          </Badge>
                        )}
                        {testimonial.is_approved ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Approvato
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            In attesa
                          </Badge>
                        )}
                      </div>
                    </div>

                    <blockquote className="text-gray-700 italic border-l-4 border-violet-200 pl-4">
                      "{testimonial.comment}"
                    </blockquote>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {testimonial.service_name && (
                        <div className="flex items-center gap-1">
                          <span>Servizio:</span>
                          <Badge variant="outline" className="text-xs">
                            {testimonial.service_name}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(testimonial.created_at).toLocaleDateString('it-IT')}</span>
                      </div>
                      {testimonial.client_email && (
                        <div className="flex items-center gap-1">
                          <span>Email:</span>
                          <span className="text-violet-600">{testimonial.client_email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:flex-shrink-0">
                    {!testimonial.is_approved && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(testimonial.id, true, false)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Approva
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(testimonial.id, true, true)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Approva e Evidenzia
                        </Button>
                      </>
                    )}
                    {testimonial.is_approved && !testimonial.is_featured && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(testimonial.id, true, true)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Metti in Evidenza
                      </Button>
                    )}
                    {testimonial.is_featured && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(testimonial.id, true, false)}
                        variant="outline"
                      >
                        <EyeOff className="h-3 w-3 mr-1" />
                        Rimuovi Evidenza
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(testimonial.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Elimina
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 
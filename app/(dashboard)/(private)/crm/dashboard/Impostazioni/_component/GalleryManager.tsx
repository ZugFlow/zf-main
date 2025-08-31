'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Image as ImageIcon,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Save,
  X,
  Search,
  Filter,
  Grid3X3,
  List,
  Camera
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const supabase = createClient();

interface GalleryImage {
  id: string;
  salon_id: string;
  title: string;
  description?: string;
  image_url: string;
  image_alt?: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface GalleryManagerProps {
  salonId: string;
}

export default function GalleryManager({ salonId }: GalleryManagerProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    image_alt: '',
    category: 'general',
    sort_order: 0
  });

  useEffect(() => {
    fetchGalleryImages();
  }, [salonId]);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/salon-web/gallery?salon_id=${salonId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nel caricamento della galleria');
      }

      setImages(data);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le immagini della galleria.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // File handling functions
  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File troppo grande",
        description: "L'immagine deve essere inferiore a 10MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo di file non valido",
        description: "Seleziona solo file immagine (JPG, PNG, GIF).",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const uploadImageToSupabase = async (): Promise<string | null> => {
    if (!selectedFile || !salonId) return null;
    
    setUploading(true);
    
    try {
      // Genera nome file unico
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `gallery-${Date.now()}.${fileExt}`;
      const filePath = `salons/${salonId}/gallery/${fileName}`;
      
      // Upload file
      const { data, error } = await supabase.storage
        .from('salon-assets')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Ottieni URL pubblico
      const { data: urlData } = supabase.storage
        .from('salon-assets')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Errore nel caricamento",
        description: "Impossibile caricare l'immagine. Riprova più tardi.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast({
        title: "Campi obbligatori",
        description: "Il titolo è obbligatorio.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formData.image_url;

      // Se c'è un file selezionato, caricalo prima
      if (selectedFile) {
        const uploadedUrl = await uploadImageToSupabase();
        if (!uploadedUrl) {
          return; // Error already handled in uploadImageToSupabase
        }
        imageUrl = uploadedUrl;
      }

      // Se non c'è né un file né un URL, mostra errore
      if (!imageUrl) {
        toast({
          title: "Immagine richiesta",
          description: "Seleziona un'immagine o inserisci un URL.",
          variant: "destructive",
        });
        return;
      }

      const url = editingImage 
        ? `/api/salon-web/gallery`
        : `/api/salon-web/gallery`;
      
      const method = editingImage ? 'PUT' : 'POST';
      const body = editingImage 
        ? { gallery_id: editingImage.id, ...formData, image_url: imageUrl }
        : { salon_id: salonId, ...formData, image_url: imageUrl };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nel salvataggio');
      }

      toast({
        title: "Successo",
        description: editingImage 
          ? "Immagine aggiornata con successo."
          : "Immagine aggiunta con successo.",
      });

      resetForm();
      fetchGalleryImages();
    } catch (error) {
      console.error('Error saving image:', error);
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio dell'immagine.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa immagine?')) return;

    try {
      const response = await fetch(`/api/salon-web/gallery?gallery_id=${imageId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nell\'eliminazione');
      }

      toast({
        title: "Successo",
        description: "Immagine eliminata con successo.",
      });

      fetchGalleryImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione dell'immagine.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      description: image.description || '',
      image_url: image.image_url,
      image_alt: image.image_alt || '',
      category: image.category,
      sort_order: image.sort_order
    });
    setImagePreview(image.image_url);
    setSelectedFile(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      image_alt: '',
      category: 'general',
      sort_order: 0
    });
    setEditingImage(null);
    setSelectedFile(null);
    setImagePreview(null);
    setShowForm(false);
    setIsDragOver(false);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (image.description && image.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || image.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(images.map(img => img.category)))];

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
          <h2 className="text-2xl font-bold text-gray-900">Galleria Immagini</h2>
          <p className="text-gray-600">Gestisci le immagini della galleria del tuo salone</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Immagine
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
                  placeholder="Cerca immagini..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Tutte le categorie' : category}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-3"
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{editingImage ? 'Modifica Immagine' : 'Aggiungi Immagine'}</CardTitle>
                <CardDescription>
                  {editingImage ? 'Modifica i dettagli dell\'immagine' : 'Aggiungi una nuova immagine alla galleria'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload Section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Immagine *</Label>
                
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver 
                      ? 'border-violet-500 bg-violet-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative mx-auto w-48 h-48">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                          onClick={() => {
                            setImagePreview(null);
                            setSelectedFile(null);
                            setFormData(prev => ({ ...prev, image_url: '' }));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        {selectedFile ? selectedFile.name : 'Immagine selezionata'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Trascina un'immagine qui o clicca per selezionare
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={triggerFileSelect}
                          className="bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Seleziona Immagine
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        JPG, PNG, GIF fino a 10MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {/* URL Input (alternative to file upload) */}
                <div className="space-y-2">
                  <Label htmlFor="image_url" className="text-sm text-gray-600">
                    Oppure inserisci un URL immagine
                  </Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    disabled={!!selectedFile}
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titolo *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titolo dell'immagine"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="es. tagli, colorazioni, ambiente"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image_alt">Testo Alternativo</Label>
                <Input
                  id="image_alt"
                  value={formData.image_alt}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_alt: e.target.value }))}
                  placeholder="Descrizione dell'immagine per l'accessibilità"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrizione opzionale dell'immagine"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordine</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={saving || uploading} 
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving || uploading ? 'Salvando...' : (editingImage ? 'Aggiorna' : 'Aggiungi')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Gallery Grid/List */}
      {filteredImages.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna immagine trovata</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Aggiungi la tua prima immagine alla galleria'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <Button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Immagine
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {filteredImages.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={image.image_url}
                  alt={image.image_alt || image.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(image)}
                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(image.id)}
                    className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-500 text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {!image.is_active && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-gray-500 text-white">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Inattiva
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 truncate">{image.title}</h3>
                  {image.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{image.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {image.category}
                    </Badge>
                    <span className="text-xs text-gray-500">Ordine: {image.sort_order}</span>
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
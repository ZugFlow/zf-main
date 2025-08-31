'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, RotateCw, ZoomIn, ZoomOut, Check, X, Upload } from 'lucide-react'
import Cropper from 'react-easy-crop'
import { Area } from 'react-easy-crop/types'

interface ImageCropperProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string | null
  onCropComplete: (croppedBlob: Blob) => Promise<void>
  onImageReload?: (newImageSrc: string) => void
  aspectRatio?: number
  title?: string
}

export default function ImageCropper({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  onImageReload,
  aspectRatio = 1,
  title = "Modifica Immagine"
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentImageSrc(imageSrc)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setCroppedAreaPixels(null)
      setIsLoading(false)
    }
  }, [isOpen, imageSrc])

  const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', error => reject(error))
      image.src = url
    })

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    const maxSize = Math.max(image.width, image.height)
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

    canvas.width = safeArea
    canvas.height = safeArea

    ctx.translate(safeArea / 2, safeArea / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-safeArea / 2, -safeArea / 2)

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    )

    const data = ctx.getImageData(0, 0, safeArea, safeArea)

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.putImageData(
      data,
      0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
      0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
    )

    return new Promise(resolve => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob)
        }
      }, 'image/jpeg', 0.9)
    })
  }

  const handleCropConfirm = async () => {
    if (!currentImageSrc || !croppedAreaPixels) {
      return
    }

    setIsLoading(true)
    try {
      const croppedImage = await getCroppedImg(
        currentImageSrc,
        croppedAreaPixels,
        rotation
      )
      
      await onCropComplete(croppedImage)
      handleClose()
    } catch (error) {
      console.error('Errore durante il cropping:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    setIsLoading(false)
    setCurrentImageSrc(null)
    onClose()
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleCenter = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }



  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleZoomOut}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <Button
                onClick={handleZoomIn}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              onClick={handleRotate}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Ruota
            </Button>
            
            <Button
              onClick={handleCenter}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Centra
            </Button>
          </div>
          
          {/* Instructions */}
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p><strong>Suggerimento:</strong> Usa i controlli per zoomare e ruotare l'immagine, poi trascina per centrare l'area di ritaglio. Puoi anche ricaricare la stessa foto per sovrascriverla.</p>
          </div>

          {/* Crop Area */}
          <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-lg h-96">
            {currentImageSrc && (
              <Cropper
                image={currentImageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropCompleteCallback}
                showGrid={true}
                objectFit="contain"
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f3f4f6'
                  },
                  cropAreaStyle: {
                    border: '2px solid #3b82f6',
                    color: 'rgba(59, 130, 246, 0.5)'
                  }
                }}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pb-4">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Annulla
            </Button>
            <Button
              onClick={handleCropConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="h-4 w-4" />
              {isLoading ? 'Caricamento...' : 'Salva'}
            </Button>
          </div>


        </div>
      </DialogContent>
    </Dialog>
  )
} 
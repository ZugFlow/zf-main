'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapComponentProps {
  coordinates: [number, number]
  title: string
  address: string
}

export default function MapComponent({ coordinates, title, address }: MapComponentProps) {
  return (
    <MapContainer
      {...{ center: coordinates } as any}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        {...{ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } as any}
      />
      <Marker position={coordinates}>
        <Popup>
          <div className="text-center">
            <h4 className="font-bold text-gray-900 text-sm mb-1">
              {title}
            </h4>
            <p className="text-xs text-gray-600">
              {address}
            </p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}

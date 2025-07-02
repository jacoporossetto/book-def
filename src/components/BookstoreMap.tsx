// File: src/components/BookstoreMap.tsx

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Dati delle librerie di Padova
const bookstores = [
  ];

// --- SOLUZIONE DEFINITIVA: Utilizziamo Leaflet.js direttamente ---
const BookstoreMap = () => {
  // Usiamo un 'ref' per ottenere un riferimento al div che conterrà la mappa
  const mapRef = useRef<HTMLDivElement>(null);
  // Usiamo un ref per tenere traccia dell'istanza della mappa, per evitare di crearla due volte
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Eseguiamo questo codice solo una volta, dopo che il componente è stato montato
    // e solo se il div della mappa esiste e non è già stata creata una mappa
    if (mapRef.current && !mapInstanceRef.current) {
        
      // Creiamo l'icona personalizzata per i marker
      const icon = new L.Icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
      });

      // 1. Creiamo l'istanza della mappa
      const map = L.map(mapRef.current).setView([45.4064, 11.8768], 15);
      mapInstanceRef.current = map; // Salviamo l'istanza

      // 2. Aggiungiamo lo strato di mattonelle (la mappa vera e propria)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // 3. Aggiungiamo un marker per ogni libreria
      bookstores.forEach(store => {
        L.marker([store.lat, store.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${store.name}</b><br>${store.address}`);
      });
    }

    // Funzione di pulizia: quando il componente viene smontato, distruggiamo la mappa
    // per liberare memoria ed evitare errori
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // L'array vuoto assicura che questo effetto venga eseguito solo una volta

  return (
    <div className="p-4">
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="text-purple-600"/> Librerie Indipendenti a Padova</CardTitle>
          <CardDescription>Scopri e sostieni le piccole librerie che aderiscono al progetto.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Questo div è il contenitore della nostra mappa */}
          <div id="map" ref={mapRef} className="h-[calc(100vh-200px)] rounded-lg z-0" />
        </CardContent>
      </Card>
    </div>
  );
};

export default BookstoreMap;
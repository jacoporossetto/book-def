import { useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BookMarked, Navigation } from 'lucide-react';

// Dati di esempio per le librerie indipendenti a Padova
const bookstores = [
  {
    name: "Libreria Universitaria",
    address: "Via San Francesco, 123, Padova",
    lat: 45.4064,
    lng: 11.8768
  }
];

// Componente React per l'icona del marker, che verrà convertito in HTML
const MarkerIcon = () => (
    <div className="relative flex items-center justify-center">
        <BookMarked className="w-5 h-5 text-white" strokeWidth={2.5}/>
    </div>
);

const BookstoreMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null); // Usiamo 'any' per evitare problemi di tipo con L dinamico
  const isMapInitialized = useRef(false);

  useEffect(() => {
    if (isMapInitialized.current) return;
    isMapInitialized.current = true;

    // Caricamento dinamico del CSS di Leaflet
    const leafletCss = document.createElement('link');
    leafletCss.rel = 'stylesheet';
    leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    leafletCss.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    leafletCss.crossOrigin = '';
    document.head.appendChild(leafletCss);

    // Caricamento dinamico dello script di Leaflet
    import('leaflet').then(L => {
        if (mapRef.current && !mapInstanceRef.current) {
            
          // Creiamo l'icona personalizzata del marker in stile Booksnap
          const customMarkerHtml = renderToStaticMarkup(<MarkerIcon />);
          const icon = new L.DivIcon({
              html: `<div style="background-color: #147979; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 2px solid white;">${customMarkerHtml}</div>`,
              className: '', // Rimuoviamo le classi di default per evitare conflitti di stile
              iconSize: [40, 40],
              iconAnchor: [20, 40], // Posiziona la punta del marker correttamente
              popupAnchor: [0, -40] // Posiziona il popup sopra il marker
          });

          // Inizializza la mappa centrata su Padova
          const map = L.map(mapRef.current, { zoomControl: false }).setView([45.408, 11.878], 14);
          L.control.zoom({ position: 'topright' }).addTo(map);
          mapInstanceRef.current = map;

          // Aggiunge uno strato di mappa con uno stile minimale (CartoDB Voyager)
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
          }).addTo(map);

          // Aggiunge i marker per ogni libreria
          bookstores.forEach(store => {
            // --- MODIFICA CHIAVE ---
            // Creiamo l'URL per la navigazione con Google Maps
            const encodedAddress = encodeURIComponent(store.address);
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
            
            // Creiamo il contenuto HTML per il popup con il pulsante "Naviga"
            const popupContent = `
              <div style="font-family: sans-serif; line-height: 1.5; text-align: center;">
                <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 4px 0;">${store.name}</h3>
                <p style="margin: 0 0 12px 0; color: #555;">${store.address}</p>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 16px; background-color: #147979; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                  Naviga
                </a>
              </div>
            `;

            L.marker([store.lat, store.lng], { icon })
              .addTo(map)
              .bindPopup(popupContent);
          });
        }
    }).catch(error => console.error("Failed to load Leaflet", error));
    
    // Funzione di pulizia per distruggere la mappa quando il componente viene smontato
    return () => {
      if (document.head.contains(leafletCss)) {
        document.head.removeChild(leafletCss);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        isMapInitialized.current = false;
      }
    };
  }, []);

  return (
    // Il contenitore della mappa è ora più pulito e si adatta al layout del Dashboard
    <div 
        id="map" 
        ref={mapRef} 
        className="h-[calc(100vh-150px)] w-full rounded-lg z-0 shadow-inner bg-gray-200" 
    />
  );
};

export default BookstoreMap;

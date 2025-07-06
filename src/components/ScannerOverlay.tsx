import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ScannerOverlayProps {
  onCancel: () => void;
}

/**
 * Questo componente crea un'interfaccia a schermo intero per la scansione.
 * Utilizza un React Portal per essere renderizzato al di fuori della gerarchia
 * principale dell'app, garantendo che sia sempre in primo piano.
 */
export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ onCancel }) => {
  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      {/* Mirino con angoli evidenziati */}
      <div className="relative w-full max-w-sm h-48 bg-transparent rounded-lg overflow-hidden">
        <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-xl"></div>
        
        {/* Linea laser animata */}
        <div 
          className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_10px_red,0_0_20px_red]"
          style={{ animation: 'scan-line 2.5s infinite ease-in-out' }}
        ></div>
      </div>

      <p className="text-white text-xl font-semibold mt-8 text-center">
        Inquadra il codice a barre
      </p>

      <Button 
        variant="outline" 
        className="mt-16 bg-white/20 border-white/50 text-white hover:bg-white/30 hover:text-white"
        onClick={onCancel}
      >
        <X className="w-5 h-5 mr-2" />
        Annulla Scansione
      </Button>
    </div>,
    document.body
  );
};

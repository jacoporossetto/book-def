// src/components/BarcodeScanner.tsx

import React, { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, Result, NotFoundException } from '@zxing/library';

// Definiamo le props che il componente accetterà
interface BarcodeScannerProps {
  onScanSuccess: (result: string) => void; // Funzione da chiamare quando un codice viene letto
  onScanError: (error: string) => void;   // Funzione da chiamare in caso di errore
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanError }) => {
  // Usiamo useRef per ottenere un riferimento all'elemento <video> nel DOM
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = new BrowserMultiFormatReader();

  useEffect(() => {
    // Questa funzione avvia la scansione
    const startScanning = async () => {
      if (!videoRef.current) {
        return;
      }

      try {
        // Chiediamo l'accesso alla fotocamera posteriore (environment)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Necessario per iOS
        videoRef.current.play();

        // Iniziamo a decodificare il video stream
        codeReader.decodeFromStream(stream, videoRef.current, (result: Result | undefined, err: Error | undefined) => {
          if (result) {
            // Se troviamo un risultato, fermiamo la scansione e chiamiamo la funzione di successo
            onScanSuccess(result.getText());
            codeReader.reset(); // Ferma la scansione
          }
          if (err && !(err instanceof NotFoundException)) {
            // Se c'è un errore (diverso dal "non ho trovato nulla"), lo gestiamo
            onScanError('Errore durante la scansione: ' + err.message);
            codeReader.reset();
          }
        });

      } catch (error) {
        // Gestiamo gli errori più comuni (es. permesso negato)
        console.error("Errore nell'accesso alla fotocamera:", error);
        if (error instanceof Error) {
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                onScanError('Permesso per la fotocamera negato. Per favore, abilitalo nelle impostazioni del browser.');
            } else {
                onScanError('Impossibile accedere alla fotocamera: ' + error.message);
            }
        }
      }
    };

    startScanning();

    // Funzione di cleanup: viene eseguita quando il componente viene "smontato"
    return () => {
      console.log('Stopping scanner...');
      codeReader.reset();
    };
  }, [onScanSuccess, onScanError, codeReader]);

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '100%' }}>
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          border: '2px solid red',
          width: '80%',
          height: '30%',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
      }}></div>
      <p style={{ position: 'absolute', bottom: '20px', color: 'white', textAlign: 'center', width: '100%', textShadow: '1px 1px 2px black' }}>
        Inquadra il codice a barre del libro
      </p>
    </div>
  );
};

export default BarcodeScanner;
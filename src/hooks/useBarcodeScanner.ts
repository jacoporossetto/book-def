import { useState, useEffect, useCallback } from 'react';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

export const useBarcodeScanner = () => {
  const [isScannerAvailable, setIsScannerAvailable] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Utilizziamo il controllo dei permessi per verificare la disponibilità.
  // Se questo comando genera un errore, significa che il plugin non è supportato.
  const checkScannerAvailability = useCallback(async () => {
    try {
      await BarcodeScanner.checkPermission({ force: false });
      setIsScannerAvailable(true);
    } catch (error) {
      console.error("Scanner non pienamente supportato su questo dispositivo:", error);
      setIsScannerAvailable(false);
    }
  }, []);

  // Eseguiamo il controllo una sola volta
  useEffect(() => {
    checkScannerAvailability();
  }, [checkScannerAvailability]);

  const startScan = async (): Promise<string | null> => {
    // Prima di scansionare, verifichiamo di nuovo i permessi, questa volta forzando la richiesta all'utente
    const status = await BarcodeScanner.checkPermission({ force: true });
    if (!status.granted) {
      alert('Per usare lo scanner, devi concedere i permessi alla fotocamera dalle impostazioni del telefono.');
      return null;
    }

    BarcodeScanner.hideBackground();
    document.body.classList.add('barcode-scanning');
    setIsScanning(true);

    try {
      const result = await BarcodeScanner.startScan();
      return result.hasContent ? result.content : null;
    } catch (error) {
      console.log('Scansione annullata dall\'utente.');
      return null;
    } finally {
      // In ogni caso, ripristiniamo l'interfaccia
      BarcodeScanner.showBackground();
      document.body.classList.remove('barcode-scanning');
      setIsScanning(false);
    }
  };

  // Restituiamo tutte le proprietà necessarie al componente BookScanner
  return { isScannerAvailable, isScanning, checkScannerAvailability, startScan };
};
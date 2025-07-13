import { useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
} from '@zxing/library';

/**
 * Hook per la scansione di codici a barre tramite FOTO.
 * Utilizza il plugin @capacitor/camera per scattare una foto e ZXing-js per analizzarla.
 * QUESTA VERSIONE È OTTIMIZZATA PER UNA MAGGIORE PRECISIONE.
 */
export const usePhotoBarcodeScanner = () => {
  // --- MODIFICA 1: Aggiungiamo più "suggerimenti" per la libreria di scansione ---
  // Oltre ai formati, le diciamo di "impegnarsi di più" nell'analisi.
  const hints = new Map();
  const formats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A];
  hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
  hints.set(DecodeHintType.TRY_HARDER, true); // Chiede alla libreria di provare più a fondo

  const codeReader = new BrowserMultiFormatReader(hints);

  const scanFromPhoto = useCallback(async (): Promise<string | null> => {
    try {
      // --- MODIFICA 2: Miglioriamo la qualità della foto ---
      const image = await Camera.getPhoto({
        quality: 100, // Massima qualità
        allowEditing: false, // Disabilitiamo l'editing per avere l'immagine originale e più grande possibile
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!image.webPath) {
        // L'utente ha annullato la schermata della fotocamera.
        return null;
      }

      // Decodifica il codice a barre dall'immagine scattata.
      const result = await codeReader.decodeFromImage(undefined, image.webPath);
      return result.getText();

    } catch (error) {
      // Gestisce sia gli errori della fotocamera sia quelli della decodifica.
      if (error instanceof NotFoundException) {
        console.error("Errore di decodifica: nessun codice trovato.", error);
        throw new Error("Nessun codice a barre trovato nella foto. Prova a scattare una foto più nitida e ben illuminata.");
      } else if (error instanceof Error && error.message.includes("User cancelled")) {
        console.log("L'utente ha annullato la selezione della foto.");
        return null;
      } else {
        console.error("Errore imprevisto durante la scansione:", error);
        throw new Error("Si è verificato un errore durante la scansione.");
      }
    }
  }, [codeReader]);

  return { scanFromPhoto };
};

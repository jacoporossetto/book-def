import { useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
} from '@zxing/library';

/**
 * Hook per la scansione e la ricerca di libri.
 * Fornisce due funzioni:
 * - scanFromPhoto: per scansionare un codice a barre da una foto.
 * - searchByTitle: per cercare libri per titolo tramite l'API di Google.
 */
export const useBookFinder = () => {
  // Lettore per i codici a barre dalle foto, ottimizzato per ISBN
  const codeReader = new BrowserMultiFormatReader(
    new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8]]])
  );

  /**
   * Apre la fotocamera, scatta una foto e decodifica un codice a barre.
   */
  const scanFromPhoto = useCallback(async (): Promise<string | null> => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!image.webPath) return null; // L'utente ha annullato

      const result = await codeReader.decodeFromImage(undefined, image.webPath);
      return result.getText();

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new Error("Nessun codice a barre trovato nella foto. Prova a scattare una foto più nitida.");
      } else if (error instanceof Error && error.message.includes("User cancelled")) {
        return null;
      } else {
        throw new Error("Si è verificato un errore durante la scansione.");
      }
    }
  }, [codeReader]);

  /**
   * Cerca libri per titolo usando l'API di Google Books.
   * @param {string} title - Il titolo da cercare.
   * @returns {Promise<any[]>} Un array di libri trovati.
   */
  const searchByTitle = useCallback(async (title: string): Promise<any[]> => {
    if (!title) return [];
    try {
      const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=10`;
      const response = await fetch(searchUrl);
      if (!response.ok) throw new Error("Errore di rete nella ricerca per titolo.");
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Errore durante la ricerca per titolo:", error);
      throw error;
    }
  }, []);

  return { scanFromPhoto, searchByTitle };
};

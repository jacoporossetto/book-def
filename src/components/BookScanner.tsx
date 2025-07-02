import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Search, AlertCircle, Smartphone, Sparkles, Ban } from "lucide-react";
import { BookRecommendation } from "./BookRecommendation";
import { API_BASE_URL } from '../config';
import { Book, UserProfile, addBookToLibrary } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

interface BookScannerProps {
  userPreferences: UserProfile | null;
  libraryBooks: Book[];
}

export const BookScanner: React.FC<BookScannerProps> = ({ userPreferences, libraryBooks }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isScannerAvailable, isScanning, checkScannerAvailability, startScan } = useBarcodeScanner();

  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualIsbn, setManualIsbn] = useState('');
  const [scannedBook, setScannedBook] = useState<Omit<Book, 'id'> & { analysis?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { checkScannerAvailability(); }, [checkScannerAvailability]);

  const resetScanner = () => {
    setError(null);
    setScannedBook(null);
    setManualIsbn('');
  };

  const handleIsbnSearch = useCallback(async (isbn: string) => {
    if (!isbn) return;
    setIsSearching(true);
    resetScanner();

    try {
      const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) throw new Error("Errore di rete Google Books.");
      const searchData = await searchResponse.json();
      if (!searchData.items || searchData.items.length === 0) throw new Error('Nessun libro trovato con questo ISBN.');
      
      const volumeId = searchData.items[0].id;
      if (!volumeId) throw new Error('ID del libro non trovato, impossibile ottenere dettagli.');

      const detailsUrl = `https://www.googleapis.com/books/v1/volumes/${volumeId}`;
      const detailsResponse = await fetch(detailsUrl);
      if (!detailsResponse.ok) throw new Error("Errore nel recupero dettagli.");
      const detailsData = await detailsResponse.json();
      const bookInfo = detailsData.volumeInfo;

      const initialBookData = {
        title: bookInfo.title || 'Titolo sconosciuto',
        authors: bookInfo.authors || ['Autore sconosciuto'],
        description: bookInfo.description || '', // Inviamo la descrizione grezza, la pulizia la fa il server
        categories: bookInfo.categories || [],
        thumbnail: bookInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150x200?text=No+Cover',
        publishedDate: bookInfo.publishedDate || 'N/A',
        pageCount: bookInfo.pageCount || 0,
        averageRating: bookInfo.averageRating || 0,
        ratingsCount: bookInfo.ratingsCount || 0,
        isbn: isbn,
        scannedAt: new Date().toISOString()
      };

      setScannedBook(initialBookData);
      setIsSearching(false);
      setIsAnalyzing(true);
      
      const response = await fetch(`${API_BASE_URL}/api/analyze-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: initialBookData, userPreferences, readingHistory: libraryBooks }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore del server AI.');
      }

      const analysisData = await response.json();
      setScannedBook(prevBook => prevBook ? { ...prevBook, analysis: analysisData } : null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Si è verificato un errore imprevisto.";
      setError(errorMessage);
    } finally {
      setIsSearching(false);
      setIsAnalyzing(false);
    }
  }, [userPreferences, libraryBooks]);

  const handleCameraScan = async () => {
    resetScanner();
    try {
      const scannedCode = await startScan();
      if (scannedCode) {
        toast({ title: "Codice Rilevato!", description: "Ricerca e analisi in corso..." });
        await handleIsbnSearch(scannedCode);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Errore fotocamera.";
      if (!errorMessage.toLowerCase().includes('cancelled')) {
        toast({ title: "Errore Fotocamera", description: errorMessage, variant: "destructive" });
      }
    }
  };

  const handleAcceptBook = async () => {
    if (!scannedBook || !user) return;
    // Prepariamo l'oggetto libro da salvare, usando la descrizione usata dall'IA
    const bookToAdd = { 
        ...scannedBook, 
        description: scannedBook.analysis?.description_used || scannedBook.description,
        recommendation: scannedBook.analysis 
    };
    delete bookToAdd.analysis; // Rimuoviamo il campo temporaneo

    try {
      await addBookToLibrary(user.uid, bookToAdd);
      toast({ title: "Libro aggiunto alla libreria!", className: "bg-green-100 text-green-800" });
      resetScanner();
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile aggiungere il libro.", variant: "destructive" });
    }
  };

  return (
    <div className="p-0 md:p-4 space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl"><Camera className="w-6 h-6" />Scanner ISBN</CardTitle>
          <CardDescription>Usa la fotocamera o inserisci il codice manualmente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-destructive"><AlertCircle className="w-5 h-5" /><span className="font-medium text-sm">{error}</span></div>
            </div>
          )}
          {isScannerAvailable ? (
            <Button onClick={handleCameraScan} className="w-full h-20 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" disabled={isScanning || isSearching}>
              {isScanning ? <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Scansionando...</> : <><Camera className="w-6 h-6 mr-2" /> Scansiona con Fotocamera</>}
            </Button>
          ) : (
            <div className="p-4 text-center bg-muted rounded-lg">
              <Ban className="mx-auto h-8 w-8 text-muted-foreground mb-2"/>
              <p className="font-semibold">Scanner non disponibile</p>
              <p className="text-sm text-muted-foreground">La scansione con fotocamera non è supportata su questo dispositivo.</p>
            </div>
          )}
          <Button onClick={() => handleIsbnSearch('9788804680584')} variant="outline" className="w-full h-14" disabled={isScanning || isSearching}><Smartphone className="w-5 h-5 mr-2"/>Demo Scanner</Button>
          <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Oppure</span></div></div>
          <form onSubmit={(e) => { e.preventDefault(); handleIsbnSearch(manualIsbn); }} className="space-y-2">
            <Label htmlFor="isbn-manual">Inserisci ISBN manualmente:</Label>
            <div className="flex gap-2">
              <Input id="isbn-manual" placeholder="es. 9780143127741" value={manualIsbn} onChange={e => setManualIsbn(e.target.value)} />
              <Button type="submit" disabled={!manualIsbn || isScanning || isSearching} aria-label="Cerca"><Search className="w-4 h-4"/></Button>
            </div>
          </form>
        </CardContent>
       </Card>

      {(isSearching || isAnalyzing || scannedBook) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary"/> Analisi AI</CardTitle>
          </CardHeader>
          <CardContent>
            {(isSearching || isAnalyzing) ? (
              <div className="flex flex-col items-center justify-center h-44 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">{isSearching ? 'Cerco il libro...' : 'L\'IA sta leggendo per te...'}</p>
              </div>
            ) : scannedBook && (
              <BookRecommendation
                book={scannedBook}
                onAccept={handleAcceptBook}
                onReject={resetScanner}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

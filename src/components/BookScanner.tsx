import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, Search, AlertCircle, Sparkles, Ban } from "lucide-react";
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
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => { checkScannerAvailability(); }, [checkScannerAvailability]);

  const resetScannerState = () => {
    setError(null);
    setScannedBook(null);
    setManualIsbn('');
    setShowManualInput(false);
  };

  const handleIsbnSearch = useCallback(async (isbn: string) => {
    if (!isbn) return;
    setIsSearching(true);
    setError(null);
    setScannedBook(null);

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
        description: bookInfo.description || '',
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
    resetScannerState();
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
    const bookToAdd = { 
        ...scannedBook, 
        description: scannedBook.analysis?.description_used || scannedBook.description,
        recommendation: scannedBook.analysis 
    };
    delete bookToAdd.analysis;

    try {
      await addBookToLibrary(user.uid, bookToAdd);
      toast({ title: "Libro aggiunto alla libreria!", className: "bg-green-100 text-green-800" });
      resetScannerState();
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile aggiungere il libro.", variant: "destructive" });
    }
  };

  // Se stiamo cercando, analizzando o abbiamo un risultato, mostriamo la scheda di analisi.
  if (isSearching || isAnalyzing || scannedBook || error) {
    return (
      <div className="p-0 md:p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary"/> Analisi AI</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-destructive"><AlertCircle className="w-5 h-5" /><span className="font-medium text-sm">{error}</span></div>
                    <Button onClick={resetScannerState} variant="link" className="mt-2">Scansiona un altro libro</Button>
                </div>
            )}
            {(isSearching || isAnalyzing) && (
              <div className="flex flex-col items-center justify-center h-44 gap-4">
                <Loader2 className="w-8 h-8 animate-spin" style={{color: '#147979'}} />
                <p className="text-muted-foreground animate-pulse">{isSearching ? 'Cerco il libro...' : 'L\'IA sta leggendo per te...'}</p>
              </div>
            )} 
            {scannedBook && !isAnalyzing && !error && (
              <BookRecommendation
                book={scannedBook}
                onAccept={handleAcceptBook}
                onReject={resetScannerState}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Altrimenti, mostriamo la schermata di scansione principale.
  return (
    <div className="flex flex-col h-[calc(100vh-18rem)] items-center justify-center text-center px-4">
      <Button
        onClick={handleCameraScan}
        className="w-48 h-48 rounded-full text-white text-2xl font-semibold shadow-lg transition-transform hover:scale-105 flex items-center justify-center"
        style={{ backgroundColor: '#147979' }}
        disabled={isScanning || !isScannerAvailable}
      >
        {isScanning ? (
          <Loader2 className="w-10 h-10 animate-spin" />
        ) : (
          'Scan Book'
        )}
      </Button>

      {!isScannerAvailable && (
          <div className="mt-4 p-3 text-center bg-yellow-100/50 text-yellow-800 rounded-lg max-w-sm">
            <Ban className="mx-auto h-6 w-6 mb-1"/>
            <p className="text-sm font-semibold">Lo scanner non è disponibile. Prova con l'inserimento manuale.</p>
          </div>
        )}

      <div className="mt-8">
        {showManualInput ? (
            <form onSubmit={(e) => { e.preventDefault(); handleIsbnSearch(manualIsbn); }} className="flex gap-2">
                <Input 
                    id="isbn-manual" 
                    placeholder="Digita l'ISBN e premi Invio"
                    value={manualIsbn} 
                    onChange={e => setManualIsbn(e.target.value)}
                    className="text-center"
                    autoFocus
                />
                 <Button type="submit" disabled={!manualIsbn} aria-label="Cerca" style={{backgroundColor: '#147979'}}>
                    <Search className="w-4 h-4 text-white"/>
                </Button>
            </form>
        ) : (
            <Button variant="link" className="text-gray-500 underline" onClick={() => setShowManualInput(true)}>
                Inserisci ISBN manualmente
            </Button>
        )}
      </div>
    </div>
  );
};

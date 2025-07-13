import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, Search, AlertCircle, Sparkles, BookText, Wand2 } from "lucide-react"; // Aggiunta icona Wand2
import { BookRecommendation } from "./BookRecommendation";
import { API_BASE_URL } from '../config';
import { Book, UserProfile, addBookToLibrary } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useBookFinder } from '../hooks/useBookFinder';
import { ScrollArea } from '@/components/ui/scroll-area';

// Componente per mostrare i risultati (ora più generico)
const ResultsDisplay = ({ title, description, items, onSelectBook, onCancel }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-72">
        <div className="space-y-4">
          {items.map((item, index) => {
            // Gestisce sia i risultati di ricerca (item) che i suggerimenti (item.bookDetails)
            const book = item.bookDetails || item;
            const bookInfo = book.volumeInfo || {};
            return (
              <div key={`${book.id}-${index}`} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => onSelectBook(book)}>
                <img src={bookInfo.imageLinks?.thumbnail || `https://placehold.co/128x192/e0e0e0/757575?text=N/A`} alt={bookInfo.title} className="w-16 h-auto object-cover rounded-sm"/>
                <div>
                  <p className="font-semibold">{bookInfo.title}</p>
                  <p className="text-sm text-muted-foreground">{bookInfo.authors?.join(', ')}</p>
                  {/* Mostra la motivazione dell'IA se presente (solo per la modalità scoperta) */}
                  {item.reason && <p className="text-xs text-primary italic mt-1">"{item.reason}"</p>}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <Button onClick={onCancel} variant="outline" className="w-full mt-4">Annulla</Button>
    </CardContent>
  </Card>
);


export const BookScanner: React.FC<{ userPreferences: UserProfile | null; libraryBooks: Book[] }> = ({ userPreferences, libraryBooks }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { scanFromPhoto, searchByTitle } = useBookFinder();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [searchMode, setSearchMode] = useState<'isbn' | 'title'>('isbn');
  const [scannedBook, setScannedBook] = useState<Omit<Book, 'id'> & { analysis?: any } | null>(null);
  const [results, setResults] = useState<{type: 'search' | 'discovery', data: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setError(null);
    setScannedBook(null);
    setManualInput('');
    setIsProcessing(false);
    setIsAnalyzing(false);
    setResults(null);
  };

  const handleBookSelection = (googleBook: any) => {
    const bookInfo = googleBook.volumeInfo;
    const isbn13 = bookInfo?.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
    resetState();
    handleIsbnSearch(isbn13 || googleBook.id);
  }

  const handleIsbnSearch = useCallback(async (isbn: string) => {
    if (!isbn) return;
    setIsProcessing(true);
    setError(null);
    setScannedBook(null);

    try {
      const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) throw new Error("Errore di rete Google Books.");
      const searchData = await searchResponse.json();
      if (!searchData.items || searchData.items.length === 0) throw new Error('Nessun libro trovato con questo ISBN.');
      
      const volumeId = searchData.items[0].id;
      if (!volumeId) throw new Error('ID del libro non trovato.');

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
        thumbnail: bookInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || `https://placehold.co/150x200/e0e0e0/757575?text=No+Cover`,
        publishedDate: bookInfo.publishedDate || 'N/A',
        pageCount: bookInfo.pageCount || 0,
        isbn: isbn,
        scannedAt: new Date().toISOString()
      };

      setScannedBook(initialBookData);
      setIsProcessing(false);
      setIsAnalyzing(true);
      
      const response = await fetch(`${API_BASE_URL}/api/analyze-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: initialBookData, userPreferences, readingHistory: libraryBooks }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Errore del server AI.');

      const analysisData = await response.json();
      setScannedBook(prevBook => prevBook ? { ...prevBook, analysis: analysisData } : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Si è verificato un errore imprevisto.");
    } finally {
      setIsProcessing(false);
      setIsAnalyzing(false);
    }
  }, [userPreferences, libraryBooks]);

  const handleTitleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput) return;
    setIsProcessing(true);
    setResults(null);
    setError(null);
    try {
      const searchResults = await searchByTitle(manualInput);
      if (searchResults.length === 0) {
        toast({ title: "Nessun libro trovato", description: "Prova a perfezionare la tua ricerca." });
      } else {
        setResults({ type: 'search', data: searchResults });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di ricerca");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraScan = useCallback(async () => {
    resetState();
    setIsProcessing(true);
    try {
      const scannedCode = await scanFromPhoto();
      if (scannedCode) {
        toast({ title: "Codice Rilevato!", description: "Analisi in corso..." });
        await handleIsbnSearch(scannedCode);
      } else {
        setIsProcessing(false);
      }
    } catch (err) {
        toast({ title: "Errore Scansione", description: (err as Error).message, variant: "destructive" });
        setIsProcessing(false);
    }
  }, [scanFromPhoto, handleIsbnSearch, toast]);

  const handleDiscovery = async () => {
    resetState();
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/discover-books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPreferences, readingHistory: libraryBooks }),
        });
        if (!response.ok) throw new Error("Errore del server durante la scoperta.");
        const data = await response.json();
        setResults({ type: 'discovery', data: data.suggestions });
    } catch(err) {
        setError(err instanceof Error ? err.message : "Errore di scoperta");
    } finally {
        setIsProcessing(false);
    }
  }

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
      toast({ title: "Libro aggiunto!", className: "bg-green-100 text-green-800" });
      resetState();
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile aggiungere il libro.", variant: "destructive" });
    }
  };

  if (isProcessing || isAnalyzing || scannedBook || error || results) {
    if (results) {
      return <ResultsDisplay 
        title={results.type === 'discovery' ? "Libri Scoperti per Te" : "Risultati della Ricerca"}
        description={results.type === 'discovery' ? "L'IA ha trovato queste gemme nascoste basandosi sui tuoi gusti." : "Seleziona il libro corretto dalla lista."}
        items={results.data} 
        onSelectBook={handleBookSelection} 
        onCancel={resetState} 
      />;
    }
    return (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary"/> Analisi AI</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-destructive"><AlertCircle className="w-5 h-5" /><span className="font-medium text-sm">{error}</span></div>
                    <Button onClick={resetState} variant="link" className="mt-2">Nuova Ricerca</Button>
                </div>
            )}
            {(isProcessing || isAnalyzing) && (
              <div className="flex flex-col items-center justify-center h-44 gap-4">
                <Loader2 className="w-8 h-8 animate-spin" style={{color: '#147979'}} />
                <p className="text-muted-foreground animate-pulse">{isProcessing ? 'Ricerca in corso...' : 'L\'IA sta leggendo per te...'}</p>
              </div>
            )} 
            {scannedBook && !isAnalyzing && !error && (
              <BookRecommendation
                book={scannedBook}
                onAccept={handleAcceptBook}
                onReject={resetState}
              />
            )}
          </CardContent>
        </Card>
    )
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-18rem)] items-center justify-center text-center px-4">
      <Button onClick={handleCameraScan} className="w-48 h-48 rounded-full text-white text-2xl font-semibold shadow-lg" style={{ backgroundColor: '#147979' }} disabled={isProcessing}>
        {isProcessing ? <Loader2 className="w-10 h-10 animate-spin" /> : 'Scan Book'}
      </Button>
      <div className="mt-8 w-full max-w-sm">
        <div className="flex justify-center mb-2">
            <Button variant={searchMode === 'isbn' ? 'secondary' : 'ghost'} onClick={() => setSearchMode('isbn')}>ISBN</Button>
            <Button variant={searchMode === 'title' ? 'secondary' : 'ghost'} onClick={() => setSearchMode('title')}>Titolo</Button>
        </div>
        <form onSubmit={searchMode === 'isbn' ? (e) => { e.preventDefault(); handleIsbnSearch(manualInput); } : handleTitleSearch} className="flex gap-2">
            <Input 
              id="manual-input" 
              placeholder={searchMode === 'isbn' ? "Inserisci ISBN..." : "Inserisci Titolo..."} 
              value={manualInput} 
              onChange={e => setManualInput(e.target.value)} 
              className="text-center" 
              autoFocus
            />
            <Button type="submit" disabled={!manualInput} aria-label="Cerca" style={{backgroundColor: '#147979'}}>
                {searchMode === 'isbn' ? <Search className="w-4 h-4 text-white"/> : <BookText className="w-4 h-4 text-white"/>}
            </Button>
        </form>
        <Button onClick={handleDiscovery} variant="outline" className="w-full mt-4">
          <Wand2 className="w-4 h-4 mr-2"/> Consigliami un Libro
        </Button>
      </div>
    </div>
  );
};

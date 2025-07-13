import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updateBookInLibrary, deleteBookFromLibrary, Book } from '@/services/database';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// --- CORREZIONE 1: Aggiunta l'importazione mancante ---
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Star, Trash2, Edit3, BookOpenCheck, Glasses, BookCopy, Sparkles, Info } from "lucide-react";
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from '@/components/ui/scroll-area';

// Helper per renderizzare le stelle
// --- CORREZIONE 2: Aggiunto un controllo per assicurarsi che 'rating' sia un numero valido ---
const renderStars = (rating: number | undefined, interactive = false, onStarClick: ((rating: number) => void) | null = null, size = 'w-6 h-6') => {
    // Se la valutazione non è un numero valido, non mostrare nulla.
    if (typeof rating !== 'number' || isNaN(rating)) return null;
    
    return Array.from({ length: 5 }, (_, i) => <Star key={i} className={`${size} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer transition-transform hover:scale-110' : ''}`} onClick={interactive && onStarClick ? () => onStarClick(i + 1) : undefined} />)
};

// Componente per una riga di dettaglio dell'analisi AI
const AnalysisDetailRow = ({ label, score, reason }) => (
    <div className="p-3 border-b">
        <div className="flex justify-between items-center font-medium">
            <span>{label}</span>
            <span className="font-bold text-lg text-[#147979]">{score?.toFixed(1)}</span>
        </div>
        <p className="text-sm text-muted-foreground italic mt-1">"{reason}"</p>
    </div>
);

export const PersonalLibrary: React.FC<{ books: Book[], isLoading: boolean }> = ({ books, isLoading }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // --- CORREZIONE 3: Tipizzazione più robusta per lo stato di modifica ---
  const [editData, setEditData] = useState<{ userRating: number; userReview: string; readingStatus: string; } | null>(null);

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    book.authors?.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openEditDialog = (book: Book) => {
    setSelectedBook(book);
    setEditData({
      userRating: book.userRating || 0,
      userReview: book.userReview || '',
      readingStatus: book.readingStatus || 'to-read'
    });
    setIsDialogOpen(true);
  };
  
  const handleBookUpdate = async () => {
    if (!user || !selectedBook || !selectedBook.id || !editData) return;
    try {
      await updateBookInLibrary(user.uid, selectedBook.id, { 
        ...editData,
        reviewDate: editData.readingStatus === 'read' ? new Date().toISOString() : selectedBook.reviewDate
      });
      toast({ title: "Libro aggiornato con successo!" });
      setIsDialogOpen(false);
    } catch (e) {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    }
  };

  const handleDeleteBook = async () => {
    if (!user || !selectedBook || !selectedBook.id) return;
    try {
      await deleteBookFromLibrary(user.uid, selectedBook.id);
      toast({ title: "Libro rimosso dalla libreria.", variant: "destructive" });
      setIsDialogOpen(false);
    } catch (e) {
      toast({ title: "Errore durante la rimozione", variant: "destructive" });
    }
  };
  
  const booksByStatus = {
    'reading': filteredBooks.filter(book => book.readingStatus === 'reading'),
    'to-read': filteredBooks.filter(book => !book.readingStatus || book.readingStatus === 'to-read'),
    'read': filteredBooks.filter(book => book.readingStatus === 'read'),
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-10"><Loader2 className="w-8 h-8 animate-spin text-[#147979]" /></div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">La Mia Libreria</h1>
          <p className="text-muted-foreground">{books.length} libri</p>
      </div>
      <div className="sticky top-16 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm py-2 z-10 -mx-4 px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input placeholder="Cerca nella tua libreria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-12 text-base" />
        </div>
      </div>
      <Tabs defaultValue="reading" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reading"><Glasses className="w-4 h-4 mr-1 sm:mr-2"/> In Lettura</TabsTrigger>
          <TabsTrigger value="to-read"><BookCopy className="w-4 h-4 mr-1 sm:mr-2"/> Da Leggere</TabsTrigger>
          <TabsTrigger value="read"><BookOpenCheck className="w-4 h-4 mr-1 sm:mr-2"/> Letti</TabsTrigger>
        </TabsList>
        {Object.entries(booksByStatus).map(([status, booksInStatus]) => (
          <TabsContent key={status} value={status} className="mt-4 space-y-4">
            {booksInStatus.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">Nessun libro in questa sezione.</div>
            ) : (
              booksInStatus.map(book => (
                <Card key={book.id} className="shadow-md cursor-pointer hover:bg-muted/50" onClick={() => openEditDialog(book)}>
                  <CardContent className="p-4 flex gap-4">
                    <img src={book.thumbnail} alt={book.title} className="w-20 h-28 object-cover rounded-md flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">{book.authors?.join(', ')}</p>
                      <div className="flex items-center gap-1">{renderStars(book.userRating, false, null, 'w-4 h-4')}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="max-w-md p-0">
            <div className="flex gap-4 items-start p-6">
                <img src={selectedBook?.thumbnail} alt={selectedBook?.title} className="w-24 h-auto object-cover rounded-md shadow-sm" />
                <div className="space-y-1 pt-2">
                    <DialogTitle className="text-2xl font-bold">{selectedBook?.title}</DialogTitle>
                    <DialogDescription>{selectedBook?.authors?.join(', ')}</DialogDescription>
                </div>
            </div>
            <Tabs defaultValue="my-notes" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-t border-b">
                    <TabsTrigger value="my-notes"><Edit3 className="w-4 h-4 mr-2"/>I Miei Appunti</TabsTrigger>
                    <TabsTrigger value="ai-analysis"><Sparkles className="w-4 h-4 mr-2"/>Analisi AI</TabsTrigger>
                    <TabsTrigger value="book-info"><Info className="w-4 h-4 mr-2"/>Dettagli</TabsTrigger>
                </TabsList>
                <TabsContent value="my-notes" className="p-6">
                  {editData && (
                     <div className="space-y-6">
                        <div>
                            <Label htmlFor="readingStatus" className="font-semibold">Stato di lettura</Label>
                            <Select value={editData.readingStatus} onValueChange={(value) => setEditData(prev => prev ? ({...prev, readingStatus: value}) : null)}>
                                <SelectTrigger id="readingStatus" className="mt-1"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="to-read">Da leggere</SelectItem>
                                    <SelectItem value="reading">In lettura</SelectItem>
                                    <SelectItem value="read">Letto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-semibold">La tua valutazione</Label>
                            <div className="flex gap-1 mt-2">{renderStars(editData.userRating, true, (rating) => setEditData(prev => prev ? ({...prev, userRating: rating}) : null))}</div>
                        </div>
                        <div>
                            <Label htmlFor="userReview" className="font-semibold">La tua recensione/note</Label>
                            <Textarea id="userReview" value={editData.userReview} onChange={(e) => setEditData(prev => prev ? ({...prev, userReview: e.target.value}) : null)} placeholder="Scrivi qui le tue impressioni..." className="mt-1"/>
                        </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="ai-analysis" className="p-6">
                    {selectedBook?.recommendation ? (
                        <div className="space-y-4">
                            <div className="text-center bg-muted/50 p-4 rounded-xl border">
                                <p className="text-sm font-semibold text-muted-foreground">PUNTEGGIO AFFINITÀ INIZIALE</p>
                                <p className="text-6xl font-bold text-primary my-1">{selectedBook.recommendation.final_rating?.toFixed(1)}</p>
                                <div className="flex justify-center mb-2">{renderStars(selectedBook.recommendation.final_rating, false, null, 'w-5 h-5')}</div>
                                <p className="text-sm italic text-muted-foreground">"{selectedBook.recommendation.one_sentence_hook}"</p>
                            </div>
                            <div className="space-y-1">
                                <AnalysisDetailRow label="Trama vs Bio" score={selectedBook.recommendation.rating_details?.plot_affinity?.score} reason={selectedBook.recommendation.rating_details?.plot_affinity?.reason}/>
                                <AnalysisDetailRow label="Stile & Vibes" score={selectedBook.recommendation.rating_details?.style_affinity?.score} reason={selectedBook.recommendation.rating_details?.style_affinity?.reason}/>
                                <AnalysisDetailRow label="Genere" score={selectedBook.recommendation.rating_details?.genre_affinity?.score} reason={selectedBook.recommendation.rating_details?.genre_affinity?.reason}/>
                            </div>
                        </div>
                    ) : <p className="text-center text-muted-foreground py-10">Nessuna analisi AI disponibile per questo libro.</p>}
                </TabsContent>
                <TabsContent value="book-info" className="p-6">
                    <div className="space-y-3 text-sm">
                        <p><strong>Descrizione:</strong> <span className="text-muted-foreground">{selectedBook?.description || 'Non disponibile.'}</span></p>
                        <p><strong>Pagine:</strong> <span className="text-muted-foreground">{selectedBook?.pageCount || 'N/D'}</span></p>
                        <p><strong>Data Pubblicazione:</strong> <span className="text-muted-foreground">{selectedBook?.publishedDate || 'N/D'}</span></p>
                        <p><strong>Categorie:</strong> <span className="text-muted-foreground">{selectedBook?.categories?.join(', ') || 'N/D'}</span></p>
                    </div>
                </TabsContent>
            </Tabs>
            <DialogFooter className="grid grid-cols-2 gap-2 p-6 pt-0 sm:flex sm:justify-between">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto"><Trash2 className="w-4 h-4 mr-2" />Elimina</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                            <AlertDialogDescription>Questa azione non può essere annullata. Rimuoverà permanentemente il libro dalla tua libreria.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteBook}>Continua</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button onClick={handleBookUpdate} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                    <Edit3 className="w-4 h-4 mr-2" />Salva Modifiche
                </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
};

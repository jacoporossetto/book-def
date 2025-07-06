import { useState } from 'react';
import { Book, updateBookInLibrary, deleteBookFromLibrary } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Library, Search, Star, Edit3, Trash2 } from 'lucide-react';
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


// --- Helper Components ---

// Componente per lo scheletro di caricamento
const LibrarySkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-48 w-full rounded-md" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);

// Componente per lo stato di libreria vuota
const EmptyLibrary = () => (
  <div className="flex flex-col items-center justify-center text-center py-20">
    <Library className="w-16 h-16 text-gray-300 mb-4" />
    <h3 className="text-xl font-semibold text-gray-800">La tua libreria è vuota</h3>
    <p className="text-gray-500 mt-2">Inizia a scansionare per aggiungere i tuoi libri!</p>
  </div>
);

// Componente per la copertina di un singolo libro
const BookCover = ({ book, onSelect }) => (
    <div 
        className="group relative cursor-pointer"
        onClick={() => onSelect(book)}
    >
        <img 
            src={book.thumbnail} 
            alt={`Copertina di ${book.title}`}
            className="w-full h-auto object-cover rounded-md shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-200"
        />
         <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md">
            <div className="text-center text-white p-2">
                <h4 className="font-bold text-sm line-clamp-2">{book.title}</h4>
                <p className="text-xs line-clamp-1">{book.authors?.join(', ')}</p>
            </div>
        </div>
    </div>
);


// --- Main Component ---

interface PersonalLibraryProps {
    books: Book[];
    isLoading: boolean;
}

export const PersonalLibrary: React.FC<PersonalLibraryProps> = ({ books, isLoading }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Dati per il form di modifica, inizializzati quando si apre il dialogo
  const [editData, setEditData] = useState<{
    userRating: number;
    userReview: string;
    readingStatus: 'to-read' | 'reading' | 'read';
  } | null>(null);


  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    book.authors?.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openEditDialog = (book: Book) => {
    setSelectedBook(book);
    setEditData({
      userRating: book.userRating || 0,
      userReview: book.userReview || '',
      readingStatus: (book.readingStatus as 'to-read' | 'reading' | 'read') || 'to-read'
    });
    setIsDialogOpen(true);
  };
  
  const handleBookUpdate = async () => {
    if (!user || !selectedBook || !selectedBook.id || !editData) return;
    try {
      await updateBookInLibrary(user.uid, selectedBook.id, { 
        ...editData,
        reviewDate: new Date().toISOString() 
      });
      toast({ title: "Libro aggiornato con successo!" });
      setIsDialogOpen(false);
      setSelectedBook(null);
      setEditData(null);
    } catch (e) {
      toast({ title: "Errore durante l'aggiornamento", description: "Riprova più tardi.", variant: "destructive" });
    }
  };

  const handleDeleteBook = async () => {
    if (!user || !selectedBook || !selectedBook.id) return;
    try {
      await deleteBookFromLibrary(user.uid, selectedBook.id);
      toast({ title: "Libro rimosso dalla libreria.", variant: "destructive" });
      setIsDialogOpen(false);
      setSelectedBook(null);
    } catch (e) {
      toast({ title: "Errore durante la rimozione", description: "Riprova più tardi.", variant: "destructive" });
    }
  };
  
  const renderStars = (rating: number, interactive = false, onStarClick: ((rating: number) => void) | null = null) => (
    Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-6 h-6 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer transition-transform hover:scale-110' : ''}`} onClick={interactive && onStarClick ? () => onStarClick(i + 1) : undefined} />)
  );

  if (isLoading) {
    return <LibrarySkeleton />;
  }

  return (
    <div className="space-y-6">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input 
                placeholder="Cerca per titolo o autore..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 h-12 text-base border-gray-300 focus:ring-emerald-500 focus:border-emerald-500" 
            />
        </div>

      {filteredBooks.length === 0 ? (
        <EmptyLibrary />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {filteredBooks.map(book => (
            <BookCover key={book.id} book={book} onSelect={openEditDialog} />
          ))}
        </div>
      )}

      {/* Dialogo per visualizzare e modificare i dettagli del libro */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="max-w-md">
            <DialogHeader>
                <div className="flex gap-4 items-start">
                    <img src={selectedBook?.thumbnail} alt={selectedBook?.title} className="w-24 h-auto object-cover rounded-md shadow-sm" />
                    <div className="space-y-1">
                        <DialogTitle className="text-2xl font-bold">{selectedBook?.title}</DialogTitle>
                        <DialogDescription>{selectedBook?.authors?.join(', ')}</DialogDescription>
                    </div>
                </div>
            </DialogHeader>
            {editData && (
                 <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="readingStatus" className="font-semibold">Stato di lettura</Label>
                        <Select 
                            value={editData.readingStatus} 
                            onValueChange={(value: 'to-read' | 'reading' | 'read') => setEditData(prev => prev ? ({...prev, readingStatus: value}) : null)}
                        >
                            <SelectTrigger id="readingStatus"><SelectValue/></SelectTrigger>
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
                        <Textarea 
                            id="userReview"
                            value={editData.userReview} 
                            onChange={(e) => setEditData(prev => prev ? ({...prev, userReview: e.target.value}) : null)} 
                            placeholder="Scrivi qui le tue impressioni..."
                            className="mt-1"
                        />
                    </div>
                </div>
            )}
            <DialogFooter className="grid grid-cols-2 gap-2 sm:flex sm:justify-between">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Elimina
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Questa azione non può essere annullata. Rimuoverà permanentemente il libro dalla tua libreria.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBook}>Continua</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button onClick={handleBookUpdate} className="w-full sm:w-auto">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Salva Modifiche
                </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
};

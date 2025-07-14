import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updateBookInLibrary, deleteBookFromLibrary, Book } from '@/services/database';
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Trash2, Edit3, Sparkles, Info } from "lucide-react";
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
} from "@/components/ui/alert-dialog";

// Helper per renderizzare le stelle
const renderStars = (rating: number | undefined, interactive = false, onStarClick: ((rating: number) => void) | null = null, size = 'w-6 h-6') => {
    if (typeof rating !== 'number' || isNaN(rating)) return null;
    return Array.from({ length: 5 }, (_, i) => <Star key={i} className={`${size} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer transition-transform hover:scale-110' : ''}`} onClick={interactive && onStarClick ? () => onStarClick(i + 1) : undefined} />);
};

// Componente per una riga di dettaglio dell'analisi AI
const AnalysisDetailRow: React.FC<{label: string, score?: number, reason?: string}> = ({ label, score, reason }) => (
    <div className="p-3 border-b">
        <div className="flex justify-between items-center font-medium">
            <span>{label}</span>
            <span className="font-bold text-lg text-[#147979]">{score?.toFixed(1)}</span>
        </div>
        <p className="text-sm text-muted-foreground italic mt-1">"{reason || 'Nessuna motivazione fornita.'}"</p>
    </div>
);


interface BookDetailSheetProps {
  book: Book;
  onClose: () => void;
}

export const BookDetailSheet: React.FC<BookDetailSheetProps> = ({ book, onClose }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [editData, setEditData] = useState<{ userRating: number; userReview: string; readingStatus: string; } | null>(null);

    useEffect(() => {
        setEditData({
            userRating: book.userRating || 0,
            userReview: book.userReview || '',
            readingStatus: book.readingStatus || 'to-read'
        });
    }, [book]);

    const handleBookUpdate = async () => {
        if (!user || !book.id || !editData) return;
        try {
            await updateBookInLibrary(user.uid, book.id, {
                ...editData,
                reviewDate: editData.readingStatus === 'read' ? new Date().toISOString() : book.reviewDate
            });
            toast({ title: "Libro aggiornato con successo!" });
            onClose();
        } catch (e) {
            toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
        }
    };

    const handleDeleteBook = async () => {
        if (!user || !book.id) return;
        try {
            await deleteBookFromLibrary(user.uid, book.id);
            toast({ title: "Libro rimosso dalla libreria.", variant: "destructive" });
            onClose();
        } catch (e) {
            toast({ title: "Errore durante la rimozione", variant: "destructive" });
        }
    };
    
    return (
        <div className="p-4 pt-0">
             <div className="flex gap-4 items-start mb-4">
                <img src={book.thumbnail} alt={book.title} className="w-24 h-auto object-cover rounded-md shadow-sm" />
                <div className="space-y-1 pt-2">
                    <DialogTitle className="text-2xl font-bold">{book.title}</DialogTitle>
                    <DialogDescription>{book.authors?.join(', ')}</DialogDescription>
                </div>
            </div>
            <Tabs defaultValue="my-notes" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-t border-b -mx-4 px-4">
                    <TabsTrigger value="my-notes"><Edit3 className="w-4 h-4 mr-2"/>I Miei Appunti</TabsTrigger>
                    <TabsTrigger value="ai-analysis"><Sparkles className="w-4 h-4 mr-2"/>Analisi AI</TabsTrigger>
                    <TabsTrigger value="book-info"><Info className="w-4 h-4 mr-2"/>Dettagli</TabsTrigger>
                </TabsList>
                <TabsContent value="my-notes" className="p-2 pt-6">
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
                <TabsContent value="ai-analysis" className="p-2 pt-6">
                    {book.recommendation ? (
                        <div className="space-y-4">
                            <div className="text-center bg-muted/50 p-4 rounded-xl border">
                                <p className="text-sm font-semibold text-muted-foreground">PUNTEGGIO AFFINITÀ INIZIALE</p>
                                <p className="text-6xl font-bold text-primary my-1">{book.recommendation.final_rating?.toFixed(1)}</p>
                                <div className="flex justify-center mb-2">{renderStars(book.recommendation.final_rating, false, null, 'w-5 h-5')}</div>
                                <p className="text-sm italic text-muted-foreground">"{book.recommendation.one_sentence_hook}"</p>
                            </div>
                            <div className="space-y-1">
                                <AnalysisDetailRow label="Trama vs Bio" score={book.recommendation.rating_details?.plot_affinity?.score} reason={book.recommendation.rating_details?.plot_affinity?.reason}/>
                                <AnalysisDetailRow label="Stile & Vibes" score={book.recommendation.rating_details?.style_affinity?.score} reason={book.recommendation.rating_details?.style_affinity?.reason}/>
                                <AnalysisDetailRow label="Genere" score={book.recommendation.rating_details?.genre_affinity?.score} reason={book.recommendation.rating_details?.genre_affinity?.reason}/>
                            </div>
                        </div>
                    ) : <p className="text-center text-muted-foreground py-10">Nessuna analisi AI disponibile per questo libro.</p>}
                </TabsContent>
                <TabsContent value="book-info" className="p-2 pt-6">
                    <div className="space-y-3 text-sm">
                        <p><strong>Descrizione:</strong> <span className="text-muted-foreground">{book.description || 'Non disponibile.'}</span></p>
                        <p><strong>Pagine:</strong> <span className="text-muted-foreground">{book.pageCount || 'N/D'}</span></p>
                        <p><strong>Data Pubblicazione:</strong> <span className="text-muted-foreground">{book.publishedDate || 'N/D'}</span></p>
                        <p><strong>Categorie:</strong> <span className="text-muted-foreground">{book.categories?.join(', ') || 'N/D'}</span></p>
                    </div>
                </TabsContent>
            </Tabs>
            <div className="grid grid-cols-2 gap-2 pt-6 sm:flex sm:justify-between">
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
            </div>
        </div>
    );
};

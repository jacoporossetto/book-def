import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Book } from '@/services/database'; // Assumendo che il tipo Book sia esportato qui
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Search, BookOpenCheck, Glasses, BookCopy } from "lucide-react";
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookDetailSheet } from './BookDetailSheet'; // Importiamo il nuovo componente

// Interfaccia per le props del componente
interface PersonalLibraryProps {
  books: Book[];
  isLoading: boolean;
}

export const PersonalLibrary: React.FC<PersonalLibraryProps> = ({ books, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    book.authors?.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    // Un piccolo ritardo per permettere all'animazione di chiusura di completarsi
    setTimeout(() => {
        setSelectedBook(null);
    }, 300);
  }

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
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10 -mx-4 px-4">
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
                <Card key={book.id} className="shadow-md cursor-pointer hover:bg-muted/50" onClick={() => handleBookClick(book)}>
                  <CardContent className="p-4 flex gap-4">
                    <img src={book.thumbnail} alt={book.title} className="w-20 h-28 object-cover rounded-md flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">{book.authors?.join(', ')}</p>
                      {/* Potresti voler aggiungere le stelle qui se necessario */}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mt-4" />
            {selectedBook && (
                <ScrollArea className="max-h-[90vh] mt-4">
                    <BookDetailSheet book={selectedBook} onClose={handleDrawerClose} />
                </ScrollArea>
            )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

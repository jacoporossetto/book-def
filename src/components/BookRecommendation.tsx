import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, ThumbsUp, ThumbsDown, Sparkles, BookHeart, Info, BrainCircuit } from "lucide-react";

// Funzione helper per renderizzare le stelle, ora più flessibile
const renderStars = (rating: number, size = 'w-5 h-5') => {
    if (typeof rating !== 'number') return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(<Star key={i} className={`${size} ${i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />);
    }
    return stars;
};

export const BookRecommendation = ({ book, onAccept, onReject }) => {
  const analysis = book?.analysis;
  const details = analysis?.rating_details;
  const descriptionToShow = analysis?.description_used || book.description;

  return (
    <CardContent className="space-y-4 p-0">
      {/* SEZIONE INTESTAZIONE LIBRO */}
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        <img src={book.thumbnail} alt={book.title} className="w-28 sm:w-32 h-auto object-cover rounded-md shadow-lg mx-auto sm:mx-0 flex-shrink-0" />
        <div className="flex-1 space-y-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold leading-tight">{book.title}</h2>
          <p className="text-lg text-muted-foreground">di {book.authors?.join(', ')}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
             <div className="flex">{renderStars(book.averageRating)}</div>
             <span className="text-sm text-muted-foreground">({book.ratingsCount || 0} voti)</span>
          </div>
        </div>
      </div>

      {/* SISTEMA A SCHEDE PER ORGANIZZARE LE INFORMAZIONI */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis"><Sparkles className="w-4 h-4 mr-2"/>Analisi di Affinità</TabsTrigger>
          <TabsTrigger value="details"><Info className="w-4 h-4 mr-2"/>Scheda Libro</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="mt-4 p-4">
          {!analysis ? (
            <p className="text-center text-muted-foreground py-10">Analisi AI non ancora disponibile.</p>
          ) : (
            <div className="space-y-6">
              <div className="text-center bg-muted/50 p-4 rounded-xl border">
                  <p className="text-sm font-semibold text-muted-foreground">PUNTEGGIO AFFINITÀ FINALE</p>
                  <p className="text-7xl font-bold text-primary my-1">{analysis.final_rating?.toFixed(1)}</p>
                  <div className="flex justify-center mb-2">{renderStars(analysis.final_rating, 'h-6 w-6')}</div>
                  <p className="text-base italic text-muted-foreground">"{analysis.short_reasoning}"</p>
                  {analysis.confidence_level && <Badge variant="outline" className="mt-3">Fiducia IA: {analysis.confidence_level}</Badge>}
              </div>

              {details && (
                  <div className="space-y-4">
                      <h4 className="font-semibold text-center text-lg">Dettaglio Punteggi</h4>
                      <div className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center font-medium"><span className="flex items-center gap-2"><BookHeart className="w-4 h-4"/> Trama vs Bio</span> <span className="font-bold">{details.plot_affinity?.score.toFixed(1)}</span></div>
                          <p className="text-sm text-muted-foreground italic mt-1">"{details.plot_affinity?.reason}"</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center font-medium"><span className="flex items-center gap-2"><BrainCircuit className="w-4 h-4"/> Stile & Vibes</span> <span className="font-bold">{details.style_affinity?.score.toFixed(1)}</span></div>
                          <p className="text-sm text-muted-foreground italic mt-1">"{details.style_affinity?.reason}"</p>
                      </div>
                       <div className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center font-medium"><span className="flex items-center gap-2">📚 Genere</span> <span className="font-bold">{details.genre_affinity?.score.toFixed(1)}</span></div>
                          <p className="text-sm text-muted-foreground italic mt-1">"{details.genre_affinity?.reason}"</p>
                      </div>
                  </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="details" className="mt-4 p-4 text-base space-y-4">
            <h4 className="font-bold text-lg border-b pb-2">Dettagli del Libro</h4>
            <div className="space-y-2 text-sm">
                <p><strong>Autore/i:</strong> {book.authors?.join(', ')}</p>
                <p><strong>Data Pubblicazione:</strong> {book.publishedDate}</p>
                <p><strong>Pagine:</strong> {book.pageCount}</p>
                <p><strong>Categorie:</strong> {book.categories?.join(', ')}</p>
            </div>
            <div className="pt-2 space-y-1">
              <p className="font-semibold">Descrizione Utilizzata per l'Analisi:</p>
              <p className="text-sm text-muted-foreground leading-relaxed italic p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">{descriptionToShow}</p>
            </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex gap-3 pt-4 border-t p-4">
        <Button onClick={onAccept} className="flex-1 h-12 text-base"><ThumbsUp className="w-5 h-5 mr-2" /> Aggiungi</Button>
        <Button onClick={onReject} variant="outline" className="flex-1 h-12 text-base"><ThumbsDown className="w-5 h-5 mr-2" /> Scarta</Button>
      </div>
    </CardContent>
  );
};

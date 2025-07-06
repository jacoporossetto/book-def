import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Check, X, BookOpen, ListChecks, Paperclip, Bookmark } from "lucide-react";

// Funzione helper per renderizzare le stelle in modo dinamico
// Calcola la parte intera e decimale per una stella parzialmente riempita
const renderStars = (rating: number, size = 'w-6 h-6') => {
  if (typeof rating !== 'number' || isNaN(rating)) return null;

  const fullStars = Math.floor(rating);
  const partialStarPercentage = (rating % 1) * 100;
  const emptyStars = 5 - fullStars - (partialStarPercentage > 0 ? 1 : 0);
  const stars = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push(<Star key={`full-${i}`} className={`${size} text-yellow-400 fill-yellow-400`} />);
  }

  if (partialStarPercentage > 0) {
    stars.push(
      <div key="partial" className="relative">
        <Star className={`${size} text-gray-300`} />
        <div className="absolute top-0 left-0 h-full overflow-hidden" style={{ width: `${partialStarPercentage}%` }}>
          <Star className={`${size} text-yellow-400 fill-yellow-400`} />
        </div>
      </div>
    );
  }

  for (let i = 0; i < emptyStars; i++) {
    stars.push(<Star key={`empty-${i}`} className={`${size} text-gray-300`} />);
  }

  return stars;
};


// Componente per una singola riga di dettaglio del punteggio, ora con la motivazione
const ScoreDetailRow = ({ icon: Icon, label, score, reason }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-800">{label}</span>
            </div>
            <span className="font-bold text-lg" style={{color: '#147979'}}>{score?.toFixed(1)}</span>
        </div>
        <p className="text-sm text-gray-500 mt-2 italic">"{reason}"</p>
    </div>
);


export const BookRecommendation = ({ book, onAccept, onReject }) => {
  if (!book) return null; // Gestisce il caso in cui il libro non sia ancora caricato

  const analysis = book?.analysis;
  const details = analysis?.rating_details;
  const descriptionToShow = analysis?.description_used || book.description;

  return (
    // Contenitore principale con sfondo e padding
    <div className="bg-[#F8F9FA] p-4 font-sans">
      <div className="max-w-md mx-auto">
        {/* Sezione Intestazione Libro */}
        <div className="text-center pt-4 pb-8">
            <img 
                src={book.thumbnail} 
                alt={`Copertina di ${book.title}`} 
                className="w-40 h-auto object-cover rounded-md shadow-2xl mx-auto mb-6" 
            />
            <h2 className="text-3xl font-bold text-gray-800 leading-tight">{book.title}</h2>
            <p className="text-lg text-gray-500 mt-1">di {book.authors?.join(', ')}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
                <div className="flex">{renderStars(book.averageRating)}</div>
                <span className="text-base text-gray-400 font-medium">{book.averageRating?.toFixed(1)}</span>
            </div>
        </div>

        {/* Sistema a Schede */}
        <Tabs defaultValue="affinity" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-200/70 rounded-lg p-1">
            <TabsTrigger value="affinity" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Analisi di Affinità</TabsTrigger>
            <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Scheda Libro</TabsTrigger>
          </TabsList>

          {/* Contenuto Tab Analisi di Affinità */}
          <TabsContent value="affinity" className="pt-6">
            {!analysis ? (
              <p className="text-center text-gray-500 py-10">Analisi AI non disponibile.</p>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                    <p className="text-sm font-semibold text-gray-500 tracking-wider">PUNTEGGIO DI AFFINITÀ FINALE</p>
                    <p className="text-8xl font-bold my-2" style={{color: '#147979'}}>{analysis.final_rating?.toFixed(1)}</p>
                    <div className="flex justify-center">{renderStars(analysis.final_rating, 'h-7 w-7')}</div>
                    <p className="text-base text-gray-600 mt-3 italic">"{analysis.short_reasoning}"</p>
                    {analysis.confidence_level && <p className="text-sm text-gray-400 mt-2">Fiducia IA: {analysis.confidence_level}</p>}
                </div>

                {details && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800 text-lg text-left">Dettaglio Punteggi</h4>
                        <ScoreDetailRow icon={ListChecks} label="Trama vs Bio" score={details.plot_affinity?.score} reason={details.plot_affinity?.reason} />
                        <ScoreDetailRow icon={Paperclip} label="Stile & Vibes" score={details.style_affinity?.score} reason={details.style_affinity?.reason} />
                        <ScoreDetailRow icon={Bookmark} label="Genere" score={details.genre_affinity?.score} reason={details.genre_affinity?.reason} />
                    </div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Contenuto Tab Scheda Libro */}
          <TabsContent value="info" className="pt-6 text-base space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-3">
                <h4 className="font-bold text-lg text-gray-800">Dettagli</h4>
                <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Autore/i:</strong> {book.authors?.join(', ')}</p>
                    <p><strong>Data Pubblicazione:</strong> {book.publishedDate}</p>
                    <p><strong>Pagine:</strong> {book.pageCount}</p>
                    <p><strong>Categorie:</strong> {book.categories?.join(', ')}</p>
                </div>
            </div>
             <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-2">
                <p className="font-bold text-lg text-gray-800">Descrizione</p>
                <p className="text-sm text-gray-600 leading-relaxed">{descriptionToShow}</p>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Pulsanti di Azione */}
        <div className="flex gap-4 pt-8">
          <Button onClick={onAccept} className="flex-1 h-14 text-lg bg-[#28a745] hover:bg-[#218838] shadow-lg">
              <Check className="w-6 h-6 mr-2" /> Aggiungi
          </Button>
          <Button onClick={onReject} variant="outline" className="flex-1 h-14 text-lg bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-lg">
              <X className="w-6 h-6 mr-2" /> Scarta
          </Button>
        </div>
      </div>
    </div>
  );
};

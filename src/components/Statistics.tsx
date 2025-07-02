
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, BookOpen, Star, Target, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface Book {
  title: string;
  authors?: string[];
  categories?: string[];
  userRating?: number;
  averageRating?: number;
  readingStatus?: string;
  publishedDate?: string;
  pageCount?: number;
  scannedAt?: string;
  reviewDate?: string;
}

interface StatisticsProps {
  books: Book[];
  userPreferences?: {
    favoriteGenres?: string[];
    readingGoal?: number;
  };
}

const Statistics: React.FC<StatisticsProps> = ({ books, userPreferences }) => {
  // Calcoli base per le statistiche
  const totalBooks = books.length;
  const booksRead = books.filter(book => book.readingStatus === 'read').length;
  const currentlyReading = books.filter(book => book.readingStatus === 'reading').length;
  const toRead = books.filter(book => book.readingStatus === 'to-read').length;

  // Calcolo media voti con controllo per divisione per zero
  const ratedBooks = books.filter(book => book.userRating && book.userRating > 0);
  const averageRating = ratedBooks.length > 0 
    ? ratedBooks.reduce((sum, book) => sum + (book.userRating || 0), 0) / ratedBooks.length 
    : 0;

  // Calcolo pagine totali lette
  const totalPagesRead = books
    .filter(book => book.readingStatus === 'read' && book.pageCount)
    .reduce((sum, book) => sum + (book.pageCount || 0), 0);

  // Progresso verso l'obiettivo di lettura
  const readingGoal = userPreferences?.readingGoal || 12; // Default 12 libri all'anno
  const goalProgress = Math.min((booksRead / readingGoal) * 100, 100);

  // Analisi per generi
  const genreStats = books.reduce((acc, book) => {
    if (book.categories) {
      book.categories.forEach(category => {
        acc[category] = (acc[category] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const genreData = Object.entries(genreStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre, count]) => ({ genre, count }));

  // Dati per il grafico di lettura mensile
  const monthlyReadingData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
    const booksInMonth = books.filter(book => {
      if (!book.reviewDate) return false;
      const bookDate = new Date(book.reviewDate);
      return bookDate.getMonth() === date.getMonth() && bookDate.getFullYear() === date.getFullYear();
    }).length;
    
    return {
      month: monthYear,
      books: booksInMonth
    };
  }).reverse();

  // Dati per grafico stato di lettura
  const statusData = [
    { name: 'Letti', value: booksRead, color: '#22c55e' },
    { name: 'In lettura', value: currentlyReading, color: '#3b82f6' },
    { name: 'Da leggere', value: toRead, color: '#f59e0b' }
  ];

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="w-6 h-6" />
            Statistiche di Lettura
          </CardTitle>
          <CardDescription>
            Analisi dettagliata delle tue abitudini di lettura
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistiche Rapide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {totalBooks}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <BookOpen className="w-4 h-4" />
              Libri Totali
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {booksRead}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <BookOpen className="w-4 h-4" />
              Libri Letti
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Star className="w-4 h-4" />
              Media Voti
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {Math.round(totalPagesRead / 1000)}K
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Pagine Lette
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Obiettivo di Lettura */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Obiettivo di Lettura {new Date().getFullYear()}
          </CardTitle>
          <CardDescription>
            Progresso verso il tuo obiettivo annuale di {readingGoal} libri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {booksRead} di {readingGoal} libri
              </span>
              <Badge variant={goalProgress >= 100 ? "default" : "secondary"}>
                {goalProgress.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={goalProgress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {goalProgress >= 100 
                ? "🎉 Complimenti! Hai raggiunto il tuo obiettivo!" 
                : `Ti mancano ${readingGoal - booksRead} libri per raggiungere l'obiettivo`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generi Preferiti */}
        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Generi più Letti</CardTitle>
            <CardDescription>
              I tuoi generi letterari preferiti
            </CardDescription>
          </CardHeader>
          <CardContent>
            {genreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={genreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="genre" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nessun dato sui generi disponibile
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stato Libri */}
        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Distribuzione Stato Libri</CardTitle>
            <CardDescription>
              Come sono distribuiti i tuoi libri
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalBooks > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aggiungi alcuni libri per vedere le statistiche
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attività di Lettura */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attività di Lettura negli Ultimi 6 Mesi
          </CardTitle>
          <CardDescription>
            Numero di libri letti per mese
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyReadingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="books" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>📊 Insights Personali</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium">🎯 Il tuo genere preferito:</p>
              <p className="text-muted-foreground">
                {genreData.length > 0 ? genreData[0].genre : "Non ancora determinato"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">📖 Media pagine per libro:</p>
              <p className="text-muted-foreground">
                {booksRead > 0 ? Math.round(totalPagesRead / booksRead) : 0} pagine
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">⭐ Libri con 5 stelle:</p>
              <p className="text-muted-foreground">
                {books.filter(book => book.userRating === 5).length} libri
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">📚 Libri in coda:</p>
              <p className="text-muted-foreground">
                {toRead} libri da leggere
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistics;

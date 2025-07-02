import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Code, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Book {
  title: string;
  authors?: string[];
  isbn: string;
  categories?: string[];
  pageCount?: number;
  publishedDate?: string;
  description?: string;
  userRating?: number;
  averageRating?: number;
  notes?: string;
  readingStatus?: string;
}

interface BookExportProps {
  books: Book[];
}

const BookExport: React.FC<BookExportProps> = ({ books }) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeRatings, setIncludeRatings] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [exportFilter, setExportFilter] = useState('all');
  const { toast } = useToast();

  const handleCheckboxChange = (setter: (value: boolean) => void) => {
    return (checked: boolean) => {
      setter(checked);
    };
  };

  const exportData = () => {
    let filteredBooks = books;
    
    // Apply filters
    switch (exportFilter) {
      case 'read':
        filteredBooks = books.filter(book => book.readingStatus === 'read');
        break;
      case 'reading':
        filteredBooks = books.filter(book => book.readingStatus === 'reading');
        break;
      case 'to-read':
        filteredBooks = books.filter(book => book.readingStatus === 'to-read');
        break;
      case 'favorites':
        filteredBooks = books.filter(book => (book.userRating || 0) >= 4);
        break;
    }

    let exportContent = '';
    let filename = '';
    let mimeType = '';

    switch (exportFormat) {
      case 'csv':
        exportContent = generateCSV(filteredBooks);
        filename = `libreria_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
      case 'json':
        exportContent = generateJSON(filteredBooks);
        filename = `libreria_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
      case 'html':
        exportContent = generateHTML(filteredBooks);
        filename = `libreria_${new Date().toISOString().split('T')[0]}.html`;
        mimeType = 'text/html';
        break;
    }

    // Create and download file
    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export completato!",
      description: `Libreria esportata in formato ${exportFormat.toUpperCase()}`,
    });
  };

  const generateCSV = (books: Book[]) => {
    const headers = ['Titolo', 'Autore', 'ISBN'];
    if (includeMetadata) headers.push('Generi', 'Pagine', 'Data Pubblicazione');
    if (includeRatings) headers.push('Voto Personale', 'Media Recensioni');
    if (includeNotes) headers.push('Note');

    const rows = [headers.join(',')];
    
    books.forEach(book => {
      const row = [
        `"${book.title}"`,
        `"${book.authors?.join(', ') || ''}"`,
        book.isbn
      ];
      
      if (includeMetadata) {
        row.push(
          `"${book.categories?.join(', ') || ''}"`,
          (book.pageCount || '').toString(),
          book.publishedDate || ''
        );
      }
      
      if (includeRatings) {
        row.push(
          (book.userRating || '').toString(),
          (book.averageRating || '').toString()
        );
      }
      
      if (includeNotes) {
        row.push(`"${book.notes || ''}"`);
      }
      
      rows.push(row.join(','));
    });

    return rows.join('\n');
  };

  const generateJSON = (books: Book[]) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalBooks: books.length,
      books: books.map(book => {
        const exportBook: any = {
          title: book.title,
          authors: book.authors,
          isbn: book.isbn
        };

        if (includeMetadata) {
          exportBook.categories = book.categories;
          exportBook.pageCount = book.pageCount;
          exportBook.publishedDate = book.publishedDate;
          exportBook.description = book.description;
        }

        if (includeRatings) {
          exportBook.userRating = book.userRating;
          exportBook.averageRating = book.averageRating;
        }

        if (includeNotes) {
          exportBook.notes = book.notes;
        }

        return exportBook;
      })
    };

    return JSON.stringify(exportData, null, 2);
  };

  const generateHTML = (books: Book[]) => {
    return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>La Mia Libreria - BookScan AI</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .book { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
        .book-title { font-weight: bold; font-size: 1.2em; color: #333; }
        .book-author { color: #666; margin: 5px 0; }
        .book-meta { font-size: 0.9em; color: #888; }
        .rating { color: #f39c12; }
        .export-info { background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>La Mia Libreria</h1>
        <p>Esportato da BookScan AI il ${new Date().toLocaleDateString('it-IT')}</p>
    </div>
    
    <div class="export-info">
        <strong>Totale libri:</strong> ${books.length}<br>
        <strong>Filtro applicato:</strong> ${exportFilter === 'all' ? 'Tutti i libri' : exportFilter}
    </div>

    ${books.map(book => `
        <div class="book">
            <div class="book-title">${book.title}</div>
            <div class="book-author">di ${book.authors?.join(', ') || 'Autore sconosciuto'}</div>
            ${includeMetadata ? `
                <div class="book-meta">
                    <strong>ISBN:</strong> ${book.isbn}<br>
                    ${book.categories ? `<strong>Generi:</strong> ${book.categories.join(', ')}<br>` : ''}
                    ${book.pageCount ? `<strong>Pagine:</strong> ${book.pageCount}<br>` : ''}
                    ${book.publishedDate ? `<strong>Pubblicato:</strong> ${book.publishedDate}<br>` : ''}
                </div>
            ` : ''}
            ${includeRatings && book.userRating ? `
                <div class="rating">
                    <strong>Il mio voto:</strong> ${'★'.repeat(book.userRating)}${'☆'.repeat(5-book.userRating)}
                </div>
            ` : ''}
            ${includeNotes && book.notes ? `
                <div class="book-meta">
                    <strong>Note:</strong> ${book.notes}
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-6 h-6" />
            Esporta Libreria
          </CardTitle>
          <CardDescription>
            Esporta i tuoi libri in diversi formati per backup o condivisione
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Format Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Formato di Export</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className={`cursor-pointer transition-colors ${exportFormat === 'csv' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setExportFormat('csv')}
              >
                <CardContent className="p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold">CSV</h4>
                  <p className="text-sm text-muted-foreground">Per Excel e fogli di calcolo</p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-colors ${exportFormat === 'json' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setExportFormat('json')}
              >
                <CardContent className="p-4 text-center">
                  <Code className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold">JSON</h4>
                  <p className="text-sm text-muted-foreground">Per sviluppatori e backup</p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-colors ${exportFormat === 'html' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setExportFormat('html')}
              >
                <CardContent className="p-4 text-center">
                  <Globe className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold">HTML</h4>
                  <p className="text-sm text-muted-foreground">Pagina web condivisibile</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filter Options */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Filtri</h3>
            <Select value={exportFilter} onValueChange={setExportFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i libri</SelectItem>
                <SelectItem value="read">Solo libri letti</SelectItem>
                <SelectItem value="reading">Attualmente in lettura</SelectItem>
                <SelectItem value="to-read">Da leggere</SelectItem>
                <SelectItem value="favorites">Preferiti (4+ stelle)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Options */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Opzioni di Export</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={handleCheckboxChange(setIncludeMetadata)}
                />
                <label htmlFor="metadata" className="text-sm font-medium">
                  Includi metadati (generi, pagine, data pubblicazione)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ratings"
                  checked={includeRatings}
                  onCheckedChange={handleCheckboxChange(setIncludeRatings)}
                />
                <label htmlFor="ratings" className="text-sm font-medium">
                  Includi valutazioni e recensioni
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notes"
                  checked={includeNotes}
                  onCheckedChange={handleCheckboxChange(setIncludeNotes)}
                />
                <label htmlFor="notes" className="text-sm font-medium">
                  Includi note personali
                </label>
              </div>
            </div>
          </div>

          {/* Export Stats */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Anteprima Export</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Totale libri:</span>
                <span className="ml-2 font-medium">{books.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Formato:</span>
                <span className="ml-2 font-medium">{exportFormat.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <Button 
            onClick={exportData} 
            className="w-full"
            disabled={books.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Esporta Libreria
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookExport;

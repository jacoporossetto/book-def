// File: src/components/LazyBookstoreMap.tsx

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Importiamo il componente della mappa in modo "lazy" (pigro)
// Questo significa che il suo codice verrà caricato solo quando necessario
const BookstoreMap = React.lazy(() => import('./BookstoreMap'));

// Questo componente mostra un'icona di caricamento mentre la mappa viene preparata
const LazyBookstoreMap = () => (
  <Suspense 
    fallback={
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    }
  >
    <BookstoreMap />
  </Suspense>
);

export default LazyBookstoreMap;

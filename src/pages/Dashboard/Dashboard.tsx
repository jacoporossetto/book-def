import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';

import { Book, UserProfile } from '../../services/database';
import { BottomNavBar } from '../../components/BottomNavBar';
import { Header } from '../../components/Header';
import { PersonalLibrary } from '../../components/PersonalLibrary';
import { ProfilePage } from '../Profile/Index';
import Statistics from '../../components/Statistics';
import BookExport from '../../components/BookExport';
import BetaFeedback from '../../components/BetaFeedback';
import LazyBookstoreMap from '../../components/LazyBookstoreMap';
import { Loader2 } from 'lucide-react';
import { BookScanner } from '../../components/BookScanner';

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('scanner');
  const [libraryBooks, setLibraryBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
        setIsLoadingBooks(false);
        return;
    }
    // Ordina i libri per data di scansione, dal più recente al più vecchio
    const booksQuery = query(collection(db, 'users', user.uid, 'books'), orderBy('scannedAt', 'desc'));
    const unsubscribe = onSnapshot(booksQuery, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Book[];
      setLibraryBooks(booksData);
      setIsLoadingBooks(false);
    }, (error) => {
      console.error("Errore nel leggere la libreria:", error);
      setIsLoadingBooks(false);
    });
    return () => unsubscribe();
  }, [user]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'library':
        return <PersonalLibrary books={libraryBooks} isLoading={isLoadingBooks} />;
      case 'stats':
        return <Statistics books={libraryBooks} userPreferences={userProfile} />;
      case 'map':
        return <LazyBookstoreMap />;
      case 'export':
        return <BookExport books={libraryBooks} />;
      case 'feedback':
        return <BetaFeedback />;
      case 'profile':
        return <ProfilePage books={libraryBooks} />;
      case 'scanner':
      default:
        // Passiamo le prop necessarie a BookScanner
        return <BookScanner userPreferences={userProfile} libraryBooks={libraryBooks} />;
    }
  };

  return (
    // Rimosso padding-top (pt-20) per eliminare lo spazio extra
    <div className="pb-20 bg-[#F8F9FA] dark:bg-gray-900 min-h-screen">
      
      {/* L'Header ora è sempre visibile, non più condizionale. */}
      {/* Sarà l'Header stesso a gestire il titolo da mostrare. */}
      <Header setActiveTab={setActiveTab} />
      
      <main className="container mx-auto px-4 py-4"> {/* Aggiunto un po' di padding verticale per distanziare l'header */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {isLoadingBooks ? (
              <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
              renderActiveTab()
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* La barra di navigazione inferiore rimane invariata */}
      <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';

import { Book, UserProfile } from '@/services/database';
import { BottomNavBar } from '@/components/BottomNavBar';
import { Header } from '@/components/Header';
import { PersonalLibrary } from '@/components/PersonalLibrary';
import { ProfilePage } from '@/pages/Profile/Index';
import Statistics from '@/components/Statistics';
import BookExport from '@/components/BookExport';
import BetaFeedback from '@/components/BetaFeedback';
import LazyBookstoreMap from '@/components/LazyBookstoreMap';
import { Loader2 } from 'lucide-react';

// --- LA CORREZIONE È QUI ---
import { BookScanner } from '@/components/BookScanner'; // Aggiunte le parentesi graffe

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
        return <BookScanner userPreferences={userProfile} libraryBooks={libraryBooks} />;
    }
  };

  return (
    <div className="pb-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Header setActiveTab={setActiveTab} />
      <main className="container mx-auto px-0 sm:px-4 mt-4">
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
      <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Dashboard;
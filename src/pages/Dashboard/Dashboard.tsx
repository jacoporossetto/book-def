import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, updateUserProfile as saveProfileUpdate } from '@/firebase'; // Aggiunta funzione saveProfileUpdate
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from "@/hooks/use-toast"; // Aggiunto useToast
import { allBadges } from '@/lib/badges'; // Aggiunto import dei badge

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
import { BookScanner } from '@/components/BookScanner';
import { ProfileCompletionPrompt } from '@/components/ProfileCompletionPrompt';

// Funzione per verificare se il profilo utente è completo
const isProfileComplete = (profile: UserProfile | null): boolean => {
    if (!profile) return false;
    const hasBio = profile.bio && profile.bio.trim().length > 0;
    const hasGenres = profile.favoriteGenres && profile.favoriteGenres.length > 0;
    const hasVibes = profile.vibes && profile.vibes.length > 0;
    return hasBio && hasGenres && hasVibes;
}

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('scanner');
  const [libraryBooks, setLibraryBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

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

    if (userProfile && !isProfileComplete(userProfile)) {
        const promptDismissed = sessionStorage.getItem('profilePromptDismissed');
        if (!promptDismissed) {
            setShowProfilePrompt(true);
        }
    } else {
        setShowProfilePrompt(false);
    }

    return () => unsubscribe();
  }, [user, userProfile]);

  // --- NUOVA LOGICA PER GESTIRE I BADGE ---
  useEffect(() => {
    if (!user || !userProfile || libraryBooks.length === 0) return;

    const currentBadges = userProfile.unlockedBadges || [];
    const newlyUnlockedBadges = allBadges.filter(badge => 
      !currentBadges.includes(badge.id) && badge.criteria(libraryBooks)
    );

    if (newlyUnlockedBadges.length > 0) {
      console.log("Nuovi badge sbloccati:", newlyUnlockedBadges);
      const newBadgeIds = newlyUnlockedBadges.map(b => b.id);
      
      newlyUnlockedBadges.forEach(badge => {
        toast({
          title: "🏆 Nuovo Trofeo Sbloccato!",
          description: `Hai ottenuto il badge: "${badge.title}"`,
        });
      });

      const updatedProfile = {
        ...userProfile,
        unlockedBadges: [...currentBadges, ...newBadgeIds],
      };
      saveProfileUpdate(user.uid, updatedProfile);
    }

  }, [libraryBooks, user, userProfile, toast]);

  const handleDismissPrompt = () => {
    setShowProfilePrompt(false);
    sessionStorage.setItem('profilePromptDismissed', 'true');
  };

  const handleCompleteProfile = () => {
    setShowProfilePrompt(false);
    setActiveTab('profile');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'library': return <PersonalLibrary books={libraryBooks} isLoading={isLoadingBooks} />;
      case 'stats': return <Statistics books={libraryBooks} userPreferences={userProfile} />;
      case 'map': return <LazyBookstoreMap />;
      case 'export': return <BookExport books={libraryBooks} />;
      case 'feedback': return <BetaFeedback />;
      case 'profile': return <ProfilePage books={libraryBooks} />;
      case 'scanner': default: return <BookScanner userPreferences={userProfile} libraryBooks={libraryBooks} />;
    }
  };

  return (
    <div className="pb-20 bg-[#F8F9FA] dark:bg-gray-900 min-h-screen relative">
      <Header setActiveTab={setActiveTab} />
      
      {showProfilePrompt && activeTab === 'scanner' && (
          <ProfileCompletionPrompt 
              onComplete={handleCompleteProfile}
              onDismiss={handleDismissPrompt}
          />
      )}

      <main className="container mx-auto px-4 py-4">
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

// File: src/hooks/useAuth.tsx

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase'; // Importiamo l'istanza di auth
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Questo listener di Firebase si attiva ogni volta che lo stato di autenticazione cambia
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Pulisce il listener quando il componente viene smontato
    return unsubscribe;
  }, []);

  // Mostra un caricamento finché Firebase non ha controllato lo stato dell'utente
  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500"/>
          <p className="mt-4 text-muted-foreground">Verifica in corso...</p>
      </div>
    );
  }

  const value = {
    currentUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

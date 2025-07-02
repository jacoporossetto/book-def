import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute'; // Importiamo la nostra guardia
import AuthPage from './pages/Auth/AuthPage';
import OnboardingPage from './pages/Onboarding/OnboardingPage';
import Dashboard from './pages/Dashboard/Dashboard';

function App() {
  const { user, loading } = useAuth();

  // Se stiamo ancora caricando i dati dell'utente, non mostrare nulla
  // per evitare sfarfallii o reindirizzamenti errati.
  if (loading) {
    return null;
  }

  return (
    <Router>
      <Routes>
        {/* Se l'utente è già loggato, non deve poter vedere la pagina di login */}
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/" replace /> : <AuthPage />} 
        />
        
        {/* La pagina di Onboarding è un caso speciale: richiede di essere loggati
            ma di NON avere un profilo completo. Se l'utente è già completo
            o non è loggato, viene reindirizzato. */}
        <Route 
          path="/onboarding" 
          element={<OnboardingPage />}
        />

        {/* Questa è la magia: tutte le rotte qui dentro sono protette */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          {/* Aggiungi qui tutte le altre tue pagine private:
          <Route path="/libreria" element={<MiaLibreria />} /> 
          <Route path="/mappa" element={<MappaLibrerie />} /> 
          */}
        </Route>

        {/* Qualsiasi rotta non trovata reindirizza alla home (che poi sarà protetta) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
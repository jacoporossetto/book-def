import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = () => {
  const { user, isProfileComplete } = useAuth();

  if (!user) {
    // Se l'utente NON è loggato, lo mandiamo alla pagina di autenticazione.
    return <Navigate to="/auth" replace />;
  }

  if (!isProfileComplete) {
    // Se l'utente è loggato MA non ha completato il profilo, lo mandiamo all'onboarding.
    return <Navigate to="/onboarding" replace />;
  }

  // Se l'utente è loggato E il profilo è completo, gli mostriamo la pagina richiesta.
  return <Outlet />; // <Outlet> renderizza il componente figlio (es. Dashboard)
};
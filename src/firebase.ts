// Fase 1: Importa TUTTE le funzioni che ti servono dai rispettivi pacchetti Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // <-- RIGA MANCANTE
import { getFirestore } from "firebase/firestore";    


const firebaseConfig = {
  apiKey: "AIzaSyCpm4q5_hifj8sbLD2ogJnwHBKqbu2QpZY",
  authDomain: "bookscan-3a052.firebaseapp.com",
  projectId: "bookscan-3a052",
  storageBucket: "bookscan-3a052.firebasestorage.app",
  messagingSenderId: "781939963218",
  appId: "1:781939963218:web:af4d6dd58c56dce9fdb68b"
};

// Fase 3: Inizializza l'app
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Fase 4: Crea ed esporta i servizi che usi nel resto dell'app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
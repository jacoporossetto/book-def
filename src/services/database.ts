import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, addDoc, deleteDoc, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { AVATAR_COLORS } from '@/lib/constants';

// Interfaccia del Profilo Utente
export interface UserProfile extends DocumentData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any;
  updatedAt?: any;
  bio?: string;
  favoriteGenres?: string[];
  avatarColor?: string;
  readingGoal?: number;
  preferredLanguages?: string[];
}

// Interfaccia di un Libro
export interface Book extends DocumentData {
  id: string; 
  title: string;
  authors: string[];
  isbn: string;
  scannedAt: string;
  thumbnail: string;
  description: string;
  categories: string[];
  publishedDate?: string;
  pageCount?: number;
  averageRating?: number;
  ratingsCount?: number;
  recommendation?: any;
  readingStatus?: string;
  userRating?: number;
  userReview?: string;
  reviewDate?: string;
}

// --- FUNZIONI PER IL PROFILO ---

export const getOrCreateUserProfile = async (firebaseUser: User): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || `Lettore #${firebaseUser.uid.substring(0, 5)}`,
            photoURL: firebaseUser.photoURL,
            avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
            readingGoal: 12,
            preferredLanguages: ['Italiano'],
            favoriteGenres: [],
            bio: '',
            createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUserProfile);
        return newUserProfile;
    }
};

// --- FUNZIONE CHE MANCAVA ---
export const completeOnboarding = async (uid: string, onboardingData: { favoriteGenres: string[], bio: string }): Promise<void> => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, { 
        ...onboardingData,
        updatedAt: serverTimestamp() 
    });
};

export const updateUserProfile = async (uid:string, data: Partial<UserProfile>): Promise<void> => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, { ...data, updatedAt: serverTimestamp() });
};


// --- FUNZIONI PER I LIBRI ---

export const addBookToLibrary = async (userId: string, bookData: Omit<Book, 'id'>): Promise<void> => {
    const booksCollectionRef = collection(db, 'users', userId, 'books');
    await addDoc(booksCollectionRef, bookData);
};

export const updateBookInLibrary = async (userId: string, bookId: string, updates: Partial<Book>): Promise<void> => {
    const bookDocRef = doc(db, 'users', userId, 'books', bookId);
    await updateDoc(bookDocRef, updates);
};

export const deleteBookFromLibrary = async (userId: string, bookId: string): Promise<void> => {
    const bookDocRef = doc(db, 'users', userId, 'books', bookId);
    await deleteDoc(bookDocRef);
};
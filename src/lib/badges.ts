import { Book } from "@/services/database";
import { Award, BookOpen, Camera, Feather, Globe, Star, Target } from "lucide-react";

// Definiamo la struttura di un singolo badge
export interface BadgeInfo {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  // La funzione 'criteria' determina se l'utente ha sbloccato il badge
  criteria: (books: Book[]) => boolean; 
}

// Lista di tutti i badge disponibili nell'app
export const allBadges: BadgeInfo[] = [
  {
    id: 'FIRST_SCAN',
    title: 'Primo Scatto',
    description: 'Hai scansionato il tuo primo libro!',
    icon: Camera,
    criteria: (books) => books.length >= 1,
  },
  {
    id: 'BOOKWORM_10',
    title: 'Topo di Biblioteca',
    description: 'Hai una libreria con 10 libri.',
    icon: BookOpen,
    criteria: (books) => books.length >= 10,
  },
  {
    id: 'FIRST_REVIEW',
    title: 'Critico Letterario',
    description: 'Hai scritto la tua prima recensione.',
    icon: Feather,
    criteria: (books) => books.some(book => book.userReview && book.userReview.length > 0),
  },
  {
    id: 'FIVE_STAR_RATING',
    title: 'Capolavoro!',
    description: 'Hai dato la tua prima valutazione a 5 stelle.',
    icon: Star,
    criteria: (books) => books.some(book => book.userRating === 5),
  },
  {
    id: 'READING_GOAL_1',
    title: 'Obiettivo Raggiunto',
    description: 'Hai completato il tuo primo obiettivo di lettura.',
    icon: Target,
    // Nota: la logica per questo andrà implementata nella pagina del profilo
    criteria: () => false, 
  },
  {
    id: 'POLYGLOT',
    title: 'Poliglotta',
    description: 'Hai scansionato libri di autori di 5 nazionalità diverse (logica da implementare).',
    icon: Globe,
    criteria: () => false, 
  },
];

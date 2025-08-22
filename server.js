import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// --- CONFIGURAZIONE FIREBASE ADMIN ---
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// --- CONFIGURAZIONE EXPRESS E GEMINI ---
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const analysisModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const searchModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro", tools: [{googleSearch: {}}] });

// --- MIDDLEWARE DI AUTENTICAZIONE A DUE LIVELLI ---

/**
 * GUARDIA DI LIVELLO 1: Utente Autenticato (per funzioni standard)
 * Controlla solo che l'utente sia loggato con un token valido.
 */
const isAuthenticated = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token di autorizzazione mancante o non valido.' });
  }
  const token = authorization.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Rende l'utente disponibile nella richiesta
    next();
  } catch (error) {
    console.error("Errore di autenticazione:", error);
    return res.status(401).json({ error: 'Token non valido o scaduto.' });
  }
};

/**
 * GUARDIA DI LIVELLO 2: Utente Partner (per funzioni esclusive)
 * Controlla che l'utente sia loggato E che abbia il ruolo 'partner' in Firestore.
 */
const isPartnerAuthenticated = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token di autorizzazione mancante o non valido.' });
  }
  const token = authorization.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists || userDoc.data().role !== 'partner') {
      return res.status(403).json({ error: 'Accesso negato. Sono richiesti i privilegi di partner.' });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Errore di autenticazione partner:", error);
    return res.status(401).json({ error: 'Token non valido o scaduto.' });
  }
};


// --- FUNZIONI DI SUPPORTO ---
const sanitizeDescription = (description) => {
  if (!description) return '';
  const withoutHtml = description.replace(/<[^>]*>?/gm, ' ').replace(/&[a-z]+;/gi, ' ');
  const singleSpace = withoutHtml.replace(/\s+/g, ' ').trim();
  return singleSpace.length > 2500 ? `${singleSpace.substring(0, 2500)}...` : singleSpace;
};

const getRichDescription = async (book) => {
  let description = sanitizeDescription(book.description);
  if (!description || description.length < 150) {
    console.log(`[INFO] Descrizione per "${book.title}" insufficiente. Avvio ricerca potenziata...`);
    const searchQuery = `trama completa e dettagliata libro ${book.title} ${book.authors?.[0] || ''}`;
    try {
      const result = await searchModel.generateContent(
        `Usando la ricerca Google, trova e restituisci una sinossi dettagliata (almeno 200 parole) per il libro: ${searchQuery}. Concentrati sulla trama, lo stile di scrittura e le tematiche principali.`
      );
      const foundText = result.response.text();
      if (foundText) {
        console.log(`[SUCCESS] Trovata descrizione alternativa per "${book.title}".`);
        return sanitizeDescription(foundText);
      } else {
        console.log(`[WARN] La ricerca IA per "${book.title}" non ha prodotto risultati utili.`);
        return description || "Descrizione non disponibile.";
      }
    } catch (searchError) {
      console.error(`[ERROR] Errore durante la ricerca IA per "${book.title}":`, searchError);
      return description || "Descrizione non disponibile.";
    }
  }
  console.log(`[SUCCESS] Usando la descrizione fornita per "${book.title}".`);
  return description;
};


// --- ROTTE PER UTENTI STANDARD (GUARDIA: isAuthenticated) ---

app.post('/api/analyze-book', isAuthenticated, async (req, res) => {
  try {
    const { book, userPreferences, readingHistory } = req.body;
    if (!book || !userPreferences) {
      return res.status(400).json({ error: 'Dati del libro o preferenze utente mancanti.' });
    }

    const descriptionUsed = await getRichDescription(book);
    const formattedHistory = readingHistory && readingHistory.length > 0
      ? readingHistory
          .filter(b => b.userRating && b.userRating > 0)
          .sort((a, b) => b.userRating - a.userRating)
          .map(b => `- "${b.title}" (Valutazione: ${b.userRating}/5)`)
          .join('\n')
      : 'Nessuna cronologia di lettura valutata disponibile.';

    const prompt = `
      SEI UN CONSULENTE LETTERARIO D'ÉLITE, UN "LITERARY MATCHMAKER".
      La tua missione è fornire un'analisi profonda, onesta e personalizzata. Il tuo processo è rigoroso e si basa più sui fatti (le letture passate) che sulle opinioni (i gusti dichiarati).

      ### FASE 1: ANALISI DEI DATI GREZZI
      **A) PROFILO DICHIARATO DEL LETTORE:**
      - Generi Preferiti: ${userPreferences.favoriteGenres?.join(', ') || 'Non specificati'}
      - Bio (Cosa cerca): "${userPreferences.bio || 'Non specificata'}"
      - Vibes Desiderate: ${userPreferences.vibes?.join(', ') || 'Non specificate'}
      **B) CRONOLOGIA DI LETTURA (La fonte di verità primaria):**
      ${formattedHistory}
      **C) LIBRO IN ESAME:**
      - Titolo: ${book.title}
      - Categorie: ${book.categories?.join(', ') || 'Non specificate'}
      - Descrizione: "${descriptionUsed}"

      ### FASE 2: CREAZIONE DEL PROFILO DI GUSTO APPRESO (LEARNED TASTE PROFILE)
      Analizza la CRONOLOGIA DI LETTURA. Estrai un profilo di gusto basato sui libri con valutazione alta (>= 4) e bassa (<= 2).
      - Temi e Stili Amati: Quali elementi ricorrono nei libri con valutazione alta?
      - Temi e Stili Evitati: Quali elementi ricorrono nei libri con valutazione bassa?
      Sintetizza questo profilo in 2-3 frasi chiave.

      ### FASE 3: ANALISI COMPARATIVA E PUNTEGGIO (scala 1.0-5.0)
      Confronta il LIBRO IN ESAME con il "Profilo Appreso". Assegna un punteggio e una motivazione per ciascuno dei seguenti tre punti.
      1.  **Affinità Tematica:** Quanto la trama e i temi del libro corrispondono ai "Temi e Stili Amati"?
      2.  **Affinità di Stile:** Il tono e lo stile di scrittura sono in linea con gli "Stili Amati"?
      3.  **Affinità di Genere:** Le categorie del libro sono coerenti con i generi amati?

      ### FASE 4: CALCOLO DEL PUNTEGGIO FINALE
      Calcola una media ponderata: Affinità Tematica: 50%, Affinità di Stile: 30%, Affinità di Genere: 20%.

      ### FASE 5: OUTPUT JSON OBBLIGATORIO
      Fornisci la tua analisi **esclusivamente** in questo formato JSON. I punteggi devono essere numeri.
      {
        "rating_details": {
          "plot_affinity": { "score": number, "reason": "stringa breve" },
          "style_affinity": { "score": number, "reason": "stringa breve" },
          "genre_affinity": { "score": number, "reason": "stringa breve" }
        },
        "final_rating": number,
        "confidence_level": "stringa ('Molto Alta', 'Alta', 'Media', 'Bassa')",
        "one_sentence_hook": "stringa accattivante",
        "perfect_for_you_if": "stringa che completa la frase 'Perfetto per te se cerchi...'"
      }
    `;

    const result = await analysisModel.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('La risposta dell\'IA non è in un formato JSON valido.');

    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error('[FATAL] Errore critico in /api/analyze-book:', error);
    res.status(500).json({ error: "Errore interno nel server di analisi AI." });
  }
});

app.post('/api/discover-books', isAuthenticated, async (req, res) => {
  try {
    const { userPreferences, readingHistory } = req.body;
    if (!userPreferences) {
      return res.status(400).json({ error: 'Preferenze utente mancanti.' });
    }

    const formattedHistory = readingHistory && readingHistory.length > 0
      ? readingHistory
          .filter(b => b.userRating > 0)
          .sort((a, b) => b.userRating - a.userRating)
          .map(b => `- "${b.title}" (Valutazione: ${b.userRating}/5)`)
          .join('\n')
      : 'Nessuna cronologia di lettura valutata disponibile.';

    const prompt = `
      SEI UN "CACCIATORE DI GEMME LETTERARIE".
      La tua missione è scoprire 3 libri che il lettore amerà, ma che probabilmente non conosce.
      Basandoti sul suo profilo di gusto e sulla sua cronologia, suggerisci 3 libri.

      ### PROFILO DEL LETTORE
      - Generi Preferiti: ${userPreferences.favoriteGenres?.join(', ') || 'N/A'}
      - Bio: "${userPreferences.bio || 'N/A'}"
      - Cronologia di Lettura:
      ${formattedHistory}

      ### IL TUO COMPITO
      1. Analizza profondamente i dati del lettore.
      2. Suggerisci 3 libri che siano una corrispondenza eccellente ma potenzialmente inaspettata.
      3. Per ogni libro, fornisci una motivazione di una sola frase.
      4. Restituisci il risultato **esclusivamente** in questo formato JSON:
      {
        "suggestions": [
          { "title": "...", "author": "...", "reason": "..." },
          { "title": "...", "author": "...", "reason": "..." },
          { "title": "...", "author": "...", "reason": "..." }
        ]
      }
    `;

    const result = await analysisModel.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Risposta IA per la scoperta non valida.');

    const suggestions = JSON.parse(jsonMatch[0]).suggestions;
    const enrichedSuggestions = await Promise.all(
      suggestions.map(async (suggestion) => {
        const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(suggestion.title)}+inauthor:${encodeURIComponent(suggestion.author)}&maxResults=1`;
        const bookResponse = await fetch(searchUrl);
        const bookData = await bookResponse.json();
        const bookDetails = bookData.items ? bookData.items[0] : null;
        return { ...suggestion, bookDetails };
      })
    );
    res.status(200).json({ suggestions: enrichedSuggestions });

  } catch (error) {
    console.error('[FATAL] Errore in /api/discover-books:', error);
    res.status(500).json({ error: "Errore durante la scoperta di nuovi libri." });
  }
});

app.post('/api/reviews', isAuthenticated, async (req, res) => {
    const { bookstoreId, rating, text } = req.body;
    const { uid } = req.user;

    if (!bookstoreId || !rating) {
        return res.status(400).send({ error: 'Dati mancanti: sono richiesti ID libreria e valutazione.' });
    }

    try {
        const userRecord = await admin.auth().getUser(uid);
        const userName = userRecord.displayName || 'Utente BookSnap';

        const reviewData = {
            bookstoreId,
            userId: uid,
            userName,
            rating: Number(rating),
            text: text || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const reviewRef = await db.collection('bookstoreReviews').add(reviewData);
        res.status(201).send({ success: true, reviewId: reviewRef.id });

    } catch (error) {
        console.error("Errore grave durante il salvataggio della recensione:", error);
        res.status(500).send({ error: "Si è verificato un errore interno, impossibile salvare la recensione." });
    }
});


// --- ROTTE PER UTENTI TEMPORANEI (NESSUNA SICUREZZA - MODALITÀ DEBUG) ---

app.post('/api/quick-recommendation', async (req, res) => {
  console.warn("[🚨 ATTENZIONE] La rotta /api/quick-recommendation è in modalità DEBUG senza sicurezza.");
  try {
    const { book, customerProfile } = req.body;
    if (!book || !customerProfile) {
      return res.status(400).json({ error: 'Dati del libro o profilo cliente mancanti.' });
    }

    const descriptionUsed = await getRichDescription(book);
    const formattedLikedBooks = customerProfile.likedBooks && customerProfile.likedBooks.length > 0
      ? customerProfile.likedBooks
          .filter(b => b && b.trim() !== '')
          .map(b => `- "${b}" (Valutazione presunta: 5/5)`)
          .join('\n')
      : 'Nessuna cronologia di lettura fornita.';

    const prompt = `
      SEI UN CONSULENTE LETTERARIO D'ÉLITE IN MODALITÀ "CONSULENZA RAPIDA PER CLIENTE".
      La tua missione è fornire un'analisi profonda basandoti sui dati raccolti al momento dal libraio.

      ### DATI DEL CLIENTE
      - Generi Preferiti: ${customerProfile.favoriteGenres?.join(', ') || 'Non specificati'}
      - Bio (Cosa cerca): "${customerProfile.bio || 'Non specificata'}"
      - Libri Amati (Fonte primaria):
      ${formattedLikedBooks}

      ### LIBRO IN ESAME
      - Titolo: ${book.title}
      - Categorie: ${book.categories?.join(', ') || 'Non specificate'}
      - Descrizione: "${descriptionUsed}"

      ### FASE 1: ANALISI DEI DATI GREZZI
      Analizza il profilo del cliente e il libro in esame.

      ### FASE 2: CREAZIONE DEL PROFILO APPRESO
      Basandoti sui "Libri Amati", estrai un profilo di gusto del cliente.

      ### FASE 3: ANALISI COMPARATIVA E PUNTEGGIO (scala 1.0-5.0)
      Confronta il LIBRO IN ESAME con il profilo appreso:
      1. **Affinità Tematica:** Quanto corrispondono trama e temi?
      2. **Affinità di Stile:** Quanto è compatibile lo stile di scrittura?
      3. **Affinità di Genere:** Quanto sono coerenti le categorie?

      ### FASE 4: CALCOLO DEL PUNTEGGIO FINALE
      Media ponderata: Tematica 50%, Stile 30%, Genere 20%.

      ### FASE 5: OUTPUT JSON OBBLIGATORIO
      {
        "rating_details": {
          "plot_affinity": { "score": number, "reason": "stringa breve" },
          "style_affinity": { "score": number, "reason": "stringa breve" },
          "genre_affinity": { "score": number, "reason": "stringa breve" }
        },
        "final_rating": number,
        "confidence_level": "stringa ('Molto Alta', 'Alta', 'Media', 'Bassa')",
        "one_sentence_hook": "stringa accattivante",
        "perfect_for_you_if": "stringa che completa 'Perfetto per te se cerchi...'"
      }
    `;

    const result = await analysisModel.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Risposta IA non valida.');
    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error('[FATAL] Errore in /api/quick-recommendation:', error);
    res.status(500).json({ error: "Errore interno nel server di analisi AI." });
  }
});

app.post('/api/quick-discover', async (req, res) => {
  console.warn("[🚨 ATTENZIONE] La rotta /api/quick-discover è in modalità DEBUG senza sicurezza.");
  try {
    const { customerProfile } = req.body;
    if (!customerProfile) {
      return res.status(400).json({ error: 'Profilo cliente mancante.' });
    }

    const formattedLikedBooks = customerProfile.likedBooks && customerProfile.likedBooks.length > 0
      ? customerProfile.likedBooks.filter(b => b && b.trim() !== '').map(b => `- "${b}"`).join('\n')
      : 'Nessuna cronologia di lettura fornita.';

    const prompt = `
      SEI UN "CACCIATORE DI GEMME LETTERARIE" PER UN CLIENTE IN LIBRERIA.
      La tua missione è scoprire 3 libri che il cliente amerà ma che probabilmente non conosce.

      ### PROFILO DEL CLIENTE
      - Generi Preferiti: ${customerProfile.favoriteGenres?.join(', ') || 'Non specificati'}
      - Cosa cerca (Bio): "${customerProfile.bio || 'Non specificata'}"
      - Libri Amati:
      ${formattedLikedBooks}

      ### IL TUO COMPITO
      1. Analizza profondamente i dati del cliente.
      2. Suggerisci 3 libri che siano una corrispondenza eccellente ma potenzialmente inaspettata.
      3. Per ogni libro, fornisci una motivazione concisa di una frase.
      4. Restituisci il risultato **esclusivamente** in questo formato JSON:
      {
        "suggestions": [
          { "title": "...", "author": "...", "reason": "..." },
          { "title": "...", "author": "...", "reason": "..." },
          { "title": "...", "author": "...", "reason": "..." }
        ]
      }
    `;

    const result = await analysisModel.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Risposta IA non valida.');

    const suggestions = JSON.parse(jsonMatch[0]).suggestions;
    const enrichedSuggestions = await Promise.all(
        suggestions.map(async (suggestion) => {
            const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(suggestion.title)}+inauthor:${encodeURIComponent(suggestion.author)}&maxResults=1`;
            const bookResponse = await fetch(searchUrl);
            const bookData = await bookResponse.json();
            const bookDetails = bookData.items ? bookData.items[0] : null;
            return { ...suggestion, bookDetails };
        })
    );
    res.status(200).json({ suggestions: enrichedSuggestions });

  } catch (error) {
    console.error('[FATAL] Errore in /api/quick-discover:', error);
    res.status(500).json({ error: "Errore durante la scoperta di nuovi libri per il cliente." });
  }
});


// --- ROTTE PUBBLICHE (Nessuna guardia) ---

app.get('/api/reviews/:bookstoreId', async (req, res) => {
  try {
    const { bookstoreId } = req.params;
    const reviewsSnapshot = await db.collection('bookstoreReviews')
      .where('bookstoreId', '==', bookstoreId)
      .orderBy('createdAt', 'desc')
      .get();

    if (reviewsSnapshot.empty) {
      return res.status(200).send([]);
    }

    const reviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(reviews);

  } catch (error) {
    console.error(`Errore nel recuperare le recensioni per ${req.params.bookstoreId}:`, error);
    res.status(500).send({ error: "Impossibile recuperare le recensioni." });
  }
});


// --- AVVIO DEL SERVER ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[INFO] Server Intelligente in ascolto sulla porta ${PORT}`);
  console.log(`[⚠️  WARNING] Le rotte /api/quick-recommendation e /api/quick-discover sono in modalità DEBUG senza sicurezza.`);
});
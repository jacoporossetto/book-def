import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const app = express();
app.use(cors());
// Aumenta il limite del payload per gestire librerie più grandi
app.use(express.json({ limit: '5mb' }));

// Inizializza il client Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const analysisModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const searchModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro", tools: [{googleSearch: {}}] });

// --- Funzioni di Supporto ---

/**
 * Pulisce una stringa da tag HTML e spazi eccessivi.
 * @param {string | undefined} description - La descrizione da pulire.
 * @returns {string} La descrizione pulita e troncata.
 */
const sanitizeDescription = (description) => {
  if (!description) return '';
  const withoutHtml = description.replace(/<[^>]*>?/gm, ' ').replace(/&[a-z]+;/gi, ' ');
  const singleSpace = withoutHtml.replace(/\s+/g, ' ').trim();
  // Limite generoso per la descrizione
  return singleSpace.length > 2500 ? `${singleSpace.substring(0, 2500)}...` : singleSpace;
};

/**
 * Cerca una descrizione dettagliata del libro online se quella fornita è insufficiente.
 * @param {object} book - L'oggetto libro.
 * @returns {Promise<string>} La descrizione trovata o quella originale.
 */
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

// --- Rotta Principale di Analisi ---

app.post('/api/analyze-book', async (req, res) => {
  try {
    const { book, userPreferences, readingHistory } = req.body;
    if (!book || !userPreferences) {
      return res.status(400).json({ error: 'Dati del libro o preferenze utente mancanti.' });
    }

    const descriptionUsed = await getRichDescription(book);

    // Formatta la cronologia di lettura per renderla più utile all'IA
    const formattedHistory = readingHistory && readingHistory.length > 0
      ? readingHistory
          .filter(b => b.userRating && b.userRating > 0) // Considera solo i libri valutati
          .sort((a, b) => b.userRating - a.userRating) // Ordina per valutazione, dal più amato al meno
          .map(b => `- "${b.title}" (Valutazione: ${b.userRating}/5)`)
          .join('\n')
      : 'Nessuna cronologia di lettura valutata disponibile.';

    // --- PROMPT DI ANALISI AVANZATO v5 ---
    const prompt = `
      SEI UN CONSULENTE LETTERARIO D'ÉLITE, UN "LITERARY MATCHMAKER".
      La tua missione è fornire un'analisi profonda, onesta e personalizzata. Il tuo processo è rigoroso e si basa più sui fatti (le letture passate) che sulle opinioni (i gusti dichiarati).

      ### FASE 1: ANALISI DEI DATI GREZZI

      **A) PROFILO DICHIARATO DEL LETTORE (da usare come contesto secondario):**
      - **Generi Preferiti:** ${userPreferences.favoriteGenres?.join(', ') || 'Non specificati'}
      - **Bio (Cosa cerca):** "${userPreferences.bio || 'Non specificata'}"
      - **Vibes Desiderate:** ${userPreferences.vibes?.join(', ') || 'Non specificate'}

      **B) CRONOLOGIA DI LETTURA (La fonte di verità primaria):**
      ${formattedHistory}

      **C) LIBRO IN ESAME:**
      - **Titolo:** ${book.title}
      - **Categorie:** ${book.categories?.join(', ') || 'Non specificate'}
      - **Descrizione:** "${descriptionUsed}"

      ### FASE 2: CREAZIONE DEL PROFILO DI GUSTO APPRESO (LEARNED TASTE PROFILE)
      Analizza la CRONOLOGIA DI LETTURA. Ignora il PROFILO DICHIARATO per ora. Estrai un profilo di gusto basato sui libri con valutazione alta (>= 4) e bassa (<= 2).
      - **Temi e Stili Amati:** Quali elementi ricorrono nei libri con valutazione alta?
      - **Temi e Stili Evitati:** Quali elementi ricorrono nei libri con valutazione bassa?
      Sintetizza questo profilo in 2-3 frasi chiave. Questo è il "Profilo Appreso".

      ### FASE 3: ANALISI COMPARATIVA E PUNTEGGIO (scala 1.0-5.0)
      Ora, confronta il LIBRO IN ESAME con il "Profilo Appreso". Assegna un punteggio e una motivazione per ciascuno dei seguenti tre punti.

      1.  **Affinità Tematica (Trama vs Bio):** Quanto la trama e i temi del libro in esame corrispondono ai "Temi e Stili Amati" del Profilo Appreso?
      2.  **Affinità di Stile (Stile & Vibes):** Il tono e lo stile di scrittura che emergono dalla descrizione del libro sono in linea con gli "Stili Amati" del Profilo Appreso?
      3.  **Affinità di Genere (Genere):** Le categorie del libro in esame sono coerenti con i generi amati dal lettore (sia quelli dichiarati che quelli dedotti dalla cronologia)?

      ### FASE 4: CALCOLO DEL PUNTEGGIO FINALE
      Calcola una media ponderata dei tre punteggi con questi pesi:
      - **Affinità Tematica: 50%**
      - **Affinità di Stile: 30%**
      - **Affinità di Genere: 20%**
      Il punteggio finale deve essere un numero compreso tra 1.0 e 5.0, arrotondato a un decimale.

      ### FASE 5: OUTPUT JSON OBBLIGATORIO
      Fornisci la tua analisi finale **esclusivamente** in questo formato JSON. I punteggi devono essere **numeri**, non stringhe.

      {
        "rating_details": {
          "plot_affinity": { "score": number, "reason": "stringa breve e diretta" },
          "style_affinity": { "score": number, "reason": "stringa breve e diretta" },
          "genre_affinity": { "score": number, "reason": "stringa breve e diretta basata sull'affinità di genere" }
        },
        "final_rating": number,
        "confidence_level": "stringa ('Molto Alta', 'Alta', 'Media', 'Bassa')",
        "one_sentence_hook": "stringa (una frase accattivante che riassume perché dovrebbe leggerlo)",
        "perfect_for_you_if": "stringa (completa la frase 'Perfetto per te se cerchi...')"
      }
    `;

    const result = await analysisModel.generateContent(prompt);
    const responseText = result.response.text();

    // Estrae il JSON in modo più robusto
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[ERROR] Risposta IA non in formato JSON valido:", responseText);
      throw new Error('La risposta dell\'IA non è in un formato JSON valido.');
    }

    const parsedJson = JSON.parse(jsonMatch[0]);

    // --- CONTROLLO DI SICUREZZA ---
    // Assicura che i punteggi siano numeri, convertendoli se necessario.
    if (parsedJson.final_rating) {
        parsedJson.final_rating = parseFloat(parsedJson.final_rating) || 0;
    }
    if (parsedJson.rating_details) {
        for (const key in parsedJson.rating_details) {
            if (parsedJson.rating_details[key] && typeof parsedJson.rating_details[key].score !== 'undefined') {
                parsedJson.rating_details[key].score = parseFloat(parsedJson.rating_details[key].score) || 0;
            }
        }
    }

    res.status(200).json(parsedJson);

  } catch (error) {
    console.error('[FATAL] Errore critico in /api/analyze-book:', error);
    res.status(500).json({ error: "Errore interno nel server di analisi AI." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[INFO] Server Intelligente in ascolto sulla porta ${PORT}`);
});
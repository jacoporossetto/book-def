// File: /test-api.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// ===================================================================
// INCOLLA LA TUA CHIAVE API QUI DENTRO LE VIRGOLETTE
// Esempio: const apiKey = "AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxU";
// ===================================================================
// Questo è l'esempio CORRETTO
const GEMINI_API_KEY = "AIzaSyBdONAG7Rr8vaNdYMKpLRgitGDj44UkVyM"; // La tua chiave sarà qui
// ===================================================================

async function runDirectTest() {
  console.log("-----------------------------------------");
  console.log("INIZIO TEST DIRETTO (SENZA .env)");
  console.log("-----------------------------------------");

  if (GEMINI_API_KEY === "AIzaSyBdONAG7Rr8vaNdYMKpLRgitGDj44UkVyM" || !GEMINI_API_KEY) {
    console.error("❌ ERRORE: Devi incollare la tua chiave API direttamente nello script 'test-api.js'.");
    return;
  }

  console.log("✅ Chiave API trovata direttamente nel codice. Procedo...");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    console.log("Sto provando a contattare Google con la chiave fornita...");
    const result = await model.generateContent("Ciao, rispondi solo 'OK' se mi senti.");
    const text = result.response.text();

    if (text.trim().toLowerCase() === 'ok') {
        console.log("✅✅✅ MIRACOLO! HA FUNZIONATO! ✅✅✅");
        console.log("La chiave API è valida e la connessione a Google funziona.");
    } else {
        console.error("❌ ERRORE INASPETTATO: Google ha risposto, ma non 'OK'. Risposta:", text);
    }

  } catch (error) {
    console.error("❌ ERRORE DURANTE LA CHIAMATA API:", error.message);
    console.log("-----------------------------------------");
    console.log("Questo errore significa che la chiave che hai incollato è SBAGLIATA, incompleta o non valida.");
  }
}

runDirectTest();
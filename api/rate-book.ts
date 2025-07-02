// Percorso: /api/rate-book.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }
  try {
    const { book, userPreferences } = req.body;
    if (!book || !userPreferences) {
      return res.status(400).json({ error: 'Dati mancanti.' });
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const prompt = `Sei un critico letterario esperto. Prevedi quanto un utente apprezzerà un libro, basandoti sulle sue preferenze. Rispondi SOLO in formato JSON con i campi "rating" (numero da 1 a 5) e "reasoning" (stringa di max 20 parole). --- DATI UTENTE: Generi Preferiti: ${userPreferences.favoriteGenres?.join(', ') || 'N/D'}. Gusti: ${userPreferences.bio || 'N/D'}. --- DATI LIBRO: Titolo: ${book.title}. Autori: ${book.authors?.join(', ')}. Categorie: ${book.categories?.join(', ')}. Descrizione: ${book.description?.substring(0, 500)}... --- JSON:`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonResponse = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('Errore API Gemini:', error);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}
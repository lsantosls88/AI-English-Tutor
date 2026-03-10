import { GoogleGenAI } from '@google/genai';
import { getSetting } from '../db';

/**
 * Calls the Gemini API to generate a translation, example, and pronunciation/grammar tip.
 * @param {string} text The English word or phrase to translate.
 * @returns {Promise<{translation: string, example: string, notes: string}>}
 */
export const generateCardData = async (text) => {
    const apiKey = await getSetting('gemini_api_key', '');

    if (!apiKey) {
        throw new Error("Chave de API do Google Gemini não configurada. Por favor, adicione na tela de Configurações.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `Atue como um tutor nativo de inglês. O aluno está estudando a seguinte palavra/frase: "${text}".
Por favor, responda estritamente no seguinte formato JSON, sem crases markdown ou texto adicional:
{
  "translation": "Tradução natural e direta para o português",
  "example": "Um exemplo curto e do dia a dia contendo a palavra/frase em inglês.",
  "notes": "Uma dica rápida de pronúncia focada em connected speech, ritmo ou um contexto de uso importante (em um parágrafo)."
}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                responseMimeType: "application/json",
            }
        });

        const textResponse = response.text;
        const parsed = JSON.parse(textResponse);

        return {
            translation: parsed.translation || "",
            example: parsed.example || "",
            notes: parsed.notes || ""
        };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Falha ao gerar conteúdo com a IA. Verifique sua chave de API ou tente novamente.");
    }
};

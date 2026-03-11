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

/**
 * Generates 3 new daily cards using Gemini AI, tailored to the user's level and goal.
 * @param {string} level - 'beginner' or 'intermediate'
 * @param {string} goal - 'general', 'work', or 'travel'
 * @param {string[]} existingWords - List of english words/phrases the user already has (to avoid duplicates)
 * @returns {Promise<Array<{type: string, english: string, translation: string, example: string, notes: string, tags: string[]}>>}
 */
export const generateDailyCards = async (level, goal, existingWords = []) => {
    const apiKey = await getSetting('gemini_api_key', '');

    if (!apiKey) {
        return null; // Silently return null if no API key configured
    }

    const ai = new GoogleGenAI({ apiKey });

    const levelDescription = level === 'beginner'
        ? 'iniciante (A1-A2), use palavras comuns e frases simples do cotidiano'
        : 'intermediário (B1-B2), use expressões idiomáticas, phrasal verbs e vocabulário mais rico';

    const goalDescription = {
        general: 'conversação geral do dia a dia',
        work: 'ambiente de trabalho e negócios',
        travel: 'viagens e turismo'
    }[goal] || 'conversação geral do dia a dia';

    const avoidList = existingWords.slice(0, 100).join(', ');

    const prompt = `Atue como um tutor nativo de inglês. Gere exatamente 3 novas palavras ou frases em inglês para um aluno brasileiro de nível ${levelDescription}, com foco em ${goalDescription}.

REGRAS IMPORTANTES:
- NÃO repita nenhuma destas palavras/frases que o aluno já possui: [${avoidList}]
- Alterne entre palavras individuais (type: "Word") e frases/expressões (type: "Phrase")
- As tags devem refletir o tema (ex: "greeting", "business", "phrasal verbs", "travel", "idiom", etc.)

Responda estritamente no seguinte formato JSON, sem crases markdown ou texto adicional:
[
  {
    "type": "Word ou Phrase",
    "english": "A palavra ou frase em inglês",
    "translation": "Tradução natural para o português",
    "example": "Uma frase curta e prática usando a palavra/frase",
    "notes": "Dica rápida de pronúncia (connected speech, ritmo) ou contexto de uso importante",
    "tags": ["tag1", "tag2"]
  }
]`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.9,
                responseMimeType: "application/json",
            }
        });

        const parsed = JSON.parse(response.text);

        if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error("Resposta inválida da IA");
        }

        return parsed.map(card => ({
            type: card.type || 'Word',
            english: card.english || '',
            translation: card.translation || '',
            example: card.example || '',
            notes: card.notes || '',
            tags: Array.isArray(card.tags) ? card.tags : [],
            difficulty: 3
        }));
    } catch (error) {
        console.error("Error generating daily cards:", error);
        return null;
    }
};

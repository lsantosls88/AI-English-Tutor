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
 * Generates a daily lesson with 3 new terms using Gemini AI.
 * Returns data in the "aula_diaria" format for the interactive practice screen.
 * @param {string} level - 'beginner' or 'intermediate'
 * @param {string} goal - 'general', 'work', or 'travel'
 * @param {string[]} existingWords - List of english words/phrases the user already has (to avoid duplicates)
 * @returns {Promise<{aula_diaria: Array} | null>}
 */
export const generateDailyLesson = async (level, goal, existingWords = []) => {
    const apiKey = await getSetting('gemini_api_key', '');

    if (!apiKey) {
        return null;
    }

    const ai = new GoogleGenAI({ apiKey });

    const levelDescription = level === 'beginner'
        ? 'iniciante (A1-A2)'
        : 'intermediário (B1-B2)';

    const goalDescription = {
        general: 'conversação geral do dia a dia',
        work: 'ambiente de trabalho e negócios',
        travel: 'viagens e turismo'
    }[goal] || 'conversação geral do dia a dia';

    const avoidList = existingWords.slice(0, 100).join(', ');

    const prompt = `Você é um professor de inglês experiente, focado em ensinar brasileiros. Sua tarefa é gerar uma pequena "Aula Diária" contendo 3 novos termos em inglês (podem ser palavras úteis, phrasal verbs ou expressões idiomáticas) adequados para um aluno de nível ${levelDescription} com foco em ${goalDescription}.

Regras para a geração:
1. Os termos devem ser práticos e muito usados no dia a dia por nativos.
2. A explicação deve ser curta, direta e em português, focando em *quando* e *como* usar a expressão no mundo real.
3. Forneça exatamente 2 exemplos de uso em frases completas para cada termo.
4. O texto em inglês ("termo_ingles" e "frase_ingles") deve estar limpo, sem caracteres especiais desnecessários, pois será lido por um sistema de Text-to-Speech (TTS).
5. NÃO use nenhum destes termos que o aluno já conhece: [${avoidList}]

Retorne APENAS um objeto JSON válido, sem nenhum texto antes ou depois, seguindo estritamente esta estrutura:

{
  "aula_diaria": [
    {
      "termo_ingles": "String",
      "traducao_ptbr": "String",
      "explicacao_uso": "String",
      "exemplos": [
        {
          "frase_ingles": "String",
          "traducao_frase": "String"
        },
        {
          "frase_ingles": "String",
          "traducao_frase": "String"
        }
      ]
    }
  ]
}`;

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

        if (!parsed.aula_diaria || !Array.isArray(parsed.aula_diaria) || parsed.aula_diaria.length === 0) {
            throw new Error("Resposta inválida da IA");
        }

        return parsed;
    } catch (error) {
        console.error("Error generating daily lesson:", error);
        return null;
    }
};

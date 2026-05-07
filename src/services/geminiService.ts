import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface AISuggestedGoal {
  titulo: string;
  especifica: string;
  mensuravel: string;
  atingivel: string;
  relevante: string;
  temporal: string;
}

export interface AIInsightResponse {
  analysis: string;
  suggestions: string[];
  suggestedGoals: AISuggestedGoal[];
}

export async function generateProfileInsights(profileData: {
  disc?: any;
  swot?: any;
  roda?: any;
  language?: string;
}): Promise<AIInsightResponse> {
  if (!apiKey) {
    throw new Error("Configuração de IA indisponível. Verifique a chave da API.");
  }

  const { disc, swot, roda, language = 'pt-BR' } = profileData;

  const prompt = `
    Analise o seguinte perfil de desenvolvimento pessoal e forneça insights estratégicos.
    
    CONTEXTO DO PERFIL:
    ${disc ? `- Perfil DISC: Dominante ${disc.perfil_dominante} (D:${disc.dominancia}%, I:${disc.influencia}%, S:${disc.estabilidade}%, C:${disc.conformidade}%)` : ''}
    ${swot ? `- Análise SWOT: 
      Forças: ${swot.forcas?.join(', ')}
      Fraquezas: ${swot.fraquezas?.join(', ')}
      Oportunidades: ${swot.oportunidades?.join(', ')}
      Ameaças: ${swot.ameacas?.join(', ')}` : ''}
    ${roda ? `- Roda da Vida (Notas 1-10): ${Object.entries(roda).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}

    REQUISITOS DA RESPOSTA:
    1. Forneça uma análise resumida e encorajadora do perfil atual.
    2. Sugira 3 ações práticas de desenvolvimento imediato.
    3. Crie 2 metas no formato SMART (Específica, Mensurável, Atingível, Relevante, Temporal) baseadas nas fraquezas ou áreas baixas da roda da vida.
    4. Idioma: ${language === 'pt-BR' ? 'Português do Brasil' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "Resumo da análise do perfil" },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de sugestões práticas"
            },
            suggestedGoals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  titulo: { type: Type.STRING },
                  especifica: { type: Type.STRING },
                  mensuravel: { type: Type.STRING },
                  atingivel: { type: Type.STRING },
                  relevante: { type: Type.STRING },
                  temporal: { type: Type.STRING }
                },
                required: ["titulo", "especifica", "mensuravel", "atingivel", "relevante", "temporal"]
              },
              description: "Metas SMART sugeridas"
            }
          },
          required: ["analysis", "suggestions", "suggestedGoals"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result as AIInsightResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha ao gerar insights com IA. Tente novamente mais tarde.");
  }
}

import { auth } from '@/lib/firebase';

export interface AiInsight {
  title: string;
  description: string;
  category: string;
}

export interface AiInsightsResponse {
  insights: AiInsight[];
  summary: string;
}

export const AiService = {
  async getInsights(context: any): Promise<AiInsightsResponse> {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');

    const token = await user.getIdToken();

    const response = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ context })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao obter insights da IA');
    }

    return response.json();
  }
};

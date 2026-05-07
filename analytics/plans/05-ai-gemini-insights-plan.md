# Plano de Implementação: AI Gemini Insights
**Data:** 04/05/2026

## 1. Visão Geral
Transformar dados brutos de avaliações em inteligência acionável. O sistema deve usar o Gemini Pro para correlacionar diferentes assessments (ex: DISC + SWOT) e sugerir próximos passos concretos de desenvolvimento.

## 2. Requisitos Técnicos
- **Model:** `gemini-3-flash-preview` (Rápido e eficiente para texto).
- **Backend Sync:** Processar chamadas de IA no servidor para proteger a API Key e permitir cache.
- **Storage:** Persistir insights no Firestore para consulta histórica.

## 3. Arquitetura da Solução

### 3.1. Endpoint de Inteligência: `/api/ai/insights`
Um endpoint POST que:
1. Recebe o `clienteId`.
2. Coleta os últimos dados de Roda da Vida, SWOT e DISC do Firestore.
3. Monta um "Contexto do Cliente" anonimizado.
4. Consulta o Gemini com um prompt especializado:
   *"Como mentor de carreira, analise este perfil DISC (Predominante: I) e esta fraqueza SWOT ('Dificuldade em gerir tempo'). Sugira 3 metas SMART para melhorar o foco."*

### 3.2. Estrutura de prompt (Prompt Engineering)
O prompt será estruturado para garantir:
- **Tone of Voice:** Mentor encorajador, mas direto e profissional.
- **Format:** JSON para facilitar o parsing e integração com a interface.
- **Actionability:** Sugestões que possam virar `MetaSmart` automaticamente.

### 3.3. Componente `AISuggestionCard.tsx`
Um componente UI que:
- Exibe o insight com uma animação de "pensamento" (Skeleton).
- Permite "Salvar como Meta": Abre o modal de Meta SMART pré-preenchido com a sugestão da IA.
- Feedback de utilidade: Botão Curtir/Não Curtir para futura melhoria do prompt.

## 4. Etapas de Desenvolvimento

1. **Implementação do Backend Service:** Criar o handler no `server.ts` que integra o `@google/genai`.
2. **Lógica de Cruzamento de Dados:** Função que entende quais ferramentas o usuário já completou para enriquecer o prompt.
3. **Desenvolvimento da UI de Insights:** Criar o card e integrá-lo no Dashboard principal e no final de cada ferramenta.
4. **Fluxo de Convert to Action:** Implementar a ponte entre "Dica da IA" -> "Meta SMART".

## 5. Critérios de Aceite
- [ ] Insights são gerados em menos de 10 segundos.
- [ ] O usuário pode converter um insight em uma Meta SMART com um clique.
- [ ] Insights são salvos e não regerados a cada acesso (economia de tokens).

---
*Plano elaborado por AI Coding Agent.*

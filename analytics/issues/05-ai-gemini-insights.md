# Issue 05: Insights Inteligentes (AI Gemini)
**Data e Hora de Geração:** 04/05/2026 - 09:46:12 (Horário de Brasília)

## Descrição
Implementar geração de insights automáticos usando IA baseada nos assessments.

### Comportamento (Behavior)
- **Análise Preditiva:** Ao concluir uma avaliação (ex: DISC + SWOT), enviar os dados anonimizados para a API Gemini (através de um serviço seguro no backend).
- **Prompt Engineering:** Enviar um prompt estruturado que solicite: "Com base neste perfil comportamental e nestas fraquezas SWOT, sugira 3 ações de desenvolvimento imediatas".
- **Caching:** Salvar o insight gerado no Firestore associado àquela versão da avaliação para evitar chamadas de API duplicadas.

### Componentes (Component)
- `AISuggestionCard.tsx`: Card animado com ícone de faísca/IA que exibe o texto gerado e permite "Aceitar como Meta" (movendo para o PDI).

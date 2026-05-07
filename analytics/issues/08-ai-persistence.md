# Issue 08: Persistência de Insights da IA
Data e Hora de Geração: 2026-05-05 11:04 (Brasília)

## Descrição
Garantir que os insights gerados pelo Gemini sejam salvos para consulta futura sem custos repetidos de API.

## Requisitos
- [ ] Nova coleção no Firestore: `ai_insights`.
- [ ] Esquema: `{ userId: string, type: 'disc'|'swot'|'roda', content: object, createdAt: timestamp }`.
- [ ] Lógica no `AISuggestionCard` para verificar se já existe um insight recente antes de gerar um novo.
- [ ] Interface para listar insights históricos.

# Issue 5: Normalização Global de Enums
**Data e Hora de Geração:** 2026-04-23 14:10:04 UTC

### Descrição
Padronizar os enums de status entre o frontend, backend e as regras do Firestore para evitar falhas de validação.

### Tarefas
- [ ] Incluir `'pendente'` no enum de `metas_smart` em `firestore.rules`.
- [ ] Padronizar entre `'concluido'` e `'concluida'` em todos os locais.
- [ ] Verificar se o frontend está enviando os valores corretos conforme definido nos novos enums.

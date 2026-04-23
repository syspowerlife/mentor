# Issue 6: Otimização de Regras de Segurança (Performance)
**Data e Hora de Geração:** 2026-04-23 14:10:04 UTC

### Descrição
Reduzir o custo de leitura (Denial of Wallet) refatorando as regras que utilizam `get()` em coleções consultadas por lista.

### Tarefas
- [ ] Eliminar chamadas `get()` dentro de blocos `allow list` onde for logicamente possível.
- [ ] Implementar validação baseada em atributos do próprio recurso (`resource.data`) e tokens de autenticação.

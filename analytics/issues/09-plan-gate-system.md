# Issue 09: Sistema de Bloqueio por Plano (Plan Gate)
Data e Hora de Geração: 2026-05-05 11:04 (Brasília)

## Descrição
Restringir o acesso a funcionalidades avançadas com base no nível de assinatura do usuário.

## Requisitos
- [ ] Hook `usePlan()` para verificar permissões globais.
- [ ] Componente `<PlanGate features={['ai_analysis', 'dossier_pd']}>` que envolve funcionalidades pagas.
- [ ] Modal de Upgrade disparado ao clicar em itens bloqueados.
- [ ] Configuração de limites (ex: máximo de 3 clientes no plano Free).

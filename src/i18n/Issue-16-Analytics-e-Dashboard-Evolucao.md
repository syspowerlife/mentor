# Issue 16: Analytics e Evolução no Dashboard (CONCLUÍDA)

## Descrição
Aprimorar o Dashboard principal com gráficos de evolução histórica e métricas agregadas reais.

## Requisitos
- [x] Implementar query para buscar os últimos 5 registros de `rodas_da_vida` e gerar gráfico comparativo.
- [x] Calcular "Taxa de Sucesso" real: `metas_concluidas / total_metas`.
- [x] Adicionar filtros temporais (7 dias, 30 dias, 90 dias) para as métricas do dashboard.
- [x] Garantir que todos os gráficos usem dados do Firestore com `onSnapshot`.

## Critérios de Aceite
- [x] O dashboard deve refletir a realidade do banco de dados sem atrasos.
- [x] Os gráficos de evolução devem ser legíveis e informativos.

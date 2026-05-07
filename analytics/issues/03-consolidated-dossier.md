# Issue 03: Exportação de Dossiê Consolidado
**Data e Hora de Geração:** 04/05/2026 - 09:46:12 (Horário de Brasília)

## Descrição
Gerar um relatório PDF profissional consolidando todos os dados do cliente.

### Comportamento (Behavior)
- **Agregação de Dados:** Coletar os resultados mais recentes de: Roda da Vida, SWOT, DISC, Valores e Metas SMART em um único objeto.
- **Geração PDF:** Uso de `jspdf` e `html2canvas` para renderizar múltiplas páginas com sumário executivo, gráficos estilizados e plano de ação consolidado.
- **Background Processing:** Para dossiês muito grandes, gerar o PDF em uma tarefa assíncrona e notificar o usuário quando estiver pronto para download.

### Páginas (Page)
- `/ferramentas/relatorio-final`: Página de visualização prévia (Preview) do dossiê consolidado antes da geração do PDF.

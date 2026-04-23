# Issue 18: Feedback Visual (Skeletons) e ErrorBoundary (CONCLUÍDA)

## Descrição
Melhorar a experiência do usuário durante carregamentos e falhas de sistema.

## Requisitos
- [x] Criar componentes de Skeleton:
    - [x] `ChartSkeleton`: Para placeholders de gráficos.
    - [x] `ListSkeleton`: Para listas de clientes e agendamentos.
    - [x] `CardSkeleton`: Para métricas.
- [x] Aprimorar o `ErrorBoundary`:
    - [x] Detectar erros de `permission-denied` do Firestore.
    - [x] Exibir mensagem amigável e botão de "Tentar Novamente" ou "Contatar Suporte".

## Critérios de Aceite
- [x] Não deve haver "pulos" de layout (layout shift) durante o carregamento inicial.
- [x] Erros de permissão não devem quebrar a aplicação inteira.

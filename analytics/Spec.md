# Especificação de Implementação (Pendências) - PowerLife

**Data de Geração:** 08/05/2026 13:58:15 (Horário de Brasília)

Este documento detalha os componentes, páginas e comportamentos identificados como pendentes no `analytics/report.md`.

## 1. Páginas e Vistas (Páginas)

*   **Página: Editor de Manuais (Admin)**
    *   **Caminho sugerido**: `/Admin/Manuais`
    *   **Descrição**: Interface CRUD para categorias de ajuda, artigos em markdown e links de vídeos do YouTube/Vimeo.
*   **Página: Construtor de Templates de Formulário**
    *   **Caminho sugerido**: `/Admin/Templates`
    *   **Descrição**: Permite criar campos personalizados (Input, Select, Rating) para avaliações customizadas além das ferramentas padrão.
*   **Página: Centro de Prova Social**
    *   **Caminho sugerido**: `/Admin/Marketing`
    *   **Descrição**: Lista depoimentos positivos filtrados das avaliações, com botão de "Aprovar" e "Exportar Card de Prova Social" (PNG/PDF).

## 2. Comportamentos e Lógica (Behaviors)

*   **Exportação Consolidada da Jornada**:
    *   Lógica no `PdfService.ts` para buscar dados históricos de um cliente (múltiplas ferramentas) e gerar um dossiê PDF estruturado.
*   **Chat de Coaching Contextual (IA)**:
    *   Fluxo de mensagens utilizando a API do Gemini com sistema de RAG (Retrieval-Augmented Generation) baseado no histórico do Diário do cliente.
*   **Exportação CSV Admin**:
    *   Funcionalidade para as tabelas `ActivityLogTable` e `RevenueHistory` gerarem arquivos `.csv`.
*   **Tour Interativo (Onboarding)**:
    *   Implementação de um driver de tours (ex: `react-joyride`) ativado apenas no primeiro login (`isFirstLogin: true` no Firestore).

## 3. Componentes de UI (Components)

*   **`ManualContentEditor`**: Componente rico para edição de textos e organização de tópicos de ajuda.
*   **`TestimonialCard`**: Componente de visualização de depoimento com foto do cliente, nota (estrelas) e texto de feedback.
*   **`DynamicFormRenderer`**: Componente para renderizar formulários baseados em JSON (Templates criados pelo admin).
*   **`AICoachingBubble`**: Interface de chat flutuante ou dedicada para interação direta com o mentor IA.
*   **`MultiLangSupport`**: Refatoração de textos estáticos em componentes UI para utilizar a função `t()` do i18next.

## 4. Próximos Passos Prioritários

1.  Desenvolvimento do **Editor de Manuais** para remover a estaticidade da central de ajuda.
2.  Implementação do **Relatório Consolidado em PDF** para aumentar o valor entregue aos mentores.
3.  Início da refatoração de **Internacionalização** completa.

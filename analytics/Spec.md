# Spec de Implementação - O que falta
Data e Hora de Geração: 2026-05-05 11:02 (Brasília)

## 1. Páginas (Pages)
- **ClientDossier.tsx**: Página para visualização consolidada de todos os dados de um cliente específico.
- **SuccessPayment.tsx / FailurePayment.tsx**: Páginas de retorno do Mercado Pago.
- **AdminMétricas.tsx**: Dashboard administrativo com gráficos de crescimento e uso.

## 2. Comportamentos (Behaviors)
- **Persistência de IA**: Salvar os insights do Gemini no Firestore (`ai_insights`) vinculando ao ID do cliente/processo.
- **Webhook Mercado Pago**: Endpoint no `server.ts` para capturar atualizações de pagamento e atualizar o status do plano no Firestore.
- **Filtro de Planos**: Middleware ou hook de proteção que bloqueia acesso a rotas premium se o status for `free`.

## 3. Componentes (Components)
- **DossierSummary**: Resumo visual (cards/graficos) consolidando DISC, SWOT e Roda da Vida.
- **PaymentGate**: Overlay/Modal que aparece quando o usuário tenta usar uma funcionalidade não inclusa no plano dele.
- **EmailTemplateBuilder**: Sistema (backend/service) para gerar corpos de email dinâmicos.

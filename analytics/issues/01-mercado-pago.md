# Issue 01: Integração de Pagamentos (Mercado Pago)
**Data e Hora de Geração:** 04/05/2026 - 09:46:12 (Horário de Brasília)

## Descrição
Implementar a integração real com o Mercado Pago para permitir assinaturas de planos.

### Comportamento (Behavior)
- **Fluxo de Assinatura:** Ao confirmar a seleção de um plano, o sistema deve gerar um `preference_id` via backend e redirecionar para o Checkout Pro ou abrir o Modal de Pagamento.
- **Webhooks:** Implementar rota `/api/webhooks/mercadopago` (Express) para processar notificações `payment` e `subscription`.
- **Liberação de Recursos:** Ao receber `payment.status === 'approved'`, atualizar o campo `plan_status` e `plan_type` no documento do usuário no Firestore.
- **Recorrência:** Validar mensalmente o status da assinatura antes de permitir acesso a ferramentas "Master".

### Componentes (Component)
- `PaymentStatusResult.tsx`: Feedback visual pós-pagamento (Sucesso/Erro/Pendente).
- `SubscriptionManager.tsx`: Painel para o mentor gerenciar sua assinatura atual (cancelar, dar upgrade).

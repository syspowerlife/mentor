# Plano de Implementação: Mercado Pago (Assinaturas e Recorrência)
**Data:** 04/05/2026

## 1. Visão Geral
A integração atual de Mercado Pago no PowerLife utiliza `Preferences` (Checkout Pro), que é ideal para pagamentos únicos. Para suportar "processamento real de recorrência", precisamos migrar para a API de **Assinaturas (PreApproval)** do Mercado Pago.

## 2. Requisitos Técnicos
- **SDK:** `mercadopago@2.x.x` (já instalado).
- **Entidades Mercado Pago:**
  - `PreApprovalPlan`: Define as regras do plano (preço, frequência mensal).
  - `PreApproval`: A assinatura individual vinculada ao usuário.
- **Entidades Firestore:**
  - `users`: Atualizar `plan`, `subscriptionId`, `subscriptionStatus`.
  - `revenue_history`: Log de pagamentos aprovados.

## 3. Etapas de Backend (`server.ts`)

### 3.1. Gerenciamento de Planos (Sincronização)
Criar uma função `ensureMercadoPagoPlans()` que:
1. Lista os planos na coleção `planos` do Firestore.
2. Verifica se existe um `mp_plan_id` associado.
3. Se não existir, cria um `PreApprovalPlan` no Mercado Pago e salva o ID no Firestore.
   - Frequência: 1 (mês).
   - Tipo: `recurring`.

### 3.2. Novo Endpoint: `/api/payments/create-subscription`
Substituir ou complementar o fluxo de `preference` por um fluxo de assinatura:
```typescript
const preApproval = new PreApproval(mpClient);
const result = await preApproval.create({
  body: {
    preapproval_plan_id: plan.mp_plan_id,
    payer_email: email,
    back_url: `${APP_URL}/Dashboard?payment=success`,
    external_reference: userId,
    reason: `Assinatura PowerLife - ${plan.name}`
  }
});
```

### 3.3. Refinamento do Webhook
O webhook deve tratar o `type: 'subscription_preapproval'`:
1. Buscar os detalhes da assinatura usando `preApproval.get({ id: data.id })`.
2. Mapear status:
   - `authorized`: Ativar plano no Firestore.
   - `paused`: Suspender temporariamente.
   - `cancelled`: Demote para 'free'.
3. Tratar `type: 'payment'` quando gerado pela assinatura (cobrança mensal concluída).

## 4. Etapas de Frontend

### 4.1. `PricingTable.tsx`
- Atualizar `handleSubscribe` para chamar o novo endpoint de assinatura.
- Tratar o redirecionamento para o `init_point` da assinatura.

### 4.2. Painel de Assinatura (`Perfil.tsx` ou similar)
- Adicionar botão "Gerenciar Assinatura" que redireciona para o portal do Mercado Pago ou abre modal de cancelamento.

## 5. Próximos Passos (Critérios de Aceite)
- [ ] Criar assinaturas funcionais no ambiente de Sandbox.
- [ ] Webhook atualizando o status do usuário automaticamente.
- [ ] Redirecionamento correto pós-pagamento.

---
*Plano elaborado por AI Coding Agent.*

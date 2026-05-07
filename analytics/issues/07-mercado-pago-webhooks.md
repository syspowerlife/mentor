# Issue 07: Webhooks e Integração Mercado Pago
Data e Hora de Geração: 2026-05-05 11:03 (Brasília)

## Descrição
Implementar a comunicação do servidor com o Mercado Pago para atualização automática de planos.

## Requisitos
- [ ] Endpoint `POST /api/webhooks/mercadopago` no `server.ts`.
- [ ] Validação de assinatura do webhook.
- [ ] Lógica para identificar o usuário (via `external_reference`).
- [ ] Atualização da coleção `users/{uid}/subscription`.
- [ ] Notificação Push/Email de confirmação de pagamento.

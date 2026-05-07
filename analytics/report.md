# Relatório de Pendências - Mente Mentora
Data e Hora de Geração: 2026-05-05 11:01 (Brasília)

## Introdução
Este relatório descreve as funcionalidades e componentes que ainda precisam ser implementados ou finalizados no sistema Mente Mentora, com base na análise do estado atual e nos requisitos de negócio.

## 1. Funcionalidades de IA (Gemini)
- [ ] Finalizar a integração do `geminiService.ts` com as páginas de diagnóstico.
- [ ] Implementar o componente `AISuggestionCard` em todas as ferramentas (Roda da Vida, SWOT, DISC).
- [ ] Adicionar persistência para os insights gerados pela IA no Firestore.

## 2. Automação e Notificações
- [ ] Implementar automação de e-mails para novos clientes e agendamentos.
- [ ] Refinar o sistema de notificações em tempo real.

## 3. Pagamentos e Planos
- [ ] Integração completa com Mercado Pago (Checkout Pro e Webhooks).
- [ ] Lógica de liberação de funcionalidades baseada no plano do usuário.

## 4. Dossier Consolidado
- [ ] Criar a view de "Dossiê do Cliente" que agrega todos os diagnósticos (SWOT, Roda da Vida, DISC, Meta SMART).
- [ ] Implementar exportação de PDF do Dossiê completo.

## 5. Internacionalização (i18n)
- [ ] Expansão das traduções para todas as páginas (atualmente focado em PT-BR).
- [ ] Detector automático de idioma.

## 6. Painel Admin
- [ ] Melhorar a gestão de usuários e mentores.
- [ ] Dashboard de métricas globais de uso.

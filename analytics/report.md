# Relatório de Análise do Sistema - PowerLife

Este relatório detalha as funcionalidades pendentes, melhorias sugeridas e pontos de atenção identificados no sistema PowerLife, focado em desenvolvimento pessoal e coaching/mentoria.

## I. Funcionalidades de Core & UX

### 1. Onboarding de Usuário
- **Estado Atual:** Existe um `AuthProvider` e páginas de registro, mas falta um fluxo guiado.
- **Pendente:** Implementar um "Setup Wizard" ou tour guiado para novos mentores configurarem seus primeiros planos e clientes.

### 2. Gestão de Clientes (CRM)
- **Melhorias:** 
    - Adicionar um log de comunicações (histórico de e-mails/mensagens enviadas) na página de detalhes do cliente.
    - Implementar a funcionalidade de "Documentos Compartilhados" com upload real para o Firebase Storage e controle de acesso.
    - Filtros avançados na listagem de clientes (por data de última sessão, nível de engajamento, etc.).

### 3. Ferramentas de Desenvolvimento (PDI, Roda da Vida, MetaSmart)
- **Integrações:** As sessões de mentoria (`AcompanhamentoProgresso`) poderiam permitir vincular uma meta específica de um PDI ou uma fatia da Roda da Vida.
- **PDI:** 
    - Finalizar a integração de "Ações" e "Progresso" com notificações automáticas quando um prazo está próximo.
    - Melhorar o gerador de relatórios PDF com mais gráficos comparativos.

## II. Pagamentos e Assinaturas

### 1. Transição de Gateways
- **Stripe:** A implementação atual no backend usa IDs de preços de variáveis de ambiente. Sugere-se migrar para o uso dinâmico do `stripe_price_id` armazenado no documento do plano no Firestore (já previsto no `PlanManager`).
- **Mercado Pago:** Embora o endpoint `/api/payments/create-preference` exista no backend, a interface `PricingSection` ainda não oferece a opção de pagamento via Mercado Pago aos usuários.

### 2. Robustez dos Webhooks
- **Pendência:** Adicionar tratamentos para eventos de cancelamento de assinatura (`customer.subscription.deleted`), falha de pagamento e estornos em ambos os gateways para garantir que o campo `plan` do usuário no Firestore seja atualizado automaticamente.

## III. Painel Administrativo

### 1. Monitoramento e Auditoria
- **Log de Atividades:** Criar uma aba de logs para visualizar ações críticas realizadas por administradores ou mentores.
- **Analytics Global:** Implementar um gráfico de receita estimada e crescimento de base de usuários no dashboard admin.

### 2. Gestão de Conteúdo
- **FAQ:** A gestão está funcional, mas poderia incluir suporte a categorias aninhadas ou pesquisa.

## IV. Integrações e Configurações

### 1. Google Calendar
- **UI de Conexão:** Falta uma seção clara em "Configurações" (`SettingsForm`) para o usuário conectar/desconectar sua conta Google e visualizar o status do sincronismo.
- **Resiliência:** Implementar refresh tokens automáticos e tratamento de erros de API do Google mais granulares.

### 2. Notificações
- **Preferências:** Permitir que o usuário escolha quais tipos de notificações deseja receber (ex: apenas sessões agendadas, mas não dicas de IA).

## V. Débito Técnico e Refatoração

### 1. Sincronização de Dados
- **Preços Hardcoded:** O componente `PricingSection` possui `defaultPlans` que podem divergir do Firestore. Deve-se garantir que o sistema sempre utilize a fonte de verdade do banco de dados.

### 2. Tipagem e Segurança
- **Typescript:** Expandir as definições de interfaces para garantir que todos os retornos do Firestore sejam tipados via Zod ou interfaces manuais em `src/types.ts`.
- **Regras de Segurança:** Revisar as `firestore.rules` periodicamente para garantir que novas coleções (como `pdi_acoes`) estejam protegidas contra acessos indevidos.

## VI. Próximos Passos Recomendados

1. **Testes de Persistência:** Validar se as alterações recentes no `AuthContext` e `firebase.ts` resolvem definitivamente os deslogamentos indesejados.
2. **Setup do Ambiente:** Garantir que todas as chaves de API (Resend, Stripe, MP, Google) estejam configuradas para o ambiente de produção.
3. **Auditoria Mobile:** Realizar testes de usabilidade intensivos em dispositivos móveis, focando em tabelas e gráficos que podem quebrar layouts.

# Especificação Técnica de Funcionalidades Pendentes - PowerLife

Este documento detalha as especificações técnicas para a implementação das funcionalidades identificadas como pendentes no `analytics/report.md`.

## 1. Novas Páginas e Telas

### 1.1. Centro de Documentos do Cliente (`/Clientes/:id/Documentos`)
- **Descrição:** Espaço para upload e armazenamento de arquivos (PDFs de planos, contratos, notas fiscais).
- **Componentes:** 
    - `DocumentList`: Tabela com nome, data, tamanho e ações (download/excluir).
    - `FileUploadZone`: Área de drag-and-drop integrada ao Firebase Storage.
- **Comportamento:** Os arquivos devem ser armazenados no path `users/{mentorId}/clients/{clientId}/{fileId}`.

### 1.2. Logs de Atividade Admin (`/AdminPanel?tab=logs`)
- **Descrição:** Histórico de ações administrativas e eventos do sistema.
- **Componentes:** 
    - `ActivityFeed`: Lista cronológica filtrável por tipo de evento (Login, Pagamento, Exclusão de Usuário).
- **Comportamento:** Consultar a coleção `system_logs` (a ser criada) com paginação.

---

## 2. Novos Componentes

### 2.1. Onboarding Wizard (`OnboardingWizard.tsx`)
- **Descrição:** Modal de boas-vindas acionado no primeiro login do mentor.
- **Etapas:** 
    1. Boas-vindas e introdução.
    2. Passo para conectar Google Calendar.
    3. Guia rápido para criar o primeiro plano de mentoria.
- **Comportamento:** Persistir flag `onboarding_completed: true` no perfil do usuário após a conclusão.

### 2.2. Integração Google Calendar em Configurações (`GoogleCalendarSettings.tsx`)
- **Descrição:** Card dentro da página de `/Configuracoes`.
- **UI:** Botão "Conectar Agenda" (abre popup de OAuth) ou "Desconectar" (com status de última sincronização).
- **Comportamento:** Chamar `/api/auth/google/url` no backend e lidar com a mensagem de retorno `OAUTH_AUTH_SUCCESS`.

### 2.3. Seletor de Gateway de Pagamento (`PaymentGatewaySelector.tsx`)
- **Descrição:** Update no `PricingSection` para permitir escolha entre Stripe e Mercado Pago.
- **UI:** Toggle ou Tabs (Cartão de Crédito vs Pix/Boleto).
- **Comportamento:** Se Mercado Pago, chamar `/api/payments/create-preference`. Se Stripe, chamar `/api/create-checkout-session`.

### 2.4. Gráficos de Receita Global (`RevenueAnalytics.tsx`)
- **Descrição:** Dashboard visual para o Painel Administrativo.
- **UI:** Gráfico de linha (Receita Mensal) e gráfico de pizza (Distribuição de Planos).
- **Comportamento:** Consulta agregada nas transações ou documentos de usuários com plano ativo.

---

## 3. Comportamentos e Regras de Negócio

### 3.1. Sincronização Dinâmica de Preços
- **Comportamento:** Remover a constante `defaultPlans` de `PricingSection.tsx`.
- **Implementação:** O componente deve ser 100% dependente da coleção `planos` do Firestore. Se a coleção estiver vazia, exibir estado de erro/vazio em vez de fallbacks hardcoded.

### 3.2. Vínculo Meta-Sessão
- **Comportamento:** No formulário de "Registrar Sessão" (`AcompanhamentoProgresso.tsx`), adicionar um seletor opcional para vincular a sessão a uma ou mais `metas_smart` ativas do cliente.
- **Dados:** Salvar o array de IDs de metas no documento de `sessoes_mentoring`.

### 3.3. Webhooks de Ciclo de Vida da Assinatura
- **Comportamento Backend (`server.ts`):** 
    - Lidar com `customer.subscription.deleted` (Stripe) para resetar o plano para 'free'.
    - Lidar com notificações de cancelamento do Mercado Pago.
- **Notificação:** Enviar notificação push/email ao usuário quando o plano expirar ou for cancelado por falta de pagamento.

### 3.4. Preferências de Notificação Granulares
- **Comportamento:** No `SettingsForm`, desmembrar o switch de notificações em categorias:
    - Lembretes de Sessão (E-mail/Push).
    - Status de Metas Atrasadas (E-mail).
    - Novidades e Dicas da Plataforma (Push).

---

## 4. Requisitos de Infraestrutura / Segurança

### 4.1. Refinamento de Storage Rules
- **Regra:** Garantir que apenas o mentor e o respectivo cliente possam ler/escrever arquivos no path de documentos correspondente.

### 4.2. Integração de Auditoria (Firebase Admin)
- **Implementação:** Toda rota `/api/admin/*` deve registrar o UID do administrador, o IP e o timestamp da ação para fins de segurança.

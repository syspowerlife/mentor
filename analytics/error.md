# Relatório de Análise e Erros do Sistema - PowerLife
**Gerado em:** 28/04/2026 09:21:00 (Horário de Brasília)

## 1. Falhas Críticas de Permissão no Firestore (Security Rules)
O sistema apresenta múltiplos erros de `permission-denied` em operações de listagem e leitura, impactando diretamente o Portal do Cliente e o Painel do Profissional.

- **Causa Raiz:** A função central de validação de listagem `canListResource` (Linhas 92-101 de `firestore.rules`) é excessivamente restritiva. Ela não contempla campos relacionais fundamentais como `cliente_id`, nem campos específicos de coleções como `uploadedBy` (anexos) ou `author_id` (feedbacks).
- **Impacto:** Clientes não conseguem visualizar suas próprias Metas SMART, Agendamentos ou Anexos quando estes são criados pelo profissional, pois o sistema tenta validar apenas o `created_by` ou campos de UID específicos que nem sempre estão presentes ou mapeados corretamente.
- **Coleções Afetadas:** `metas_smart`, `agendamentos`, `clientes/{id}/anexos`, `clientes/{id}/professional_notes`.

## 2. Instabilidade com Persistência Offline
Foram detectados erros críticos de asserção interna do Firebase Firestore (`INTERNAL ASSERTION FAILED: Unexpected state (ID: b815)`).

- **Estado Atual:** A persistência offline via `enableIndexedDbPersistence` foi desativada temporariamente no arquivo `src/lib/firebase.ts` como medida paliativa.
- **Impacto:** O aplicativo perde a capacidade de funcionar em modo offline ou redes instáveis, mas a desativação foi necessária para evitar o crash completo da interface em certos navegadores.

## 3. Vulnerabilidade na Integração com Stripe
O servidor (`server.ts`) utiliza uma abordagem insegura para verificar assinaturas de webhooks do Stripe.

- **Erro:** Uso de `JSON.stringify(req.body)` para reconstruir o payload original na verificação de assinatura (Linha 335 de `server.ts`).
- **Problema:** O Stripe exige o corpo "raw" (bruto) para a verificação. O `JSON.stringify` altera a ordem dos campos ou espaços, invalidando a assinatura e impedindo que o sistema processe renovações de assinatura ou confirmações de pagamento via webhook de forma confiável.

## 4. Inconsistências de Tipagem e Enums (Regras vs. Código)
Existe uma divergência entre as strings permitidas nas `firestore.rules` e os valores utilizados no frontend/backend.

- **Exemplo:** Enums de status como `concluido` vs `concluida`. Em sistemas de gestão de metas, discrepâncias de gênero em strings de status causam falhas silenciosas onde a regra bloqueia a escrita por não reconhecer o valor enviado pelo frontend.
- **Impacto:** Dificuldade de depuração e bloqueios inesperados em fluxos de conclusão de metas e tarefas.

## 5. Fragilidade no Ambiente de Build
O sistema de build apresentou falhas recorrentes por ausência do binário `vite`, indicando que as dependências do `package.json` não são instaladas automaticamente em todas as transições de ambiente.

- **Impacto:** Interrupção do fluxo de desenvolvimento e necessidade de intervenção manual para rodar `npm install`.

## 6. Gestão de Identidade Superadmin
Embora a verificação de admin tenha sido melhorada, o sistema ainda carece de uma gestão centralizada e robusta de papéis, alternando entre checagens na coleção `admins` e no campo `role: 'admin'` da coleção `users`, o que pode gerar inconsistências de acesso caso um dos locais não seja atualizado simultaneamente.

# Relatório de Pendências e Melhorias - PowerLife

Este relatório detalha as funcionalidades incompletas, placeholders e áreas que necessitam de refinamento no sistema PowerLife, com base na análise técnica realizada em abril de 2026.

## 1. Interface Pública (Home.tsx)
- **Links do Rodapé:** Os links "Termos de Uso", "Privacidade" e "Contato" são apenas placeholders que exibem um alerta informativo (`toast.info`). É necessário criar as páginas correspondentes ou integrar com um serviço de suporte/jurídico.
- **Botão de Demonstração:** O botão "Ver Demonstração" na seção Hero não possui ação vinculada.
- **Fluxo de Assinatura:** Os botões nos cards de preços apenas redirecionam para o cadastro. Não há integração real com gateways de pagamento (Stripe, etc.) para os planos "Profissional" e "Master".

## 2. Painel Administrativo (AdminPanel.tsx)
- **Cadastro de Usuários:** O botão "Cadastrar Usuário" abre um diálogo explicativo sobre um processo de duas etapas, mas não oferece uma interface direta para criação de contas administrativas ou convites automáticos.
- **Performance de Filtragem:** A busca e filtragem de usuários na tabela são realizadas no lado do cliente (`client-side`). Para bases de usuários maiores, isso deve ser migrado para consultas no Firestore (`server-side`).
- **Gestão de Usuários:** Não existe funcionalidade para excluir usuários ou redefinir senhas diretamente pelo painel admin.
- **Dossiê de Resultados:** A aba de resultados consolidados depende da seleção manual de clientes e pode necessitar de uma visualização mais agregada de métricas globais da plataforma.

## 3. Gestão de Clientes (Clients.tsx & ClientDetail.tsx)
- **Edição de Perfil:** Em `ClientDetail.tsx`, o botão "Editar Perfil" é um placeholder sem funcionalidade.
- **Agendamento Rápido:** O botão "Agendar Sessão" no detalhe do cliente é um placeholder.
- **Anotações do Profissional:** A seção de anotações é estática. É necessário implementar um sistema de CRUD para notas rápidas sobre o cliente que não sejam necessariamente sessões formais.
- **Histórico de Avaliações:** A aba de avaliações exibe uma mensagem genérica quando vazia. Seria útil ter atalhos diretos para aplicar cada tipo de ferramenta (DISC, SWOT, etc.) a partir dali.

## 4. Suporte e Ajuda (Suporte.tsx)
- **Canais de Contato:** O link para WhatsApp e o acesso aos "Manuais/Guias" são placeholders que exibem mensagens de "disponível em breve".
- **FAQ Estático:** As perguntas frequentes são fixas no código. Poderiam ser migradas para uma coleção no Firestore para facilitar a atualização sem necessidade de novo deploy.

## 5. Infraestrutura e Segurança (Firebase & Rules)
- **Configuração de Admin:** A regra de segurança `isAdmin` possui um e-mail hardcoded (`sys.powerlife@gmail.com`). Recomenda-se gerenciar permissões administrativas através de uma coleção de `admins` ou Custom Claims do Firebase Auth.
- **Persistência Offline:** Embora habilitada em `firebase.ts`, a persistência offline pode causar conflitos em ambientes com múltiplas abas abas abertas, o que já é tratado com um `console.warn`, mas pode confundir o usuário final.
- **Tratamento de Erros:** O `handleFirestoreError` é robusto, mas o sistema carece de uma página de erro global (404 ou 500) mais amigável para falhas críticas de permissão ou rede.

## 6. Ferramentas de Mentoring (Geral)
- **Portal do Cliente:** O sistema é focado no profissional. Não existe um "Portal do Cliente" onde o coachee/mentorado possa logar para responder avaliações ou ver seu progresso (mencionado como "em breve" no FAQ).
- **Exportação de Relatórios:** A funcionalidade de gerar relatórios em PDF (mencionada no plano Master) não foi identificada como totalmente implementada de forma automatizada em todas as ferramentas.

---
*Relatório gerado automaticamente para fins de auditoria de desenvolvimento.*

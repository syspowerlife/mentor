# Issue 02: Automação de E-mails Transacionais
**Data e Hora de Geração:** 04/05/2026 - 09:46:12 (Horário de Brasília)

## Descrição
Configurar o envio automático de e-mails para eventos críticos do sistema.

### Comportamento (Behavior)
- **Trigger System:** Listener no Firestore (via Cloud Functions ou lógica de serviço no backend) que detecta:
    - Criação de novo usuário -> Enviar Boas-vindas.
    - Sessão agendada < 24h -> Enviar Lembrete.
    - PDI aguardando aprovação -> Notificar Mentor/Cliente.
- **Template Engine:** Uso de templates HTML responsivos (MJML ou similar) injetando variáveis dinâmicas (Nome, Data, Link).

### Componentes (Component)
- `EmailSettingsForm.tsx`: Interface no Admin para testar envio e configurar logs de e-mail.

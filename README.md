# PowerLife - Sistema de Gestão Estratégica e Liderança

O PowerLife é uma plataforma full-stack moderna para coaches, gestores e profissionais de desenvolvimento humano, focada em assessments (DISC, SWOT, Roda da Vida) e gestão de clientes com inteligência artificial.

## 🚀 Tecnologias

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: Node.js, Express (integrado com Vite via middleware).
- **Banco de Dados & Auth**: Firebase (Firestore, Auth).
- **IA**: Google Gemini API (modelos Flash/Pro para insights).
- **Pagamentos**: Mercado Pago (Integração total com Webhooks e Assinaturas).
- **Comunicação**: Resend (E-mails transacionais).

## 🛠️ Instalação e Execução

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/powerlife.git
   cd powerlife
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure o ambiente**:
   - Copie o `.env.example` para `.env`.
   - Preencha as chaves do Firebase, Mercado Pago, Gemini e Resend.
   - Adicione o arquivo `firebase-applet-config.json` na raiz.

4. **Inicie em modo desenvolvimento**:
   ```bash
   npm run dev
   ```

## 🌐 Hospedagem (GitHub Pages)

Para hospedar no GitHub Pages:

1. **Configurações do Repositório**:
   - Vá em **Settings > Pages**.
   - Em **Build and deployment > Source**, escolha **GitHub Actions**.

2. **Segredos (Secrets)**:
   - Vá em **Settings > Secrets and variables > Actions**.
   - Adicione as seguintes chaves (opcional, ou o sistema usará 'mock' para o build):
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - ... (demais variáveis do Firebase)

3. **Deploy Automático**:
   - Sempre que você fizer um push para a branch `main` ou `master`, o GitHub Actions irá compilar e publicar o site automaticamente.

## 🏗️ Estrutura do Projeto

- `/src/pages`: Páginas principais (Dashboard, Clientes, Assessments).
- `/src/components`: Componentes reutilizáveis e UI (shadcn).
- `/src/services`: Integrações com APIs externas (Gemini, Firebase).
- `/server.ts`: Servidor Express com lógica de webhooks e API.
- `/firestore.rules`: Regras de segurança robustas do banco de dados.

## 🔒 Segurança (Plan Gate System)

O sistema possui um sistema de níveis de acesso:
- **FREE**: Limite de 3 clientes, sem IA, sem Google Calendar.
- **PRO**: Até 20 clientes, IA integrada, Google Calendar.
- **MASTER**: Clientes ilimitados, branding personalizado, suporte prioritário.

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

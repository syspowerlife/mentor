# Plano de Implementação: Expansão de Internacionalização (i18n)
**Data:** 04/05/2026

## 1. Visão Geral
O PowerLife visa o mercado global de coaching e mentoria. Atualmente, a cobertura i18n está concentrada no core do sistema, deixando ferramentas e o portal do cliente com strings hardcoded em Português.

## 2. Requisitos Técnicos
- **Framework:** `react-i18next`.
- **Idiomas Alvo:** Português (pt), Inglês (en), Espanhol (es).
- **Escopo:** `/src/pages/tools/*`, `/src/pages/portal/*`, `/src/components/tools/*`.

## 3. Arquitetura da Solução

### 3.1. Estrutura de Namespaces
Para facilitar a manutenção, dividiremos os arquivos de tradução (opcionalmente) ou usaremos prefixos claros no `translation.json`:
- `common.*`: Botões e labels genéricos.
- `tools.roda.*`: Strings da Roda da Vida.
- `tools.swot.*`: Strings da Análise SWOT.
- `portal.*`: Strings exclusivas do Portal do Cliente.

### 3.2. Tradução de Listas Estáticas
Muitas ferramentas usam arrays de constantes (ex: labels das 12 áreas da Roda). Estas devem ser movidas para o i18n:
```typescript
// Antes
const AREAS = ['Saúde', 'Finanças', ...];

// Depois
const { t } = useTranslation();
const areas = t('tools.roda.areas', { returnObjects: true }) as string[];
```

### 3.3. Configuração de Novo Idioma (Espanhol)
1. Criar `src/i18n/locales/es/translation.json`.
2. Registrar no `src/i18n/config.ts`.
3. Adicionar "Español" no seletor de idiomas (se houver UI para isso, ou via Perfil).

## 4. Etapas de Desenvolvimento

1. **Varredura de Ferramentas (Refactoring):** Substituir strings hardcoded por chaves `t('key')` em:
    - Roda da Vida
    - SWOT
    - DISC
    - Valores Pessoais
    - Metas SMART
2. **Criação dos JSONs de Tradução:** Popular `en` e `es`.
3. **Tradução de Feedbacks e Toasts:** Garantir que as mensagens de sucesso/erro (`sonner`) também sejam traduzidas.
4. **Validação de Layout:** Verificar se o layout quebra com palavras mais longas em Alemão/Espanhol (opcionalmente testando com strings longas).

## 5. Critérios de Aceite
- [ ] Troca de idioma altera 100% da UI visível nas ferramentas.
- [ ] O idioma selecionado persiste após o refresh.
- [ ] Inclusão do suporte oficial ao Espanhol.

---
*Plano elaborado por AI Coding Agent.*

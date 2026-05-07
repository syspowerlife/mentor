# Plano de Implementação: Exportação de Dossiê Consolidado
**Data:** 04/05/2026

## 1. Visão Geral
O Dossiê Consolidado é o produto final da jornada do cliente no PowerLife. Ele deve reunir em um único documento PDF profissional as avaliações comportamentais, metas e análises estratégicas.

## 2. Requisitos Técnicos
- **Bibliotecas:** `jspdf` e `html2canvas` (Processamento Client-side).
- **Dados:** Agregação de `rodas_da_vida`, `analises_swot`, `perfis_disc`, `valores_pessoais`, `metas_smart` e `pdis`.
- **Estilo:** Seguir os `design-guidelines` (frontend-design skill) para garantir um report com cara de "Editorial/Consultoria".

## 3. Arquitetura da Solução

### 3.1. Hook de Agregação: `useConsolidatedData(clienteId)`
Um hook customizado que:
1. Busca o perfil do cliente.
2. Busca a última `RodaDaVida`.
3. Busca a última `AnaliseSwot`.
4. Busca o `PerfilDisc` mais recente.
5. Busca os `ValoresPessoais`.
6. Lista as `MetasSmart` ativas e o `PDI` vigente.

### 3.2. Página de Preview: `/ferramentas/relatorio-final`
Esta página servirá como:
- **Visualização para o usuário:** Onde o mentor ajusta o que será exportado.
- **Base de Renderização:** O `html2canvas` lerá os elementos desta página para gerar as imagens do PDF.
- **Seções:**
    - Capa com Nome do Cliente e Logo PowerLife.
    - Sumário Executivo.
    - Seção Behavior (DISC + Valores).
    - Seção Diagnóstico (Roda da Vida).
    - Seção Estratégica (SWOT).
    - Plano de Ação (Metas SMART + PDI).

### 3.3. Serviço de Geração PDF
Lógica para quebrar as seções em páginas:
```typescript
const generatePDF = async () => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const sections = ['header', 'disc', 'roda', 'swot', 'pdi'];
  
  for (let i = 0; i < sections.length; i++) {
    const canvas = await html2canvas(document.getElementById(sections[i]));
    const imgData = canvas.toDataURL('image/png');
    if (i > 0) doc.addPage();
    doc.addImage(imgData, 'PNG', 0, 0, 210, 297); // Ajustar proporções
  }
  doc.save('Dossie-PowerLife.pdf');
};
```

## 4. Etapas de Desenvolvimento

1. **Criação da Página `/ferramentas/relatorio-final`:** Layout base com carregamento de dados.
2. **Componentes de Report:** Versões "estáticas" e polidas dos gráficos (Radar para Roda da Vida, Barras para DISC).
3. **Lógica de Exportação:** Implementar o gatilho de download com feedback de "Gerando PDF...".
4. **Tratamento de Internacionalização:** Garantir que o PDF seja gerado no idioma selecionado pelo usuário.

## 5. Critérios de Aceite
- [ ] O PDF contém todas as seções descritas.
- [ ] Gráficos do Recharts são renderizados corretamente no PDF.
- [ ] O arquivo exportado tem menos de 10MB.
- [ ] Suporte a múltiplas páginas funcional.

---
*Plano elaborado por AI Coding Agent.*

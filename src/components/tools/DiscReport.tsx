import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Download, Share2, Printer, Activity, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { ExportPdfButton } from '@/components/ExportPdfButton';

interface DiscReportProps {
  userData: {
    nome: string;
    data: string;
  };
  respostas: { id: number; valor: number }[];
  perguntasBase: any[];
}

const CORES_DISC = {
  D: '#dc2626',
  I: '#eab308',
  S: '#16a34a',
  C: '#2563eb',
};

export function DiscReport({ userData, respostas, perguntasBase }: DiscReportProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
Você é um especialista em análise comportamental DISC e geração de relatórios profissionais detalhados, no mesmo padrão de relatórios corporativos de perfil comportamental.

Sua tarefa é analisar respostas de um teste DISC e gerar um relatório completo, estruturado, profundo e descritivo, semelhante a relatórios profissionais de avaliação comportamental.

---

### 📥 ENTRADA

1. Dados do usuário:
${JSON.stringify(userData, null, 2)}

2. Respostas do teste (escala 1-5):
${JSON.stringify(respostas.map(r => ({ id: r.id, valor: Math.ceil(r.valor / 2) || 1 })), null, 2)}

3. Estrutura das perguntas DISC:
${JSON.stringify(perguntasBase, null, 2)}

---

### 📊 PROCESSAMENTO

1. Calcule:
- Soma por fator (D, I, S, C)
- Percentual de cada fator
- Perfil predominante
- Perfis secundários

2. Gere:
- Ranking dos fatores
- Intensidade comportamental
- Possíveis combinações (ex: "Estável Analítico", "Influente Estável")

---

### 📄 SAÍDA (FORMATO OBRIGATÓRIO)

Retorne um JSON estruturado seguindo exatamente este esquema:

{
  "capa": {
    "titulo": "Relatório de Perfil Comportamental",
    "nome": "string",
    "data": "string",
    "perfil": "string"
  },
  "grafico_pizza": [
    { "label": "Dominância", "valor": number },
    { "label": "Influência", "valor": number },
    { "label": "Estabilidade", "valor": number },
    { "label": "Conformidade", "valor": number }
  ],
  "grafico_barras": [
    { "label": "D", "valor": number },
    { "label": "I", "valor": number },
    { "label": "S", "valor": number },
    { "label": "C", "valor": number }
  ],
  "descricao_perfil": "string (texto LONGO, 8-12 parágrafos)",
  "pontos_fortes": [
    { "nome": "string", "descricao": "string", "pontuacao": number }
  ],
  "pontos_melhoria": [
    { "nome": "string", "descricao": "string" }
  ],
  "motivadores_carreira": [
    { "item": "string", "explicacao": "string", "pergunta_reflexiva": "string" }
  ],
  "ambiente_ideal": {
    "tipo": "string",
    "ritmo": "string",
    "cultura": "string",
    "lideranca": "string",
    "trabalho_equipe": "string"
  },
  "tomada_decisao": {
    "estilo": "string",
    "velocidade": "string"
  },
  "indices": {
    "D": number,
    "I": number,
    "S": number,
    "C": number,
    "media_geral": number,
    "perfil_predominante": "string"
  }
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(response.text || '{}');
      setReport(result);
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast.error(error.message || "Erro ao gerar relatório com IA. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-600 font-medium animate-pulse">Analisando seu perfil comportamental...</p>
        <p className="text-xs text-slate-400">Isso pode levar alguns segundos.</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center p-8 space-y-4">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Relatório Profissional DISC</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Gere um relatório completo com análise profunda, pontos fortes, motivadores e ambiente ideal baseado nas suas respostas.
        </p>
        <Button onClick={generateReport} className="bg-blue-600 hover:bg-blue-700">
          Gerar Relatório com IA
        </Button>
      </div>
    );
  }

  return (
    <div id="professional-report" className="space-y-12 pb-12">
      {/* Capa */}
      <div className="relative h-[400px] bg-slate-900 rounded-3xl overflow-hidden flex flex-col items-center justify-center text-white p-8 text-center">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="relative z-10 space-y-4">
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-4 py-1">Relatório Executivo</Badge>
          <h1 className="text-5xl font-black tracking-tighter uppercase">{report.capa.titulo}</h1>
          <div className="h-1 w-24 bg-blue-500 mx-auto my-6" />
          <p className="text-2xl font-light text-slate-300">{report.capa.nome}</p>
          <p className="text-sm text-slate-400 uppercase tracking-widest">{report.capa.data}</p>
          <div className="mt-8">
            <span className="text-xs text-slate-500 uppercase tracking-widest block mb-2">Perfil Identificado</span>
            <span className="text-3xl font-bold text-blue-400">{report.capa.perfil}</span>
          </div>
        </div>
      </div>

      {/* Gráficos e Índices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Intensidade Comportamental
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.grafico_barras}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {report.grafico_barras.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CORES_DISC[entry.label as keyof typeof CORES_DISC]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Distribuição %</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={report.grafico_pizza} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="valor"
                  nameKey="label"
                >
                  {report.grafico_pizza.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CORES_DISC[entry.label.charAt(0) as keyof typeof CORES_DISC]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {report.grafico_pizza.map((item: any) => (
                <div key={item.label} className="flex items-center gap-2 text-xs font-medium">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CORES_DESC[item.label.charAt(0) as keyof typeof CORES_DISC] }} />
                  <span className="text-slate-600">{item.label}: {item.valor}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Descrição Longa */}
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="prose prose-slate max-w-none">
          <h2 className="text-3xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4 mb-8">Análise Detalhada do Perfil</h2>
          <div className="text-slate-700 leading-relaxed space-y-6 text-lg whitespace-pre-wrap">
            {report.descricao_perfil}
          </div>
        </div>

        {/* Pontos Fortes */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-900">Principais Pontos Fortes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.pontos_fortes.map((ponto: any, idx: number) => (
              <div key={idx} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800">{ponto.nome}</h4>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{ponto.pontuacao}</span>
                </div>
                <p className="text-sm text-slate-600 leading-snug">{ponto.descricao}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Motivadores */}
        <div className="bg-slate-50 rounded-3xl p-8 space-y-8 border border-slate-100">
          <h3 className="text-2xl font-bold text-slate-900 text-center">Motivadores de Carreira</h3>
          <div className="space-y-6">
            {report.motivadores_carreira.map((mot: any, idx: number) => (
              <div key={idx} className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-400">
                  {idx + 1}
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-lg">{mot.item}</h4>
                  <p className="text-slate-600 leading-relaxed">{mot.explicacao}</p>
                  <p className="text-sm font-medium text-blue-600 italic">Reflexão: {mot.pergunta_reflexiva}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ambiente e Decisão */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-blue-600 text-white border-0 shadow-xl overflow-hidden">
            <CardHeader><CardTitle className="text-white">Ambiente Ideal de Trabalho</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-blue-200 text-xs uppercase tracking-widest">Ritmo e Cultura</span>
                <p className="font-medium">{report.ambiente_ideal.ritmo} | {report.ambiente_ideal.cultura}</p>
              </div>
              <div className="space-y-1">
                <span className="text-blue-200 text-xs uppercase tracking-widest">Liderança e Equipe</span>
                <p className="font-medium">{report.ambiente_ideal.lideranca} | {report.ambiente_ideal.trabalho_equipe}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-0 shadow-xl">
            <CardHeader><CardTitle className="text-white">Tomada de Decisão</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-slate-400 text-xs uppercase tracking-widest">Estilo Predominante</span>
                <p className="font-medium">{report.tomada_decisao.estilo}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-xs uppercase tracking-widest">Velocidade de Resposta</span>
                <p className="font-medium">{report.tomada_decisao.velocidade}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pontos de Melhoria */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-900">Oportunidades de Desenvolvimento</h3>
          <div className="space-y-4">
            {report.pontos_melhoria.map((ponto: any, idx: number) => (
              <div key={idx} className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-4">
                <AlertCircle className="w-6 h-6 text-orange-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-orange-900">{ponto.nome}</h4>
                  <p className="text-sm text-orange-800">{ponto.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 no-print">
        <ExportPdfButton targetId="professional-report" filename={`relatorio-disc-${report.capa.nome}`} title="Baixar Relatório Completo" />
        <Button variant="outline" onClick={() => setReport(null)}><Share2 className="w-4 h-4 mr-2" /> Compartilhar</Button>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}

const CORES_DESC = {
  D: '#dc2626',
  I: '#eab308',
  S: '#16a34a',
  C: '#2563eb',
};

import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClientDossier } from '@/hooks/useClientDossier';
import { RodaReportChart, DiscReportChart } from '@/components/tools/ReportCharts';
import { FileDown, Printer, ChevronLeft, Loader2, Sparkles, Target, Zap, Shield, User } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function ConsolidatedDossier() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: dossier, isLoading } = useClientDossier(id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-500 font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="p-8 text-center bg-slate-50 min-h-screen">
        <p className="text-slate-500">{t('errors.clientNotFound')}</p>
        <Button onClick={() => navigate(-1)} variant="link" className="mt-4"><ChevronLeft className="w-4 h-4 mr-2" /> {t('common.back')}</Button>
      </div>
    );
  }

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = reportRef.current.querySelectorAll('.pdf-page');
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false
        } as any);
        
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const imgData = canvas.toDataURL('image/png');
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }
      
      pdf.save(`${t('dossier.title')}-${dossier.profile?.name || t('common.client')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const AREAS = [
    { id: 'saude_fisica', label: t('roda.labels.saude_fisica') },
    { id: 'desenvolvimento_mental', label: t('roda.labels.desenvolvimento_mental') },
    { id: 'inteligencia_emocional', label: t('roda.labels.inteligencia_emocional') },
    { id: 'familia', label: t('roda.labels.familia') },
    { id: 'romance', label: t('roda.labels.romance') },
    { id: 'vida_social', label: t('roda.labels.vida_social') },
    { id: 'carreira', label: t('roda.labels.carreira') },
    { id: 'financas', label: t('roda.labels.financas') },
    { id: 'contribuicao_social', label: t('roda.labels.contribuicao_social') },
    { id: 'divertimento_lazer', label: t('roda.labels.divertimento_lazer') },
    { id: 'saude_ambiente', label: t('roda.labels.saude_ambiente') },
  ];

  const radarData = AREAS.map(area => ({
    subject: area.label,
    A: dossier.rodaData ? (dossier.rodaData[area.id] || 0) : 0
  }));

  const discChartData = [
    { name: t('disc.labels.d'), value: dossier.discData?.dominancia || 0 },
    { name: t('disc.labels.i'), value: dossier.discData?.influencia || 0 },
    { name: t('disc.labels.s'), value: dossier.discData?.estabilidade || 0 },
    { name: t('disc.labels.c'), value: dossier.discData?.conformidade || 0 },
  ];

  return (
    <div className="bg-slate-100 min-h-screen py-8">
      {/* Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm no-print sticky top-4 z-50 border border-slate-200">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-600">
          <ChevronLeft className="w-4 h-4 mr-1" /> {t('common.back')}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="border-slate-200">
            <Printer className="w-4 h-4 mr-2" /> {t('common.print')}
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
            {isGenerating ? t('dossier.generating') : t('dossier.export_pdf')}
          </Button>
        </div>
      </div>

      {/* Report Container */}
      <div ref={reportRef} className="max-w-[210mm] mx-auto space-y-4">
        
        {/* PAGE 1: COVER */}
        <div className="pdf-page w-[210mm] h-[297mm] bg-white p-20 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full -ml-48 -mb-48"></div>
          
          <div className="z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-800 tracking-tight">PowerLife</span>
            </div>
            
            <Badge className="bg-blue-100 text-blue-700 mb-4 border-none px-4 py-1">{t('dossier.title')}</Badge>
            <h1 className="text-6xl font-black text-slate-900 leading-tight mb-8">
              {t('dossier.cover.journey_of')} <br />
              <span className="text-blue-600">{dossier.profile?.name || t('common.client')}</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-lg mb-12">
              {t('dossier.cover.subtitle')}
            </p>
          </div>

          <div className="z-10 border-t border-slate-200 pt-8 flex justify-between items-end">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">{t('dossier.cover.mentor_label')}</p>
              <p className="text-lg font-bold text-slate-800">{dossier.profile?.mentor_name || t('dossier.cover.default_mentor')}</p>
            </div>
            <p className="text-sm font-medium text-slate-400">
              {new Date().toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : i18n.language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* PAGE 2: DIAGNÓSTICO (RODA DA VIDA) */}
        <div className="pdf-page w-[210mm] h-[297mm] bg-white p-16 shadow-lg">
          <div className="flex items-center gap-2 mb-8 text-blue-600">
            <Zap className="w-6 h-6" />
            <h2 className="text-2xl font-bold uppercase tracking-wider">{t('dossier.roda.title')}</h2>
          </div>
          
          <div className="space-y-12">
            <p className="text-slate-600 leading-relaxed italic text-center max-w-2xl mx-auto">
              {t('dossier.roda.quote')}
            </p>
            
            <RodaReportChart data={radarData} />
            
            <div className="grid grid-cols-2 gap-6 mt-12">
              <Card className="border border-slate-100 bg-slate-50/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm">{t('dossier.roda.leverage_points.title')}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500">{t('dossier.roda.leverage_points.desc')}</p>
                </CardContent>
              </Card>
              <Card className="border border-slate-100 bg-slate-50/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm">{t('dossier.roda.critical_areas.title')}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500">{t('dossier.roda.critical_areas.desc')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* PAGE 3: BEHAVIOR (DISC + VALORES) */}
        <div className="pdf-page w-[210mm] h-[297mm] bg-white p-16 shadow-lg">
          <div className="flex items-center gap-2 mb-8 text-blue-600">
            <User className="w-6 h-6" />
            <h2 className="text-2xl font-bold uppercase tracking-wider">{t('dossier.behavior.title')}</h2>
          </div>
          
          <div className="space-y-10">
             <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-l-4 border-blue-600 pl-3">{t('dossier.behavior.disc_title')}</h3>
              <p className="text-sm text-slate-500">{t('dossier.behavior.disc_desc')}</p>
              <DiscReportChart data={discChartData} />
             </div>

             <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-l-4 border-blue-600 pl-3">{t('dossier.behavior.values_title')}</h3>
              <div className="grid grid-cols-3 gap-4">
                {dossier.valoresData?.top_values?.map((val: string, idx: number) => (
                  <div key={idx} className="p-4 bg-blue-50 text-blue-800 rounded-xl font-bold text-center border border-blue-100">
                    {val}
                  </div>
                )) || <p className="col-span-3 text-slate-400 italic">{t('dossier.behavior.values_empty')}</p>}
              </div>
             </div>

             <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2">{t('dossier.behavior.ia_comments_title')}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <Trans 
                    i18nKey="dossier.behavior.ia_comments_template"
                    values={{ 
                      profileName: discChartData.sort((a,b) => b.value - a.value)[0].name,
                      values: dossier.valoresData?.top_values?.join(', ') || t('dossier.behavior.values_empty')
                    }}
                    components={[<span className="font-bold text-blue-600" />, <strong />]}
                  />
                </p>
             </div>
          </div>
        </div>

        {/* PAGE 4: ESTRATÉGIA (SWOT) */}
        <div className="pdf-page w-[210mm] h-[297mm] bg-white p-16 shadow-lg">
          <div className="flex items-center gap-2 mb-8 text-blue-600">
            <Shield className="w-6 h-6" />
            <h2 className="text-2xl font-bold uppercase tracking-wider">{t('dossier.swot.title')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-6 h-[70%]">
            <div className="p-8 bg-green-50 rounded-3xl border border-green-100 space-y-4">
              <h3 className="text-xl font-bold text-green-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">S</div>
                {t('swot.sections.strengths')}
              </h3>
              <ul className="text-sm space-y-2 text-green-800/80 list-disc pl-4">
                {dossier.swotData?.forcas?.map((f: string, i: number) => <li key={i}>{f}</li>) || <li>{t('dossier.swot.empty')}</li>}
              </ul>
            </div>

            <div className="p-8 bg-red-50 rounded-3xl border border-red-100 space-y-4">
              <h3 className="text-xl font-bold text-red-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs">W</div>
                {t('swot.sections.weaknesses')}
              </h3>
              <ul className="text-sm space-y-2 text-red-800/80 list-disc pl-4">
                {dossier.swotData?.fraquezas?.map((f: string, i: number) => <li key={i}>{f}</li>) || <li>{t('dossier.swot.empty')}</li>}
              </ul>
            </div>

            <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
              <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">O</div>
                {t('swot.sections.opportunities')}
              </h3>
              <ul className="text-sm space-y-2 text-blue-800/80 list-disc pl-4">
                {dossier.swotData?.oportunidades?.map((f: string, i: number) => <li key={i}>{f}</li>) || <li>{t('dossier.swot.empty')}</li>}
              </ul>
            </div>

            <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 space-y-4">
              <h3 className="text-xl font-bold text-amber-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs">T</div>
                {t('swot.sections.threats')}
              </h3>
              <ul className="text-sm space-y-2 text-amber-800/80 list-disc pl-4">
                {dossier.swotData?.ameacas?.map((f: string, i: number) => <li key={i}>{f}</li>) || <li>{t('dossier.swot.empty')}</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* PAGE 5: PLANO DE AÇÃO */}
        <div className="pdf-page w-[210mm] h-[297mm] bg-white p-16 shadow-lg">
          <div className="flex items-center gap-2 mb-8 text-blue-600">
            <Target className="w-6 h-6" />
            <h2 className="text-2xl font-bold uppercase tracking-wider">{t('dossier.action.title')}</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 tracking-tight flex items-center gap-2">
                {t('dossier.action.active_goals')}
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">{dossier.metas.length}</Badge>
              </h3>
              
              {dossier.metas.length > 0 ? (
                <div className="overflow-hidden border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">{t('smart.form.title_label')}</th>
                        <th className="px-4 py-3">{t('smart.form.deadline')}</th>
                        <th className="px-4 py-3">{t('smart.form.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dossier.metas.map((meta, idx) => (
                        <tr key={idx} className="bg-white hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-800">{meta.titulo}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{meta.prazo || meta.data_limite || '-'}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] capitalize bg-blue-50 text-blue-600 border-blue-100">
                              {meta.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                   <p className="text-sm text-slate-400">{t('smart.kanban.no_metas') || 'Nenhuma meta definida'}</p>
                </div>
              )}
            </div>

            <div className="mt-12">
              <h3 className="text-lg font-bold text-slate-800 mb-4 tracking-tight flex items-center gap-2">
                {t('dossier.action.pdi_title')}
              </h3>
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                <p className="text-sm text-slate-500">
                  <Trans 
                    i18nKey="dossier.action.pdi_desc"
                    values={{ count: dossier.pdiAcoes.length }}
                    components={[<br />, <strong />]}
                  />
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-20 text-center">
             <div className="w-10 h-10 bg-blue-600 rounded-lg mx-auto flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">
                {t('dossier.footer.end')} <br />
                {t('dossier.footer.system')}
              </p>
          </div>
        </div>

      </div>
    </div>
  );
}

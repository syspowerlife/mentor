import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';

interface ExportPdfButtonProps {
  targetId: string;
  filename: string;
  title: string;
  userName?: string;
  className?: string;
  onBlobGenerated?: (blob: Blob) => Promise<void>;
  buttonText?: string;
}

const DEFAULT_LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f695b8ca770d93e4eed7a4/6336fe853_POWERLIFE-app-small.png';

export function ExportPdfButton({ targetId, filename, title, userName, className, onBlobGenerated, buttonText }: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { userData } = useAuth();

  const handleExport = async () => {
    const element = document.getElementById(targetId);
    if (!element) {
      toast.error('Elemento para exportação não encontrado.');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading(onBlobGenerated ? 'Gerando e Salvando PDF...' : 'Gerando PDF...');

    try {
      // Determine logo to use (Master plan can have custom logo)
      const isMaster = userData?.plan === 'master';
      const logoToUse = (isMaster && userData?.photo_url) ? userData.photo_url : DEFAULT_LOGO;

      // Capture the element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (el: Element) => el.classList.contains('no-print'),
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            :root {
              --background: #ffffff !important;
              --foreground: #0f172a !important;
              --card: #ffffff !important;
              --card-foreground: #0f172a !important;
              --popover: #ffffff !important;
              --popover-foreground: #0f172a !important;
              --primary: #1e293b !important;
              --primary-foreground: #f8fafc !important;
              --secondary: #f1f5f9 !important;
              --secondary-foreground: #1e293b !important;
              --muted: #f1f5f9 !important;
              --muted-foreground: #64748b !important;
              --accent: #f1f5f9 !important;
              --accent-foreground: #1e293b !important;
              --destructive: #ef4444 !important;
              --border: #e2e8f0 !important;
              --input: #e2e8f0 !important;
              --ring: #94a3b8 !important;
            }
            /* Override common tailwind classes that might use oklch */
            .text-slate-900 { color: #0f172a !important; }
            .text-slate-800 { color: #1e293b !important; }
            .text-slate-700 { color: #334155 !important; }
            .text-slate-600 { color: #475569 !important; }
            .text-slate-500 { color: #64748b !important; }
            .text-slate-400 { color: #94a3b8 !important; }
            .text-blue-600 { color: #2563eb !important; }
            .text-blue-700 { color: #1d4ed8 !important; }
            .text-green-600 { color: #16a34a !important; }
            .text-purple-600 { color: #9333ea !important; }
            .bg-white { background-color: #ffffff !important; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-blue-50 { background-color: #eff6ff !important; }
            .border-slate-100 { border-color: #f1f5f9 !important; }
            .border-slate-200 { border-color: #e2e8f0 !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Header configuration
      const margin = 15;
      const headerHeight = 30;
      
      // Add Logo
      try {
        pdf.addImage(logoToUse, 'PNG', margin, 10, 30, 10);
      } catch (e) {
        console.warn('Could not add logo to PDF', e);
        // Fallback to default if custom fails
        if (logoToUse !== DEFAULT_LOGO) {
          try {
            pdf.addImage(DEFAULT_LOGO, 'PNG', margin, 10, 30, 10);
          } catch (e2) {
            console.error('Default logo also failed', e2);
          }
        }
      }
      
      // Add Title and Info
      pdf.setFontSize(16);
      pdf.setTextColor(30, 41, 59); // slate-800
      pdf.text(title, pdfWidth - margin, 15, { align: 'right' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // slate-500
      if (userName) {
        pdf.text(`Cliente: ${userName}`, pdfWidth - margin, 22, { align: 'right' });
      }
      pdf.text(`Data: ${new Date().toLocaleDateString()}`, pdfWidth - margin, 27, { align: 'right' });
      
      // Add a separator line
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.line(margin, headerHeight + 5, pdfWidth - margin, headerHeight + 5);
      
      // Calculate image dimensions to fit in PDF
      const imgProps = pdf.getImageProperties(imgData);
      const contentWidth = pdfWidth - (2 * margin);
      const contentHeight = (imgProps.height * contentWidth) / imgProps.width;
      
      // Add the captured content
      pdf.addImage(imgData, 'PNG', margin, headerHeight + 10, contentWidth, contentHeight);
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184); // slate-400
      const footerText = isMaster && userData?.name 
        ? `Relatório gerado por ${userData.name} via PowerLife`
        : 'Gerado por PowerLife - Plataforma de Mentoring e Desenvolvimento';
      pdf.text(footerText, pdfWidth / 2, pdfHeight - 10, { align: 'center' });

      // Save call or blob return
      if (onBlobGenerated) {
        const blob = pdf.output('blob');
        await onBlobGenerated(blob);
      } else {
        pdf.save(`${filename}.pdf`);
      }
      
      toast.success(onBlobGenerated ? 'Relatório salvo com sucesso!' : 'PDF gerado com sucesso!', { id: toastId });
    } catch (error: any) {
      console.error('Erro ao exportar PDF:', error);
      toast.error(error.message || 'Erro ao gerar o PDF. Tente novamente.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-2" />
      )}
      {isExporting ? 'Processando...' : (buttonText || 'Exportar PDF')}
    </Button>
  );
}

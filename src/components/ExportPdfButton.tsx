import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { PdfService } from '@/services/PdfService';

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
      const isMaster = userData?.plan === 'master';
      const logoUrl = (isMaster && userData?.photo_url) ? userData.photo_url : DEFAULT_LOGO;
      
      const footerText = isMaster && userData?.name 
        ? `Relatório gerado por ${userData.name} via PowerLife`
        : 'Gerado por PowerLife - Plataforma de Mentoring e Desenvolvimento';

      const blob = await PdfService.generateFromElement(element, {
        filename,
        title,
        userName,
        logoUrl,
        footerText
      });

      if (onBlobGenerated) {
        await onBlobGenerated(blob);
      } else {
        PdfService.downloadBlob(blob, filename);
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

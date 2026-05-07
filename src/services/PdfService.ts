import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  filename: string;
  title: string;
  userName?: string;
  logoUrl?: string;
  footerText?: string;
  margin?: number;
  headerHeight?: number;
}

export class PdfService {
  private static DEFAULT_LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f695b8ca770d93e4eed7a4/6336fe853_POWERLIFE-app-small.png';

  /**
   * Generates a PDF from a DOM element using html2canvas and jsPDF.
   */
  static async generateFromElement(element: HTMLElement, options: PdfExportOptions): Promise<Blob> {
    const {
      title,
      userName,
      logoUrl = this.DEFAULT_LOGO,
      footerText = 'Gerado por PowerLife - Plataforma de Mentoring e Desenvolvimento',
      margin = 15,
      headerHeight = 30
    } = options;

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
    
    // Add Logo
    try {
      pdf.addImage(logoUrl, 'PNG', margin, 10, 30, 10);
    } catch (e) {
      console.warn('Could not add logo to PDF, falling back to default', e);
      if (logoUrl !== this.DEFAULT_LOGO) {
        try {
          pdf.addImage(this.DEFAULT_LOGO, 'PNG', margin, 10, 30, 10);
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
    
    // Handle multi-page if necessary (basic implementation)
    // If contentHeight is more than available space, we might need a more complex solution
    // For now, we'll scale it to fit or just place it
    pdf.addImage(imgData, 'PNG', margin, headerHeight + 10, contentWidth, contentHeight);
    
    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text(footerText, pdfWidth / 2, pdfHeight - 10, { align: 'center' });

    return pdf.output('blob');
  }

  /**
   * Helper to trigger download of a blob
   */
  static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

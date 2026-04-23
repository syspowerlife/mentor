import React, { useState, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from 'react-i18next';

export function BatchExportButton() {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Filters
  const [department, setDepartment] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all necessary data
      const [usersSnap, pdisSnap, metasSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'pdis')),
        getDocs(collection(db, 'pdi_metas'))
      ]);

      const users = usersSnap.docs.reduce((acc: any, doc) => {
        acc[doc.id] = doc.data();
        return acc;
      }, {});

      let pdis = pdisSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      const metas = metasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      // Apply Filters
      if (department !== 'all') {
        pdis = pdis.filter(pdi => {
          const user = users[pdi.usuario_id];
          return user && user.setor === department;
        });
      }

      if (startDate) {
        pdis = pdis.filter(pdi => pdi.data_inicio >= startDate);
      }

      if (endDate) {
        pdis = pdis.filter(pdi => pdi.data_fim <= endDate);
      }

      // Build CSV
      const headers = ['Colaborador', 'Email', 'Cargo', 'Setor', 'Status PDI', 'Data Inicio', 'Data Fim', 'Meta', 'Status Meta', 'Progresso Meta'];
      const rows = [];

      for (const pdi of pdis) {
        const user = users[pdi.usuario_id] || {};
        const pdiMetas = metas.filter((m: any) => m.pdi_id === pdi.id);

        if (pdiMetas.length === 0) {
          rows.push([
            user.name || 'N/A',
            user.email || 'N/A',
            user.cargo || 'N/A',
            user.setor || 'N/A',
            pdi.status,
            pdi.data_inicio,
            pdi.data_fim,
            'N/A',
            'N/A',
            '0%'
          ]);
        } else {
          for (const meta of pdiMetas) {
            rows.push([
              user.name || 'N/A',
              user.email || 'N/A',
              user.cargo || 'N/A',
              user.setor || 'N/A',
              pdi.status,
              pdi.data_inicio,
              pdi.data_fim,
              meta.titulo,
              meta.status,
              `${meta.progresso || 0}%`
            ]);
          }
        }
      }

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `consolidado_pdi_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Exportação concluída com sucesso!');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Export Error:', error);
      toast.error(error.message || 'Erro ao exportar dados.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-slate-200 hover:bg-slate-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Consolidado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar Dados (CSV)</DialogTitle>
          <DialogDescription>
            Filtre os dados que deseja exportar. Deixe em branco para exportar tudo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              Setor
            </Label>
            <div className="col-span-3">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os setores</SelectItem>
                  <SelectItem value="Engenharia">Engenharia</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Produto">Produto</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="RH">RH</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-date" className="text-right">
              Data Início
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-date" className="text-right">
              Data Fim
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
